<?php

use App\Http\Controllers\Dashboard\BookingManagementController;
use App\Http\Controllers\Dashboard\DashboardIndexController;
use App\Http\Controllers\Dashboard\RoomManagementController;
use App\Http\Controllers\Dashboard\UserManagementController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PaynowCallbackController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoomIcalController;
use Illuminate\Support\Facades\Route;

// Public site
Route::get('/', [PageController::class, 'welcome'])->name('home');
Route::get('/rooms', [PageController::class, 'rooms'])->name('rooms');
Route::get('/rooms/{slug}', [PageController::class, 'roomShow'])->name('rooms.show');
Route::get('/book', [PageController::class, 'bookSearch'])->name('book');
Route::get('/bookings/{reference}/confirmation', [PageController::class, 'bookingConfirmation'])->name('bookings.confirmation');
Route::get('/location', [PageController::class, 'location'])->name('location');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');

// Outbound calendar feed for Booking.com (and any future OTA) to subscribe
// to — deliberately outside the `auth` group, their servers poll this
// unauthenticated, same as every other free iCal integration.
Route::get('/ical/rooms/{room}.ics', [RoomIcalController::class, 'export'])->name('rooms.ical');

// Staff dashboard — main overview at /dashboard
Route::middleware('auth')->prefix('dashboard')->name('dashboard.')->group(function () {
    // Overview tab landing page
    Route::get('/', DashboardIndexController::class)->name('index');

    // Manager / Owner / System Admin restricted routes
    Route::middleware('role:manager,owner,system_admin')->group(function () {
        Route::resource('rooms', RoomManagementController::class)->except(['show']);
        Route::resource('users', UserManagementController::class)->except(['show']);
    });

    // Booking management routes
    Route::resource('bookings', BookingManagementController::class)->only(['index', 'create', 'store', 'update']);

    Route::put('bookings/{booking}/take-over', [BookingManagementController::class, 'takeOver'])
        ->name('bookings.take-over');

    Route::put('bookings/{booking}/check-in', [BookingManagementController::class, 'checkIn'])
        ->name('bookings.check-in');

    Route::put('bookings/{booking}/check-in-group', [BookingManagementController::class, 'checkInGroup'])
        ->name('bookings.check-in-group');

    Route::put('bookings/{booking}/check-out', [BookingManagementController::class, 'checkOut'])
        ->name('bookings.check-out');

    Route::put('bookings/{booking}/check-out-group', [BookingManagementController::class, 'checkOutGroup'])
        ->name('bookings.check-out-group');
});

// Browser redirect back from Paynow checkout
Route::get('/payments/paynow/return', [PaynowCallbackController::class, 'paymentReturn'])
    ->name('paynow.return');

// Account settings
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
