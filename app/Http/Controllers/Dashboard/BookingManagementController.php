<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingService;
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

    /** Walk-in booking form — reuses the same availability search as the public site. */
    public function create()
    {
        return Inertia::render('Dashboard/Bookings/Create');
    }

    /**
     * Books a walk-in directly against the same availability the public
     * site reads from (via BookingService), so a room taken at the front
     * desk is immediately unavailable online, and vice versa. Never goes
     * through Paynow — some walk-ins are cash clients, so payment is
     * recorded directly based on what staff collected.
     */
    public function store(Request $request, BookingService $bookings)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'phone' => ['required', 'string', 'max:30'],
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'party_size' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
            'payment_method' => ['required', 'in:cash,ecocash,onemoney,card'],
            'paid' => ['boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $paid = $validated['paid'] ?? false;

        $created = $bookings->createGroup(
            $validated['check_in'],
            $validated['check_out'],
            $validated['party_size'],
            $validated['items'],
            [
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'],
                'notes' => $validated['notes'] ?? null,
                'payment_method' => $validated['payment_method'],
                'status' => $paid ? 'confirmed' : 'pending',
                'payment_status' => $paid ? 'paid' : 'unpaid',
                'created_by' => $request->user()->id,
            ]
        );

        return redirect()->route('dashboard.bookings.index')
            ->with('success', "Booked {$created->count()} room(s) for {$validated['first_name']} {$validated['last_name']}.");
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
