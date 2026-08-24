<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Room;
use App\Services\IcsCalendarService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncBookingComCalendars extends Command
{
    protected $signature = 'bookings:sync-booking-com';

    protected $description = 'Pull each connected room\'s Booking.com iCal feed and reflect it locally, so a Booking.com reservation blocks the room here too.';

    public function handle(IcsCalendarService $ics): int
    {
        $rooms = Room::where('is_active', true)
            ->whereNotNull('ical_import_url')
            ->get();

        foreach ($rooms as $room) {
            try {
                $this->syncRoom($room, $ics);
            } catch (\Throwable $e) {
                // One room's feed being down (or misconfigured) shouldn't
                // stop the others from syncing.
                report($e);
                $this->error("Failed to sync {$room->name}: {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }

    private function syncRoom(Room $room, IcsCalendarService $ics): void
    {
        $response = Http::timeout(20)->get($room->ical_import_url);

        if ($response->failed()) {
            throw new \RuntimeException("HTTP {$response->status()} fetching iCal feed");
        }

        $events = $ics->parse($response->body());
        $seenUids = collect($events)->pluck('uid');

        foreach ($events as $event) {
            $nights = max(1, (new \DateTime($event['start']))->diff(new \DateTime($event['end']))->days);

            $booking = Booking::firstOrNew([
                'room_id' => $room->id,
                'source_uid' => $event['uid'],
            ]);

            if (! $booking->exists) {
                // Only set on first sight — once staff have taken this over
                // and filled in real guest details, later runs must never
                // touch first_name/last_name/status/payment again.
                $booking->fill([
                    'first_name' => '',
                    'last_name' => '',
                    'email' => null,
                    'phone' => '',
                    'guests' => 1,
                    'party_size' => 1,
                    'status' => BookingStatus::PENDING,
                    'payment_status' => 'unpaid',
                    'source' => 'booking_com',
                ]);
            }

            // Dates and price CAN legitimately change if the guest amends
            // their Booking.com reservation, so these refresh every run
            // regardless of whether staff have already claimed the booking.
            $booking->check_in = $event['start'];
            $booking->check_out = $event['end'];
            $booking->total_price = $room->price * $nights;
            $booking->save();
        }

        // Anything we previously synced from this room's feed that has now
        // dropped off it was cancelled on Booking.com's side — release it.
        Booking::where('room_id', $room->id)
            ->where('source', 'booking_com')
            ->whereNotIn('status', [
                BookingStatus::CANCELLED,
                BookingStatus::COMPLETED,
                BookingStatus::CHECKED_IN,
                BookingStatus::CHECKED_OUT,
            ])
            ->when($seenUids->isNotEmpty(), fn ($q) => $q->whereNotIn('source_uid', $seenUids))
            ->when($seenUids->isEmpty(), fn ($q) => $q->whereNotNull('source_uid'))
            ->update(['status' => BookingStatus::CANCELLED]);
    }
}
