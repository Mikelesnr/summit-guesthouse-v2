<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('room_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('room_id')->constrained()->cascadeOnDelete();
            $table->string('path');           // storage path or URL
            $table->string('alt_text')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_images');
    }
};
