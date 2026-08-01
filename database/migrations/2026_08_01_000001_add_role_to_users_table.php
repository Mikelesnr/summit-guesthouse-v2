<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\UserRole;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // system_admin = you (seeded from .env)
            // owner        = the guesthouse owner/client
            // manager      = day-to-day operations, can manage rooms/bookings
            // staff        = front desk, can view/create bookings only
            $table->string('role')->default(UserRole::Staff->value)->after('email');

            $table->string('phone')->nullable()->after('role');
            $table->boolean('is_active')->default(true)->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'is_active']);
        });
    }
};
