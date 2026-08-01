<?php

use App\Http\Controllers\Dashboard\BookingManagementController;
use App\Http\Controllers\Dashboard\RoomManagementController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public site
Route::get('/', [PageController::class, 'welcome'])->name('home');
Route::get('/rooms', [PageController::class, 'rooms'])->name('rooms');
Route::get('/book', [PageController::class, 'bookSearch'])->name('book');
Route::get('/bookings/{reference}/confirmation', [PageController::class, 'bookingConfirmation'])->name('bookings.confirmation');
Route::get('/location', [PageController::class, 'location'])->name('location');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');

// Staff dashboard — everything here requires login. `/login` itself is
// NOT linked from the guest nav (see resources/js/Layouts/SiteLayout.tsx),
// staff just know the URL.
Route::middleware('auth')->prefix('dashboard')->name('dashboard.')->group(function () {
    Route::get('/', fn () => Inertia::render('Dashboard/Index'))->name('index');

    Route::middleware('role:manager,owner,system_admin')->group(function () {
        Route::resource('rooms', RoomManagementController::class)->except(['show']);
    });

    Route::resource('bookings', BookingManagementController::class)->only(['index', 'update']);
});

// Account settings (kept from Breeze, useful for staff to manage their own login)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
