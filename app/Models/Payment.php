<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasUuids;
    protected $fillable = [
        'booking_id',
        'provider',
        'reference',
        'paynow_reference',
        'poll_url',
        'amount',
        'status',
        'raw_response',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'raw_response' => 'array',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
