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

// Server-to-Server POST Callback from Paynow
Route::post('/payments/paynow/callback', [PaynowCallbackController::class, 'callback'])
    ->name('paynow.callback');

// Status Poll Endpoint (Frontend passes payment ID)
Route::get('/payments/paynow/{payment}/status', [PaynowCallbackController::class, 'status'])
    ->name('paynow.status');
