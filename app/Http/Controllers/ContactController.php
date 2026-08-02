<?php

namespace App\Http\Controllers;

use App\Mail\ContactAcknowledgement;
use App\Mail\ContactNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    /**
     * Store a newly created contact message.
     */
    public function store(Request $request)
    {
        // 1. Validate the incoming request data
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        try {
            // Send thank-you email to sender
            Mail::to($validated['email'])->send(new ContactAcknowledgement($validated));

            // Send notification email to you
            Mail::to('micky.mpd@gmail.com')->send(new ContactNotification($validated));
        } catch (\Exception $e) {
            Log::error('❌ Email sending failed: ' . $e->getMessage());
            Log::debug('📦 Payload:', $validated);

            return response()->json([
                'success' => false,
                'message' => 'Email failed to send. Please try again later.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Thanks for reaching out! I’ll get back to you soon.',
        ]);

    }
}