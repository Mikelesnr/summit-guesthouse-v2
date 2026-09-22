<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // null = booked directly (website or walk-in). 'booking_com' = created
            // by the iCal sync job from Booking.com's calendar feed.
            $table->string('source')->nullable()->after('payment_method');

            // Booking.com's own UID for this reservation, from the iCal VEVENT.
            // Used so re-running the sync never creates the same booking twice,
            // and so we can tell when a reservation drops off their feed
            // (cancelled) and needs to be released locally.
            $table->string('source_uid')->nullable()->after('source');

            // A given UID should only ever produce one local booking per room.
            // Nulls don't collide under a unique index, so direct/walk-in
            // bookings (source_uid always null) are unaffected.
            $table->unique(['room_id', 'source_uid']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['room_id', 'source_uid']);
            $table->dropColumn(['source', 'source_uid']);
        });
    }
};
