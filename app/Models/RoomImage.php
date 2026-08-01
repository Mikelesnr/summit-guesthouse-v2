<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RoomImage extends Model
{
    use HasUuids;
    protected $fillable = ['room_id', 'path', 'alt_text', 'sort_order'];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
