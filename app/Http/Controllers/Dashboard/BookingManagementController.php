<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Bookings/Index', [
            'bookings' => Booking::with('room')->latest()->paginate(30)->through(fn ($b) => $b)->items(),
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,cancelled,completed'],
        ]);

        $booking->update($validated);

        return back()->with('success', 'Booking updated.');
    }
}
