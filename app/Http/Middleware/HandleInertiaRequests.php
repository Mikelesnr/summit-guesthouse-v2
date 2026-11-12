<?php

namespace App\Http\Middleware;

use App\Enums\ReviewStatus;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            // Badge on the dashboard's Reviews link, so new reviews waiting
            // for approval do not go unnoticed. Staff only.
            'pendingReviews' => fn () => $request->user()?->isStaff()
                ? Review::where('status', ReviewStatus::PENDING->value)->count()
                : null,
        ];
    }
}
