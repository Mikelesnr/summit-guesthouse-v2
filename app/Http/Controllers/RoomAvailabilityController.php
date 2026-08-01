<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomAvailabilityController extends Controller
{
    /**
     * GET /api/rooms/available?check_in=2026-08-10&check_out=2026-08-12&guests=2
     *
     * Intentionally does NOT return every room type. Nothing shows on the
     * booking page until the guest submits real dates — the frontend calls
     * this endpoint on date-form submit, not on page load.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:2'], // business rule: max 2 guests/room
        ]);

        $guests = $validated['guests'] ?? 1;

        $rooms = Room::availableBetween($validated['check_in'], $validated['check_out'], $guests)
            ->with('images')
            ->get();

        return response()->json([
            'check_in' => $validated['check_in'],
            'check_out' => $validated['check_out'],
            'guests' => $guests,
            'rooms' => $rooms,
        ]);
    }
}
