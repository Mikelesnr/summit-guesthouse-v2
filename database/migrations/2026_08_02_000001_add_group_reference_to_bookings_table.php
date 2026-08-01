<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Groups multiple room bookings made in one checkout (e.g. a
            // conference party booking 6 rooms for 11 guests). Nullable
            // because a lone single-room booking doesn't need one.
            $table->uuid('group_reference')->nullable()->after('reference');
            $table->index('group_reference');

            // Total party size for the whole group, stored on every row in
            // the group for easy display — not used for per-room capacity
            // checks, that's still `guests` against the room's max_guests.
            $table->unsignedSmallInteger('party_size')->nullable()->after('guests');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['group_reference', 'party_size']);
        });
    }
};
