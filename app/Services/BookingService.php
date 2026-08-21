<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingService
{
    /**
     * Creates one Booking row per room unit in $items, all sharing a
     * group_reference, after re-checking availability inside the
     * transaction. Used by both the public booking flow (BookingController)
     * and the staff walk-in flow (Dashboard\BookingManagementController) —
     * whichever channel books a room first, it comes off the same
     * `quantity - overlapping bookings` count the other one reads from, so
     * a walk-in taken at the front desk immediately blocks that room
     * online, and vice versa.
     *
     * @param  array<int, array{room_id: string, quantity: int}>  $items
     * @param  array<string, mixed>  $attributes  first_name/last_name/email/phone/notes/status/payment_status/payment_method/created_by
     */
    public function createGroup(
        string $checkIn,
        string $checkOut,
        int $partySize,
        array $items,
        array $attributes
    ): Collection {
        $nights = Carbon::parse($checkIn)->diffInDays(Carbon::parse($checkOut));
        $groupReference = (string) Str::uuid();

        return DB::transaction(function () use ($checkIn, $checkOut, $partySize, $items, $attributes, $nights, $groupReference) {
            $created = collect();

            foreach ($items as $item) {
                $room = Room::availableBetween($checkIn, $checkOut)
                    ->withAvailableQuantity($checkIn, $checkOut)
                    ->whereKey($item['room_id'])
                    ->first();

                if (! $room || $room->available_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => 'Only '.($room?->available_quantity ?? 0)." \"".($room?->name ?? 'room')."\" room(s) left for those dates.",
                    ]);
                }

                for ($i = 0; $i < $item['quantity']; $i++) {
                    $created->push(Booking::create(array_merge([
                        'group_reference' => $groupReference,
                        'room_id' => $room->id,
                        'check_in' => $checkIn,
                        'check_out' => $checkOut,
                        'guests' => min($room->max_guests, $partySize),
                        'party_size' => $partySize,
                        'total_price' => $room->price * $nights,
                        'status' => 'pending',
                        'payment_status' => 'unpaid',
                    ], $attributes)));
                }
            }

            $primary = $created->first();
            $primary->update(['total_price' => $created->sum('total_price')]);

            return Collection::make($created)->load('room');
        });
    }
}
