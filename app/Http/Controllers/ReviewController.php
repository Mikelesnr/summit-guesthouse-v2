<?php

namespace App\Http\Controllers;

use App\Enums\ReviewStatus;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'body' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $user = $request->user();

        // Always starts as pending: nothing a guest writes goes public until
        // someone on the team has read it.
        Review::create([
            'user_id' => $user->id,
            'author_name' => Review::publicName($user->name),
            'rating' => $validated['rating'],
            'body' => trim($validated['body']),
            'status' => ReviewStatus::PENDING,
        ]);

        return back()->with('success', 'Thank you! Your review will appear on the site once our team has had a look at it.');
    }

    public function destroy(Request $request, Review $review): RedirectResponse
    {
        abort_unless($review->user_id === $request->user()->id, 403);

        $review->delete();

        return back()->with('success', 'Review deleted.');
    }
}
