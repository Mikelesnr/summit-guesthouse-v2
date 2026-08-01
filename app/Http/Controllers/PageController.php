<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function welcome()
    {
        return Inertia::render('Welcome', [
            'featuredRooms' => Room::where('is_active', true)
                ->where('is_featured', true)
                ->with('images')
                ->get(),
        ]);
    }

    public function rooms()
    {
        return Inertia::render('Rooms', [
            'rooms' => Room::where('is_active', true)->with('images')->orderBy('price')->get(),
        ]);
    }

    // Booking search page. Accepts optional ?check_in&check_out&guests
    // from the homepage search card so the form is pre-filled, but the
    // actual room list is always fetched client-side via /api/rooms/available.
    public function bookSearch(Request $request)
    {
        return Inertia::render('Booking/Search', [
            'initialSearch' => $request->only(['check_in', 'check_out', 'guests']) ?: null,
        ]);
    }

    public function bookingConfirmation(string $reference)
    {
        $booking = Booking::with('room')->where('reference', $reference)->firstOrFail();

        $status = match (true) {
            $booking->payment_status === 'paid' => 'paid',
            $booking->payment_status === 'unpaid' && $booking->created_at->lt(now()->subMinutes(30)) => 'failed',
            default => 'pending',
        };

        return Inertia::render('Booking/Confirmation', compact('booking', 'status'));
    }

    public function location()
    {
        return Inertia::render('Location');
    }

    public function contact()
    {
        return Inertia::render('Contact');
    }
}
