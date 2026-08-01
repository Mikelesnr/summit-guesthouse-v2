<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Rooms/Index', [
            'rooms' => Room::orderBy('price')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:single,double'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'size' => ['nullable', 'integer', 'min:0'],
            'max_guests' => ['required', 'integer', 'min:1', 'max:2'],
            'quantity' => ['required', 'integer', 'min:0'],
            'has_breakfast' => ['boolean'],
            'pets_allowed' => ['boolean'],
        ]);

        Room::create($validated);

        return back()->with('success', 'Room added.');
    }

    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'max_guests' => ['sometimes', 'integer', 'min:1', 'max:2'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $room->update($validated);

        return back()->with('success', 'Room updated.');
    }

    public function destroy(Room $room)
    {
        // Soft-disable rather than hard delete, so historical bookings keep their room reference.
        $room->update(['is_active' => false]);

        return back()->with('success', 'Room disabled.');
    }
}
