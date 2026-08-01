# Gmail API mailer setup

The contact form sends mail through the Gmail API using OAuth2, not SMTP —
`app/Services/GmailMailerService.php` handles the token refresh and the
raw send call.

## What goes in .env

```env
GOOGLE_MAIL_CLIENT_ID=your-oauth-client-id
GOOGLE_MAIL_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_MAIL_REFRESH_TOKEN=your-refresh-token
GOOGLE_MAIL_FROM=summitguestlodge@gmail.com
GOOGLE_MAIL_FROM_NAME="Summit Lodge"
```

You said you already have the client id/secret/refresh token — drop them
straight in. `GOOGLE_MAIL_FROM` should match the Gmail account those
credentials were authorised against (Gmail API sends as whoever the token
belongs to, regardless of what's in the From header).

## If you ever need to regenerate the refresh token

1. In Google Cloud Console, on the OAuth client, make sure the **Gmail
   API** is enabled and the client has the `https://www.googleapis.com/auth/gmail.send`
   scope.
2. Run the OAuth consent flow once for `summitguestlodge@gmail.com`
   (Google's OAuth Playground at https://developers.google.com/oauthplayground
   is the fastest way — plug in your own client id/secret under the gear
   icon, authorise the `gmail.send` scope, then exchange for a refresh
   token).
3. That refresh token doesn't expire on its own (unless revoked or unused
   for 6 months), so this is a one-time setup.

## Where it's used

- `ContactController` — the `/contact` page form
- Not yet wired: booking confirmation emails (the Paynow callback updates
  `payment_status` but doesn't send mail yet). `GmailMailerService::send()`
  is already reusable for that whenever you want it added.
