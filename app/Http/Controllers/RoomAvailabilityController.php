<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomAvailabilityController extends Controller
{
    /**
     * GET /api/rooms/available?check_in=2026-08-10&check_out=2026-08-12
     *
     * Intentionally does NOT return every room type. Nothing shows on the
     * booking page until the guest submits real dates — the frontend calls
     * this endpoint on date-form submit, not on page load.
     *
     * Guest count is NOT filtered here — a search is for a whole party,
     * which may need several rooms of several types. Each room comes back
     * with `available_quantity` so the frontend can offer a quantity
     * stepper per room type (capped at what's actually free) and let the
     * guest build a multi-room booking for their group.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
        ]);

        $rooms = Room::availableBetween($validated['check_in'], $validated['check_out'])
            ->withAvailableQuantity($validated['check_in'], $validated['check_out'])
            ->with('images')
            ->orderBy('price')
            ->get();

        return response()->json([
            'check_in' => $validated['check_in'],
            'check_out' => $validated['check_out'],
            'rooms' => $rooms,
        ]);
    }
}
