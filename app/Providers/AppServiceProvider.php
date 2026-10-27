<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Services\PaynowService;
use Illuminate\Support\Facades\Mail;
use App\Mail\Transport\GoogleApiTransport;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // PaynowService reads its own config internally (including
        // per-request scheme/host resolution), so there's nothing to
        // inject — this just makes that explicit instead of the previous
        // binding, which passed 4 arguments the constructor doesn't
        // accept and PHP was silently discarding.
        $this->app->singleton(PaynowService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        if (str_starts_with(config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        // ⚡ 3. Existing Custom Mailer Extension (Preserved intact)
        Mail::extend('google_api', function (array $config) {
            return new GoogleApiTransport(
                config('services.google.client_id') ?? '',
                config('services.google.client_secret') ?? '',
                config('services.google.refresh_token') ?? ''
            );
        });
    }
}
