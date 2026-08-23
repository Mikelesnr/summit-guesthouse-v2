<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Carbon\Carbon;
use Paynow\Payments\Paynow;

class PaynowService
{
    private Paynow $paynow;
    private bool $isSandbox;
    private ?string $testEmail;

    public function __construct()
    {
        $id = config('services.paynow.integration_id');
        $key = config('services.paynow.integration_key');

        $this->isSandbox = (bool) config('services.paynow.sandbox', false);
        $this->testEmail = config('services.paynow.test_email');

        // Safe runtime fallbacks using url() to avoid UrlGenerator exceptions during config:cache
        $resultUrl = config('services.paynow.result_url') ?? url('/api/payments/paynow/callback');
        $returnUrl = config('services.paynow.return_url') ?? url('/payments/paynow/return');

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

        // 4. Set callback and return routes with payment parameter for status resolution
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

        if ($response->success()) {
            $payment->redirect_url = $response->redirectUrl();
        }

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
