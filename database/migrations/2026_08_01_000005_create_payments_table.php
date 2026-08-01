<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('booking_id')->constrained()->cascadeOnDelete();

            $table->string('provider')->default('paynow');
            $table->string('reference');            // our merchant reference sent to Paynow
            $table->string('paynow_reference')->nullable(); // Paynow's own reference, once created
            $table->text('poll_url')->nullable();    // used to check payment status
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('created'); // created | paid | cancelled | failed
            $table->json('raw_response')->nullable(); // last raw response from Paynow, for debugging

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
