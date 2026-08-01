<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PaynowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaynowCallbackController extends Controller
{
    /**
     * Paynow POSTs here directly (result_url) once a payment settles.
     * Lives in routes/api.php, which uses the stateless `api` middleware
     * group — no CSRF, no session required.
     */
    public function callback(Payment $payment, PaynowService $paynow)
    {
        $paynow->checkStatus($payment);

        return response('OK', 200);
    }

    public function handleGenericCallback(Request $request, PaynowService $paynow)
    {
        // Use 'reference' because that is the key in the payload you provided
        $reference = $request->input('reference');

        Log::info("Paynow Callback Received for reference: " . $reference);

        // Find the payment record in your database
        $payment = Payment::where('reference', $reference)->firstOrFail();

        // Call your existing callback logic
        // We pass the $payment and the $paynow service
        return $this->callback($payment, $paynow);
    }

    /** Used by the frontend to poll "has this paid yet?" after redirect back. */
    public function status(Payment $payment, PaynowService $paynow)
    {
        $status = $paynow->checkStatus($payment);

        return response()->json(['status' => $status]);
    }
}
