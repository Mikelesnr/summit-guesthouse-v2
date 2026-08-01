<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'reference',
        'room_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'check_in',
        'check_out',
        'guests',
        'total_price',
        'status',
        'payment_status',
        'payment_method',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'total_price' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (Booking $booking) {
            if (empty($booking->reference)) {
                $booking->reference = (string) Str::uuid();
            }
        });
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function getNightsAttribute(): int
    {
        return $this->check_in->diffInDays($this->check_out);
    }
}
