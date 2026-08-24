<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            // The .ics URL Booking.com generates for this room type's
            // calendar (Extranet > Calendar > Sync calendars). Left blank
            // until staff connect that room, at which point the sync job
            // picks it up automatically.
            $table->text('ical_import_url')->nullable()->after('extras');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('ical_import_url');
        });
    }
};
