<?php

namespace App\Mail\Transports;

use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;
use Google\Client;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use Exception;
use Illuminate\Support\Facades\Log;

class GmailApiTransport extends AbstractTransport
{
    protected Client $client;
    protected Gmail $service;

    public function __construct()
    {
        parent::__construct();

        // Retrieve credentials from environment variables
        $clientId = env('GOOGLE_MAIL_CLIENT_ID');
        $clientSecret = env('GOOGLE_MAIL_CLIENT_SECRET');
        $refreshToken = env('GOOGLE_MAIL_REFRESH_TOKEN');

        // Log the state of credentials to help debug
        Log::debug('GmailApiTransport: Checking credentials', [
            'client_id_found' => !empty($clientId),
            'client_secret_found' => !empty($clientSecret),
            'refresh_token_found' => !empty($refreshToken),
        ]);

        $this->client = new Client();
        $this->client->setClientId($clientId);
        $this->client->setClientSecret($clientSecret);
        $this->client->addScope(Gmail::GMAIL_SEND);

        // Fetch the access token using your refresh token[cite: 7]
        $accessToken = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);

        // Log the full response from Google to debug the 'Bad Request'[cite: 7]
        Log::debug('GmailApiTransport: Token Response from Google', ['response' => $accessToken]);

        // Check if the token fetch was successful
        if (isset($accessToken['error'])) {
            throw new Exception('Gmail API Authentication failed: ' . ($accessToken['error_description'] ?? 'Unknown error'));
        }

        // Set the access token so the client includes it in API requests[cite: 7]
        $this->client->setAccessToken($accessToken);

        $this->service = new Gmail($this->client);
    }

    /**
     * This is the method Laravel calls when it processes an outbound mail payload.
     */
    protected function doSend(SentMessage $message): void
    {
        // Convert Laravel's clean Mailable object chain back into a valid RFC 2822 email string[cite: 7]
        $email = MessageConverter::toEmail($message->getOriginalMessage());
        $rawMessageString = $email->toString();

        // Encode the compiled payload into Google's strict web-safe base64 format[cite: 7]
        $mimeSafeString = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($rawMessageString));

        try {
            $gmailMessage = new Message();
            $gmailMessage->setRaw($mimeSafeString);

            // Broadcast the message over standard port 443 HTTPS REST traffic[cite: 7]
            $this->service->users_messages->send('me', $gmailMessage);
        } catch (Exception $e) {
            throw new Exception('Gmail API Custom Driver failed: ' . $e->getMessage());
        }
    }

    /**
     * Get the string representation of the transport.
     */
    public function __toString(): string
    {
        return 'gmail_api';
    }
}