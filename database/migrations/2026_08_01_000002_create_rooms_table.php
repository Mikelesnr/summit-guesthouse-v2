<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');                 // e.g. "Ministerial Suite"
            $table->string('slug')->unique();        // e.g. "ministerial"
            $table->string('type');                  // single | double
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);          // per night, USD
            $table->unsignedInteger('size')->nullable(); // sq ft
            $table->unsignedTinyInteger('max_guests')->default(2); // business rule: capped at 2

            // How many physical rooms of this type exist. This is what the
            // availability check subtracts overlapping bookings against,
            // so guests can never double-book the last room of a type.
            $table->unsignedInteger('quantity')->default(1);

            $table->boolean('has_breakfast')->default(false);
            $table->boolean('pets_allowed')->default(false);
            $table->boolean('is_featured')->default(false);

            // Lets staff hide a room type (e.g. under renovation) without deleting it.
            $table->boolean('is_active')->default(true);

            $table->json('extras')->nullable(); // amenities list, e.g. ["Plush pillows", ...]

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
