<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Services\IcsCalendarService;
use Illuminate\Http\Response;

class RoomIcalController extends Controller
{
    /**
     * GET /ical/rooms/{room}.ics
     *
     * Must stay outside the `auth` middleware: Booking.com's own servers
     * poll this on their own schedule, unauthenticated, same as any other
     * OTA calendar feed. The room's UUID is the only "credential", the same
     * level of obscurity every free iCal integration relies on.
     *
     * Booking.com can only treat a room type as one unit over iCal, so this
     * feed says "not available" only for nights when every room of this
     * type is taken, not for each individual booking.
     *
     * Bookings that came from Booking.com itself are left out of the count.
     * Booking.com already blocks its own unit for those nights, and echoing
     * them back would only delay the room reopening after a cancellation.
     */
    public function export(Room $room, IcsCalendarService $ics): Response
    {
        $today = now()->toDateString();

        $stays = $room->bookings()
            ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
            ->where(fn($query) => $query->whereNull('source')->orWhere('source', '!=', 'booking_com'))
            ->where('check_out', '>', $today)
            ->get(['check_in', 'check_out'])
            ->map(fn($booking) => [
                'start' => $booking->check_in->toDateString(),
                'end' => $booking->check_out->toDateString(),
            ])
            ->all();

        // A room type that is switched off is as good as sold out.
        $quantity = $room->is_active ? $room->quantity : 0;

        $ranges = $ics->fullRanges($stays, $quantity, $today);

        return response($ics->buildBlockedRanges($room->name, $room->id, $ranges), 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'inline; filename="' . $room->slug . '.ics"',
        ]);
    }
}
