<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Sends mail through the Gmail API using an OAuth2 refresh token, rather
 * than SMTP + app password. Used for the contact form and (later) booking
 * confirmation emails.
 *
 * Setup: create OAuth2 credentials in Google Cloud Console (Gmail API
 * enabled), authorise them once against the summitguestlodge@gmail.com
 * account with the `gmail.send` scope, and put the client id/secret and
 * the resulting refresh token in .env — see docs/GOOGLE_MAIL_SETUP.md.
 */
class GmailMailerService
{
    public function send(string $to, string $subject, string $htmlBody, ?string $replyTo = null): void
    {
        $token = $this->accessToken();
        $raw = $this->buildRawMessage($to, $subject, $htmlBody, $replyTo);

        $response = Http::withToken($token)
            ->post('https://www.googleapis.com/gmail/v1/users/me/messages/send', [
                'raw' => $raw,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Gmail API send failed: '.$response->body());
        }
    }

    private function accessToken(): string
    {
        return Cache::remember('gmail_api_access_token', now()->addMinutes(50), function () {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google_mail.client_id'),
                'client_secret' => config('services.google_mail.client_secret'),
                'refresh_token' => config('services.google_mail.refresh_token'),
                'grant_type' => 'refresh_token',
            ]);

            if ($response->failed()) {
                throw new RuntimeException('Could not refresh Gmail API access token: '.$response->body());
            }

            return $response->json('access_token');
        });
    }

    private function buildRawMessage(string $to, string $subject, string $htmlBody, ?string $replyTo): string
    {
        $fromEmail = config('services.google_mail.from_email');
        $fromName = config('services.google_mail.from_name');

        $headers = [
            "From: {$fromName} <{$fromEmail}>",
            "To: {$to}",
            'Subject: '.$this->encodeSubject($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
        ];

        if ($replyTo) {
            $headers[] = "Reply-To: {$replyTo}";
        }

        $message = implode("\r\n", $headers)."\r\n\r\n".$htmlBody;

        return rtrim(strtr(base64_encode($message), '+/', '-_'), '=');
    }

    private function encodeSubject(string $subject): string
    {
        return '=?UTF-8?B?'.base64_encode($subject).'?=';
    }
}
