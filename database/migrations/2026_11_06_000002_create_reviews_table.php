<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Kept if the guest later deletes their account, so a published
            // review does not silently vanish from the site.
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();

            // What is shown publicly (first name + last initial), stored so it
            // does not change if the account name does.
            $table->string('author_name');
            $table->unsignedTinyInteger('rating');
            $table->text('body');

            // pending -> approved | rejected. Only approved reviews are public.
            $table->string('status')->default('pending')->index();
            $table->foreignUuid('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
