<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RoomSeeder extends Seeder
{
    /**
     * Migrated from the old site's assets/data.js — real prices, sizes,
     * descriptions, capacities and image sets, one to one.
     *
     * `quantity` (how many physical rooms of this type exist) was never
     * tracked on the old site, so every room defaults to 1 here. Update
     * these in the staff dashboard (or right in this array before seeding)
     * to match how many of each room type actually exist — this number is
     * what drives the "don't double-book" availability check.
     */
    public function run(): void
    {
        $extras = [
            'Plush pillows and breathable bed linens',
            'Soft, oversized bath towels',
            'Full-sized, pH-balanced toiletries',
            'Complimentary refreshments',
            'Adequate safety/security',
            'Comfortable beds',
        ];

        $rooms = [
            [
                'name' => 'Ministerial',
                'type' => 'single',
                'price' => 50,
                'size' => 250,
                'max_guests' => 1,
                'quantity' => 5, // placeholder — set your real per-room-type counts here
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => true,
                'description' => 'The room comes with a full Dstv package, high speed Wi-Fi, a queen-sized bed, '
                    .'a 50-inch tv, pressurized hot water, porcelain tiled floors, access room service for all '
                    .'meals, self-service tea facilities and air-conditioning.',
                'images' => ['bed.jpeg', 'fridge.jpeg', 'toilet.jpeg', 'tv.jpeg'],
            ],
            [
                'name' => 'Queen',
                'type' => 'double',
                'price' => 60,
                'size' => 300,
                'max_guests' => 2,
                'quantity' => 5, // placeholder — set your real per-room-type counts here
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => false,
                'description' => 'The room comes with a full Dstv package, high speed Wi-Fi, a queen-sized bed, '
                    .'a 50-inch tv, pressurized hot water, porcelain tiled floors, access room service for all '
                    .'meals, self-service tea facilities and air-conditioning.',
                'images' => ['main.jpeg', 'bathroom.jpeg', 'tv.jpeg', 'toilet.jpeg'],
            ],
            [
                'name' => 'Presidential',
                'type' => 'single',
                'price' => 70,
                'size' => 300,
                'max_guests' => 1,
                'quantity' => 5, // placeholder — set your real per-room-type counts here
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => false,
                'description' => 'The room comes with a full Dstv package, high speed Wi-Fi, a king-sized bed, '
                    .'a 60-inch tv, pressurized hot water, porcelain tiled floors, access room service for all '
                    .'meals, self-service tea facilities, two executive seaters and air-conditioning.',
                'images' => ['main.jpeg', 'bed.jpeg', 'tv.jpeg', 'toilet.jpeg'],
            ],
            [
                'name' => 'Signature',
                'type' => 'double',
                'price' => 70,
                'size' => 350,
                'max_guests' => 2,
                'quantity' => 5, // placeholder — set your real per-room-type counts here
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => true,
                'description' => 'The room comes with a full Dstv package, high speed Wi-Fi, a king-sized bed, '
                    .'a 65-inch tv, pressurized hot water, porcelain tiled floors, access room service for all '
                    .'meals, self-service tea facilities, two executive seaters and air-conditioning.',
                'images' => ['main.jpeg', 'fridge.jpeg', 'tv.jpeg', 'toilet.jpeg'],
            ],
            [
                'name' => 'King',
                'type' => 'single',
                'price' => 80,
                'size' => 400,
                'max_guests' => 1,
                'quantity' => 5, // placeholder — set your real per-room-type counts here
                'has_breakfast' => true,
                'pets_allowed' => false,
                'is_featured' => true,
                'description' => 'The room comes with a full Dstv package, high speed Wi-Fi, a king-sized bed, '
                    .'a 60-inch tv, pressurized hot water, porcelain tiled floors, access room service for all '
                    .'meals, self-service tea facilities and air-conditioning.',
                'images' => ['main.jpeg', 'bed.jpeg', 'tv.jpeg', 'toilet.jpeg'],
            ],
            [
                'name' => 'Monarch',
                'type' => 'double',
                'price' => 100,
                'size' => 350,
                'max_guests' => 2,
                'quantity' => 5, // placeholder — set your real per-room-type counts here
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => true,
                'description' => 'The room comes with a full Dstv package, high speed Wi-Fi, a king-sized bed, '
                    .'a 65-inch tv, pressurized hot water, porcelain tiled floors, access room service for all '
                    .'meals, self-service tea facilities, two executive seaters and air-conditioning.',
                'images' => ['main.jpeg', 'bed.jpeg', 'tv.jpeg', 'toilet.jpeg'],
            ],
        ];

        foreach ($rooms as $room) {
            $images = $room['images'];
            $slug = Str::slug($room['name']);
            unset($room['images']);

            $record = Room::updateOrCreate(
                ['slug' => $slug],
                array_merge($room, [
                    'extras' => $extras,
                    'is_active' => true,
                ])
            );

            // Re-seed images cleanly each time this seeder runs.
            $record->images()->delete();

            foreach ($images as $index => $file) {
                RoomImage::create([
                    'room_id' => $record->id,
                    'path' => "/images/rooms/{$slug}/{$file}",
                    'alt_text' => "{$room['name']} room",
                    'sort_order' => $index,
                ]);
            }
        }
    }
}
