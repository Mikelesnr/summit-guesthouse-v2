<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PaynowService;

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

    /** Used by the frontend to poll "has this paid yet?" after redirect back. */
    public function status(Payment $payment, PaynowService $paynow)
    {
        $status = $paynow->checkStatus($payment);

        return response()->json(['status' => $status]);
    }
}
