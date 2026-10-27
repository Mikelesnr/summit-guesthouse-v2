<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Paynow\Payments\Paynow;

class PaynowService
{
    private Paynow $paynow;
    private bool $isSandbox;
    private ?string $testEmail;

    public function __construct()
    {
        // trim() guards against a trailing space/newline from copy-pasting
        // these out of Paynow's dashboard — invisible in .env, but it
        // silently breaks hash computation and produces an "Invalid Hash"
        // error that looks like a credentials problem either way.
        $id = trim((string) config('services.paynow.integration_id'));
        $key = trim((string) config('services.paynow.integration_key'));

        $this->isSandbox = (bool) config('services.paynow.sandbox', false);
        $this->testEmail = config('services.paynow.test_email');

        // Dynamically resolve active host (ngrok tunnel during web requests, or APP_URL fallback)
        $baseUrl = request()->getSchemeAndHttpHost() ?: config('app.url');

        $resultUrl = config('services.paynow.result_url') ?? "{$baseUrl}/api/payments/paynow/callback";
        $returnUrl = config('services.paynow.return_url') ?? "{$baseUrl}/payments/paynow/return";

        $this->paynow = new Paynow($id, $key, $returnUrl, $resultUrl);
    }

    public function initiate(Booking $booking): Payment
    {
        // 1. Fetch all bookings in the group if multi-room, or fallback to single
        $lineItems = $booking->group_reference
            ? Booking::where('group_reference', $booking->group_reference)->with('room')->get()
            : collect([$booking]);

        // 2. Calculate true combined total across all booked rooms
        $totalGroupAmount = $lineItems->sum('total_price');

        // 3. Create Payment record tied to primary booking with full group total
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'provider'   => 'paynow',
            'reference'  => 'BK-' . ($booking->group_reference ?? $booking->reference) . '-' . time(),
            'amount'     => $totalGroupAmount,
            'status'     => 'pending',
        ]);

        // 4. Set callback and return routes using named routes (resolves against active request domain)
        $this->paynow->setResultUrl(route('paynow.callback', ['payment' => $payment->id]));
        $this->paynow->setReturnUrl(route('paynow.return', ['payment' => $payment->id]));

        // Check sandbox mode cleanly via class properties
        $authEmail = ($this->isSandbox && $this->testEmail)
            ? $this->testEmail
            : $booking->email;

        $paynowPayment = $this->paynow->createPayment(
            $payment->reference,
            $authEmail
        );

        // 5. Add line items to Paynow payload with calculated night counts
        foreach ($lineItems as $line) {
            $nights = Carbon::parse($line->check_in)->diffInDays(Carbon::parse($line->check_out));

            $paynowPayment->add(
                "{$line->room->name} room · {$nights} night(s)",
                (float) $line->total_price
            );
        }

        $response = $this->paynow->send($paynowPayment);

        $payment->update([
            'paynow_reference' => $response->pollUrl() ? $this->extractReference($response->pollUrl()) : null,
            'poll_url'         => $response->pollUrl(),
            'status'           => $response->success() ? 'created' : 'failed',
            'raw_response'     => (array) $response,
        ]);

        if (! $response->success()) {
            // This is the failure that was previously invisible: it never
            // threw, so the controller returned a normal 200 with
            // redirect_url missing, and the guest just saw nothing happen.
            // The real reason Paynow gave lives in $response->errors() /
            // the raw response — log it so it's actually diagnosable
            // instead of only sitting silently in payments.raw_response.
            Log::error('Paynow payment initiation failed', [
                'payment_id' => $payment->id,
                'booking_id' => $booking->id,
                'sandbox' => $this->isSandbox,
                'response' => (array) $response,
            ]);

            throw new \RuntimeException(
                "We couldn't start the payment — please try again, or contact us on WhatsApp."
            );
        }

        $payment->redirect_url = $response->redirectUrl();

        return $payment;
    }

    public function checkStatus(Payment $payment): string
    {
        if (!$payment->poll_url) {
            return $payment->status;
        }

        $status = $this->paynow->pollTransaction($payment->poll_url);
        $newStatus = $status->paid() ? 'paid' : strtolower($status->status());

        $payment->update([
            'status'       => $newStatus,
            'raw_response' => (array) $status,
        ]);

        if ($status->paid()) {
            $booking = $payment->booking;

            // Mark ALL rooms in the group as paid, confirmed, & set payment_method to paynow
            $query = $booking->group_reference
                ? Booking::where('group_reference', $booking->group_reference)
                : Booking::whereKey($booking->id);

            $query->update([
                'payment_status' => 'paid',
                'status'         => 'confirmed',
                'payment_method' => 'paynow',
            ]);
        }

        return $newStatus;
    }

    private function extractReference(string $pollUrl): ?string
    {
        parse_str(parse_url($pollUrl, PHP_URL_QUERY) ?? '', $params);

        return $params['guid'] ?? null;
    }
}
