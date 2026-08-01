<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PaynowCallbackController;
use App\Http\Controllers\RoomAvailabilityController;
use Illuminate\Support\Facades\Route;

Route::get('/rooms/available', [RoomAvailabilityController::class, 'index']);
Route::post('/bookings', [BookingController::class, 'store']);
Route::post('/chatbot', [ChatbotController::class, 'respond']);
Route::post('/contact', [ContactController::class, 'store']);

// Paynow calls this directly — the `api` middleware group is stateless
// (no CSRF, no session), which is what a server-to-server callback needs.
Route::post('/payments/paynow/{payment}/callback', [PaynowCallbackController::class, 'callback'])
    ->name('paynow.callback');
Route::get('/payments/paynow/{payment}/status', [PaynowCallbackController::class, 'status'])
    ->name('paynow.status');


Route::post('/payments/paynow/callback', [PaynowCallbackController::class, 'handleGenericCallback']);
