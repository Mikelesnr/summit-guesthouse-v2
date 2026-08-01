<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use App\Services\PaynowService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function store(Request $request, PaynowService $paynow)
    {
        $validated = $request->validate([
            'room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'phone' => ['required', 'string', 'max:30'],
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'guests' => ['required', 'integer', 'min:1', 'max:2'], // business rule
            'notes' => ['nullable', 'string'],
        ]);

        // Re-check availability server-side — never trust what the client
        // saw on the search page, someone else may have booked it since.
        $room = Room::availableBetween($validated['check_in'], $validated['check_out'], $validated['guests'])
            ->whereKey($validated['room_id'])
            ->firstOrFail();

        $nights = \Carbon\Carbon::parse($validated['check_in'])
            ->diffInDays(\Carbon\Carbon::parse($validated['check_out']));

        $booking = Booking::create([
            ...$validated,
            'total_price' => $room->price * $nights,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $payment = $paynow->initiate($booking);

        return response()->json([
            'booking' => $booking->load('room'),
            'redirect_url' => $payment->redirect_url ?? null,
        ]);
    }
}
