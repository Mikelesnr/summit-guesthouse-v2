<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The route named `dashboard` that the stock Breeze pages (profile menu,
 * email verification, confirm password) all redirect to. It simply sends
 * each person to the right home: staff to the dashboard, guests to their
 * account page.
 */
class PortalController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        return redirect()->route(
            $request->user()->isStaff() ? 'dashboard.index' : 'account.index'
        );
    }
}
