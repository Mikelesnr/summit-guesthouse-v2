<?php

namespace App\Mail\Transport;

// use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;
use Illuminate\Support\Facades\Http;
use Exception;

class GoogleApiTransport extends AbstractTransport
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $refreshToken;

    public function __construct(string $clientId, string $clientSecret, string $refreshToken)
    {
        parent::__construct();
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->refreshToken = $refreshToken;
    }

    /**
     * Send the web-safe base64url encoded RFC 2822 message via Google REST API.
     */
    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        // 1. Fetch an immediate fresh short-lived Access Token using your Refresh Token
        $accessToken = $this->getFreshAccessToken();

        // 2. Convert standard email payload to string and encode to base64url format
        $rawEmailString = $email->toString();
        $base64UrlEmail = $this->base64UrlEncode($rawEmailString);

        // 3. Post to the Gmail API endpoint over secure HTTPS port 443
        $response = Http::withToken($accessToken)
            ->post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', [
                'raw' => $base64UrlEmail
            ]);

        if ($response->failed()) {
            throw new Exception('Google API Mail Delivery Failed: ' . $response->body());
        }
    }

    /**
     * Exchange the offline refresh token for a live access token.
     */
    protected function getFreshAccessToken(): string
    {
        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $this->refreshToken,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            throw new Exception('Failed to refresh Google API Access Token: ' . $response->body());
        }

        return $response->json('access_token');
    }

    /**
     * Web-safe base64 encoding standard required by Google REST endpoints.
     */
    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    public function __toString(): string
    {
        return 'google_api';
    }
}
