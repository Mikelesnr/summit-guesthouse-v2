<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Paynow\Payments\Paynow;

class PaynowService
{
    private Paynow $paynow;

    // Inject configuration via constructor
    public function __construct(string $id, string $key, string $resultUrl, string $returnUrl)
    {
        $this->paynow = new Paynow($id, $key, $resultUrl, $returnUrl);
    }

    public function initiate(Booking $booking): Payment
    {
        $payment = $this->paynow->createPayment(
            $booking->reference,
            $booking->email
        );

        $payment->add(
            "{$booking->room->name} room · {$booking->nights} night(s)",
            (float) $booking->total_price
        );

        $response = $this->paynow->send($payment);

        $record = Payment::create([
            'booking_id' => $booking->id,
            'provider' => 'paynow',
            'reference' => $booking->reference,
            'paynow_reference' => $response->pollUrl() ? $this->extractReference($response->pollUrl()) : null,
            'poll_url' => $response->pollUrl(),
            'amount' => $booking->total_price,
            'status' => $response->success() ? 'created' : 'failed',
            'raw_response' => (array) $response,
        ]);

        if ($response->success()) {
            $record->redirect_url = $response->redirectUrl(); // not persisted, just for the controller to use
        }

        return $record;
    }

    public function checkStatus(Payment $payment): string
    {
        $status = $this->paynow->pollTransaction($payment->poll_url);

        $newStatus = $status->paid() ? 'paid' : strtolower($status->status());

        $payment->update([
            'status' => $newStatus,
            'raw_response' => (array) $status,
        ]);

        if ($status->paid()) {
            $payment->booking->update(['payment_status' => 'paid', 'status' => 'confirmed']);
        }

        return $newStatus;
    }

    private function extractReference(string $pollUrl): ?string
    {
        parse_str(parse_url($pollUrl, PHP_URL_QUERY) ?? '', $params);

        return $params['guid'] ?? null;
    }
}
