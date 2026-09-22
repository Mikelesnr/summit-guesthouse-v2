<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'paynow' => [
        'integration_id'  => env('PAYNOW_INTEGRATION_ID'),
        'integration_key' => env('PAYNOW_INTEGRATION_KEY'),
        'test_email'      => env('PAYNOW_TEST_EMAIL'),
        'sandbox'         => env('PAYNOW_SANDBOX', false),
        'result_url'      => env('PAYNOW_RESULT_URL'),
        'return_url'      => env('PAYNOW_RETURN_URL'),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.1-flash-lite'),
    ],

    'google' => [
        'client_id' => env('OAUTH_CLIENT_ID'),
        'client_secret' => env('OAUTH_CLIENT_SECRET'),
        'refresh_token' => env('OAUTH_REFRESH_TOKEN'),
        // The Gmail account these OAuth credentials were authorised
        // against — Gmail API sends as whoever the token belongs to,
        // this is just used for the "From" display name/reply-to fallback.
        'from_email' => env('GOOGLE_MAIL_FROM', 'summitguestlodge@gmail.com'),
        'from_name' => env('GOOGLE_MAIL_FROM_NAME', 'Summit Lodge'),
    ],

    'admin' => [
        'name' => env('ADMIN_NAME', 'System Administrator'),
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],


];
