<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Paynow's hosted checkout link. Stored so that if the guest's
            // connection drops and the booking is retried, we can hand back
            // the same checkout instead of starting a second payment.
            $table->text('redirect_url')->nullable()->after('poll_url');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('redirect_url');
        });
    }
};
