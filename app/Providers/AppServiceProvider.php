<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Services\PaynowService;
use Illuminate\Support\Facades\Mail;
use App\Mail\Transports\GmailApiTransport;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PaynowService::class, function ($app) {
            $config = config('services.paynow');

            return new PaynowService(
                $config['integration_id'],
                $config['integration_key'],
                $config['result_url'],
                $config['return_url']
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // ⚡ 3. Existing Custom Mailer Extension (Preserved intact)
        Mail::extend('gmail_api', function (array $config) {
            return new GmailApiTransport();
        });

    }
}
