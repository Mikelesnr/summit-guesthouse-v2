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
     * Only rooms that still have at least one unit free for the given
     * date range and can fit the requested guest count.
     *
     * Two date ranges overlap unless one ends before the other starts,
     * i.e. NOT (existing.check_out <= new.check_in OR existing.check_in >= new.check_out).
     */
    public function scopeAvailableBetween(Builder $query, string $checkIn, string $checkOut, int $guests = 1): Builder
    {
        return $query->where('is_active', true)
            ->where('max_guests', '>=', $guests)
            ->where('quantity', '>', function ($sub) use ($checkIn, $checkOut) {
                $sub->selectRaw('COUNT(*)')
                    ->from('bookings')
                    ->whereColumn('bookings.room_id', 'rooms.id')
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('check_in', '<', $checkOut)
                    ->where('check_out', '>', $checkIn);
            });
    }
}
