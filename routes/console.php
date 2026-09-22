<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Keeps locally-created bookings blocking rooms on Booking.com's own
// calendar, and vice versa. 10 minutes is a reasonable floor — Booking.com's
// own feed doesn't regenerate much faster than that anyway, so polling
// tighter than this just finds nothing new most runs.
Schedule::command('bookings:sync-booking-com')->everyTenMinutes()->withoutOverlapping();
