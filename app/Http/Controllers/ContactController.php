<?php

namespace App\Http\Controllers;

use App\Services\GmailMailerService;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request, GmailMailerService $mailer)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $body = collect([
            "<p><strong>From:</strong> {$validated['name']} ({$validated['email']})</p>",
            '<p>'.nl2br(e($validated['message'])).'</p>',
        ])->implode('');

        try {
            $mailer->send(
                to: config('services.google_mail.from_email'),
                subject: "[Website] {$validated['subject']}",
                htmlBody: $body,
                replyTo: $validated['email'],
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => "Sorry, that didn't send — please try WhatsApp instead.",
            ], 500);
        }

        return response()->json(['message' => 'Message sent — we\'ll get back to you soon.']);
    }
}
