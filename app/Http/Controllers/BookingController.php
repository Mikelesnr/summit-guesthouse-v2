<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use App\Services\PaynowService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    public function store(Request $request, PaynowService $paynow)
    {
        Log::info('Booking Request Payload:', $request->all());

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'phone' => ['required', 'string', 'max:30'],
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'party_size' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $nights = Carbon::parse($validated['check_in'])->diffInDays(Carbon::parse($validated['check_out']));
        $groupReference = (string) Str::uuid();

        $bookings = DB::transaction(function () use ($validated, $nights, $groupReference) {
            $created = collect();

            foreach ($validated['items'] as $item) {
                $room = Room::availableBetween($validated['check_in'], $validated['check_out'])
                    ->withAvailableQuantity($validated['check_in'], $validated['check_out'])
                    ->whereKey($item['room_id'])
                    ->first();

                if (!$room || $room->available_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Only " . ($room?->available_quantity ?? 0) . " \"" . ($room?->name ?? 'room') . "\" room(s) left for those dates.",
                    ]);
                }

                for ($i = 0; $i < $item['quantity']; $i++) {
                    $created->push(Booking::create([
                        'group_reference' => $groupReference,
                        'room_id' => $room->id,
                        'first_name' => $validated['first_name'],
                        'last_name' => $validated['last_name'],
                        'email' => $validated['email'],
                        'phone' => $validated['phone'],
                        'check_in' => $validated['check_in'],
                        'check_out' => $validated['check_out'],
                        'guests' => min($room->max_guests, $validated['party_size']),
                        'party_size' => $validated['party_size'],
                        'total_price' => $room->price * $nights,
                        'notes' => $validated['notes'] ?? null,
                        'status' => 'pending',
                        'payment_status' => 'unpaid',
                    ]));
                }
            }

            return $created;
        });

        // The first booking serves as the anchor record for Paynow
        $primary = $bookings->first();

        // Initiate payment (PaynowService sums all $lineItems automatically)
        $payment = $paynow->initiate($primary->fresh('room'));

        $eloquentBookings = Collection::make($bookings)->load('room');

        return response()->json([
            'group_reference' => $groupReference,
            'bookings' => $eloquentBookings,
            'redirect_url' => $payment->redirect_url ?? null,
        ]);
    }
}
