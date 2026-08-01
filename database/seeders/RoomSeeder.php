<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Migrated straight from the old assets/data.js. Prices, sizes, type,
     * breakfast and pets values are the real values from the old site.
     *
     * IMPORTANT: `quantity` (how many physical rooms of this type exist)
     * was NOT tracked on the old site, so every room defaults to 1 here.
     * Update these in the staff dashboard (or right in this array before
     * seeding) to match how many of each room type actually exist —
     * this number is what drives the "don't double-book" availability check.
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
                'quantity' => 1, // TODO: confirm real count
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => true,
            ],
            [
                'name' => 'Queen',
                'type' => 'double',
                'price' => 60,
                'size' => 300,
                'max_guests' => 2,
                'quantity' => 1, // TODO: confirm real count
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => false,
            ],
            [
                'name' => 'Presidential',
                'type' => 'single',
                'price' => 70,
                'size' => 300,
                'max_guests' => 1,
                'quantity' => 1, // TODO: confirm real count
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => false,
            ],
            [
                'name' => 'Signature',
                'type' => 'double',
                'price' => 70,
                'size' => 350,
                'max_guests' => 2,
                'quantity' => 1, // TODO: confirm real count
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => false,
            ],
            [
                'name' => 'King',
                'type' => 'single',
                'price' => 80,
                'size' => 400,
                'max_guests' => 1,
                'quantity' => 1, // TODO: confirm real count
                'has_breakfast' => true,
                'pets_allowed' => false,
                'is_featured' => false,
            ],
            [
                'name' => 'Monarch',
                'type' => 'double',
                'price' => 100,
                'size' => 350,
                'max_guests' => 2,
                'quantity' => 1, // TODO: confirm real count
                'has_breakfast' => false,
                'pets_allowed' => false,
                'is_featured' => false,
            ],
        ];

        foreach ($rooms as $room) {
            Room::updateOrCreate(
                ['slug' => \Illuminate\Support\Str::slug($room['name'])],
                array_merge($room, [
                    'description' => "The {$room['name']} room comes with a full DStv package, high-speed Wi-Fi, a "
                        .($room['max_guests'] > 1 ? 'queen-sized bed' : 'comfortable bed')
                        .", a 50-inch TV, pressurised hot water, porcelain tiled floors, room service for all meals, "
                        ."self-service tea facilities and air-conditioning.",
                    'extras' => $extras,
                    'is_active' => true,
                ])
            );
        }
    }
}
