<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Room extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'price',
        'size',
        'max_guests',
        'quantity',
        'has_breakfast',
        'pets_allowed',
        'is_featured',
        'is_active',
        'extras',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'has_breakfast' => 'boolean',
        'pets_allowed' => 'boolean',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'extras' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Room $room) {
            if (empty($room->slug)) {
                $room->slug = Str::slug($room->name);
            }
        });
    }

    public function images()
    {
        return $this->hasMany(RoomImage::class)->orderBy('sort_order');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Rooms that still have at least one unit free for the given date range.
     */
    public function scopeAvailableBetween(Builder $query, string $checkIn, string $checkOut): Builder
    {
        return $query->where('is_active', true)
            ->where('quantity', '>', function ($sub) use ($checkIn, $checkOut) {
                $this->addOverlapCount($sub, $checkIn, $checkOut);
            });
    }

    /**
     * Annotates rooms with available_quantity.
     */
    public function scopeWithAvailableQuantity(Builder $query, string $checkIn, string $checkOut): Builder
    {
        return $query->selectRaw('rooms.*, quantity - (
                select count(*) from bookings
                where bookings.room_id = rooms.id
                and bookings.status in (?, ?, ?)
                and bookings.check_in < ?
                and bookings.check_out > ?
            ) as available_quantity', ['pending', 'confirmed', 'checked_in', $checkOut, $checkIn]);
    }

    /**
     * Helper to count overlapping active bookings for availability subqueries.
     *
     * @param \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder $query
     */
    private function addOverlapCount($query, string $checkIn, string $checkOut): void
    {
        $query->selectRaw('COUNT(*)')
            ->from('bookings')
            ->whereColumn('bookings.room_id', 'rooms.id')
            ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn);
    }
}
