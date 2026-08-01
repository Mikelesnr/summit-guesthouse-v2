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

    /**
     * $booking is the "primary" row of the group (or the only row for a
     * single-room booking). Its total_price is the grand total for the
     * whole cart — see BookingController::store(). If it belongs to a
     * group, we itemize every room in the group as its own line so the
     * Paynow checkout shows the full breakdown rather than one lump sum.
     */
    public function initiate(Booking $booking): Payment
    {
        $authEmail = env('PAYNOW_TEST_EMAIL', $booking->email);
        $payment = $this->paynow->createPayment(
            $booking->reference,
            $authEmail
        );

        $lineItems = $booking->group_reference
            ? Booking::where('group_reference', $booking->group_reference)->with('room')->get()
            : collect([$booking]);

        foreach ($lineItems as $line) {
            $payment->add(
                "{$line->room->name} room · {$line->nights} night(s)",
                (float) $line->total_price
            );
        }

        $response = $this->paynow->send($payment);

        $record = Payment::create([
            'booking_id' => $booking->id,
            'provider' => 'paynow',
            'reference' => $booking->reference,
            'paynow_reference' => $response->pollUrl() ? $this->extractReference($response->pollUrl()) : null,
            'poll_url' => $response->pollUrl(),
            'amount' => $lineItems->sum('total_price'),
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
            $booking = $payment->booking;

            // Cascade to every room in the group, not just the primary row
            // the payment happens to be attached to.
            $query = $booking->group_reference
                ? Booking::where('group_reference', $booking->group_reference)
                : Booking::whereKey($booking->id);

            $query->update(['payment_status' => 'paid', 'status' => 'confirmed']);
        }

        return $newStatus;
    }

    private function extractReference(string $pollUrl): ?string
    {
        parse_str(parse_url($pollUrl, PHP_URL_QUERY) ?? '', $params);

        return $params['guid'] ?? null;
    }
}
