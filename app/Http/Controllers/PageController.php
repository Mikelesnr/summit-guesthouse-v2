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

    public function roomShow(string $slug)
    {
        $room = Room::where('slug', $slug)->where('is_active', true)->with('images')->firstOrFail();

        return Inertia::render('Rooms/Show', compact('room'));
    }

    // Booking search page. Accepts optional ?check_in&check_out&guests
    // from the homepage search card so the form is pre-filled, but the
    // actual room list is always fetched client-side via /api/rooms/available.
    public function bookSearch(Request $request)
    {
        return Inertia::render('Booking/Search', [
            'initialSearch' => $request->only(['check_in', 'check_out', 'party_size']) ?: null,
        ]);
    }

    public function bookingConfirmation(string $reference)
    {
        $primary = Booking::with('room')->where('reference', $reference)->firstOrFail();

        $bookings = $primary->group_reference
            ? Booking::with('room')->where('group_reference', $primary->group_reference)->get()
            : collect([$primary]);

        $status = match (true) {
            $primary->payment_status === 'paid' => 'paid',
            $primary->payment_status === 'unpaid' && $primary->created_at->lt(now()->subMinutes(30)) => 'failed',
            default => 'pending',
        };

        return Inertia::render('Booking/Confirmation', [
            'bookings' => $bookings,
            'total' => $bookings->sum('total_price'),
            'status' => $status,
        ]);
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
