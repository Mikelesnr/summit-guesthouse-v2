<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReviewModerationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = ReviewStatus::tryFrom((string) $request->query('status', ReviewStatus::PENDING->value))
            ?? ReviewStatus::PENDING;

        return Inertia::render('Dashboard/Reviews/Index', [
            'reviews' => Review::where('status', $status->value)
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'status' => $status->value,
            'counts' => collect(ReviewStatus::cases())->mapWithKeys(
                fn (ReviewStatus $s) => [$s->value => Review::where('status', $s->value)->count()]
            ),
        ]);
    }

    /** Approve, reject, or put a review back to pending. */
    public function update(Request $request, Review $review): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(ReviewStatus::class)],
        ]);

        $review->update([
            'status' => $validated['status'],
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
        ]);

        return back()->with('success', 'Review updated.');
    }
}
