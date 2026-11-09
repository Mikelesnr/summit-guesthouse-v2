<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    /** The guest's own page: for now just their reviews and a form to add one. */
    public function index(Request $request): Response
    {
        return Inertia::render('Account/Index', [
            'reviews' => $request->user()
                ->reviews()
                ->latest()
                ->get(['id', 'rating', 'body', 'status', 'created_at']),
        ]);
    }
}
