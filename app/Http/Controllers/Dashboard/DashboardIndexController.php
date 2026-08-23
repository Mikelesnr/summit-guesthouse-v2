<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardIndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $user = $request->user();

        $userRole = $user->role instanceof UserRole ? $user->role->value : $user->role;
        $canViewRevenue = in_array($userRole, UserRole::canViewRevenue());

        $stats = [
            // Captures both expected arrivals today and those already checked in today
            'checkinsToday' => Booking::whereDate('check_in', $today)
                ->whereIn('status', ['confirmed', 'checked_in'])
                ->count(),

            // Pending online bookings requiring staff confirmation/takeover
            'pending' => Booking::where('status', 'pending')->count(),

            // Currently active guests occupying rooms
            'occupied' => Booking::where('status', 'checked_in')->count(),

            // Total paid revenue for the current calendar month (restricted by role)
            'monthlyRevenue' => $canViewRevenue
                ? Booking::where('payment_status', 'paid')
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->sum('total_price')
                : null,
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'canViewRevenue' => $canViewRevenue,
        ]);
    }
}
