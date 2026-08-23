<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Enums\BookingStatus;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Bookings/Index', [
            'bookings' => Booking::with('room')->latest()->paginate(12)->withQueryString(),
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

    /**
     * A guest's Paynow payment failed or was abandoned — the booking is
     * left sitting there (still blocking the room, since it's still
     * `pending`/`unpaid`) with `created_by` null (a customer, not staff).
     * This lets a staff member take it over: record how the guest actually
     * paid, and stamp it as theirs — same shape as a walk-in booking from
     * that point on, just without re-entering the guest's details or
     * re-running the availability check.
     */
    public function takeOver(Request $request, Booking $booking)
    {
        abort_if($booking->payment_status === 'paid', 422, 'This booking is already paid — nothing to take over.');

        $validated = $request->validate([
            'payment_method' => ['required', 'in:cash,ecocash,onemoney,card'],
            'paid' => ['boolean'],
        ]);

        $paid = $validated['paid'] ?? true;

        $query = $booking->group_reference
            ? Booking::where('group_reference', $booking->group_reference)
            : Booking::whereKey($booking->id);

        $query->update([
            'created_by' => $request->user()->id,
            'payment_method' => $validated['payment_method'],
            'status' => $paid ? 'confirmed' : 'pending',
            'payment_status' => $paid ? 'paid' : 'unpaid',
        ]);

        return back()->with('success', 'Booking taken over — now handled as a walk-in.');
    }

    /**
     * Check in an individual room booking.
     */
    public function checkIn(Request $request, Booking $booking)
    {
        $booking->update([
            'status' => BookingStatus::CHECKED_IN,
            'actual_check_in_at' => now(),
        ]);

        return back()->with('success', "{$booking->first_name}'s room checked in.");
    }

    /**
     * Check in ALL rooms associated with the group reference.
     */
    public function checkInGroup(Request $request, Booking $booking)
    {
        $query = $booking->group_reference
            ? Booking::where('group_reference', $booking->group_reference)
            : Booking::whereKey($booking->id);

        $query->update([
            'status' => BookingStatus::CHECKED_IN,
            'actual_check_in_at' => now(),
        ]);

        return back()->with('success', 'All rooms in the group booking checked in successfully.');
    }

    /**
     * Check out an individual room booking.
     */
    public function checkOut(Request $request, Booking $booking)
    {
        $booking->update([
            'status' => BookingStatus::CHECKED_OUT,
            'actual_check_out_at' => now(),
        ]);

        return back()->with('success', "{$booking->first_name}'s room checked out.");
    }

    public function checkOutGroup(Booking $booking)
    {
        if (!$booking->group_reference) {
            return back()->with('error', 'This booking is not part of a group.');
        }

        Booking::where('group_reference', $booking->group_reference)
            ->where('status', 'checked_in')
            ->update(['status' => 'checked_out']);

        return back()->with('success', 'All checked-in guests in this group have been checked out.');
    }
}
