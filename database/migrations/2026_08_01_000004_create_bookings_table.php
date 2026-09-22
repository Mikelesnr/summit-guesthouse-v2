<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\BookingStatus;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // Short, non-sequential reference to show/send to guests
            // (sequential ids would let anyone guess booking counts).
            $table->uuid('reference')->unique();

            $table->foreignUuid('room_id')->constrained();

            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone');

            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedTinyInteger('guests')->default(1);

            $table->decimal('total_price', 10, 2);

            // In migration or new migration
            $table->string('status')->default(BookingStatus::PENDING->value);
            $table->timestamp('actual_check_in_at')->nullable();
            $table->timestamp('actual_check_out_at')->nullable();

            $table->enum('payment_status', ['unpaid', 'paid', 'partially_paid', 'refunded'])
                ->default('unpaid');
            $table->string('payment_method')->nullable(); // paynow | cash | eft

            $table->text('notes')->nullable();

            // Staff member who created the booking, if made from the dashboard
            // rather than the public site. Null = guest self-booked.
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // A room can't be double-booked for overlapping dates beyond its quantity;
            // this index makes the overlap query (see Room::scopeAvailableBetween) fast.
            $table->index(['room_id', 'check_in', 'check_out']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
