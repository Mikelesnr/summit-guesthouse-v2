<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PaynowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaynowCallbackController extends Controller
{
    /**
     * Server-to-server POST from Paynow (result_url).
     */
    public function callback(Request $request, PaynowService $paynow)
    {
        Log::info('Paynow POST Webhook Received:', $request->all());

        $reference = $request->input('reference');
        $payment = Payment::where('reference', $reference)->first();

        if (!$payment) {
            Log::error("Paynow Callback Failed: Payment not found for reference '{$reference}'");
            return response('Payment Not Found', 404);
        }

        $status = $paynow->checkStatus($payment);
        Log::info("Paynow Webhook Processed for '{$reference}'. Status: {$status}");

        return response('OK', 200);
    }

    /**
     * Browser redirect GET from Paynow (return_url).
     */
    public function paymentReturn(Request $request, PaynowService $paynow)
    {
        Log::info('Paynow GET Return Received:', $request->all());

        // 1. First, check if Paynow sent the payment ID directly (?payment=01a02d...)
        $paymentId = $request->query('payment');

        // 2. Otherwise, check for reference query params (?reference=... or ?paynow_reference=...)
        $reference = $request->query('reference') ?? $request->query('paynow_reference');

        $payment = null;

        if ($paymentId) {
            $payment = Payment::find($paymentId);
        } elseif ($reference) {
            $payment = Payment::where('reference', $reference)
                ->orWhere('paynow_reference', $reference)
                ->first();
        }

        if ($payment) {
            // Sync status with Paynow in case the background webhook hit latency
            $paynow->checkStatus($payment);

            return redirect()->route('bookings.confirmation', [
                'reference' => $payment->booking->group_reference,
            ]);
        }

        Log::warning('Paynow Return Warning: No matching Payment found in database.', $request->all());

        return redirect()->route('home');
    }

    /**
     * Front-end status polling endpoint.
     */
    public function status(Payment $payment, PaynowService $paynow)
    {
        $status = $paynow->checkStatus($payment);

        return response()->json([
            'status' => $status,
            'payment' => $payment->load('booking'),
        ]);
    }
}
