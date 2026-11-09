<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // New accounts used to default to 'staff'. With public sign-up
        // switched on, any code path that forgets to set a role would hand
        // out staff access, so the safe default is the least privileged one.
        // Existing rows are untouched.
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('guest')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->change();
        });
    }
};
