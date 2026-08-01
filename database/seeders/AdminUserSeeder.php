<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seeds the system admin (you) from .env so credentials never get
     * committed to the repo. Add these to your .env:
     *
     * SYSTEM_ADMIN_NAME="Michael Mwanza"
     * SYSTEM_ADMIN_EMAIL=michael@michaelmwanza.site
     * SYSTEM_ADMIN_PASSWORD=some-strong-password
     */
    public function run(): void
    {
        $email = env('SYSTEM_ADMIN_EMAIL');
        $password = env('SYSTEM_ADMIN_PASSWORD');

        if (! $email || ! $password) {
            $this->command->warn(
                'Skipped AdminUserSeeder: set SYSTEM_ADMIN_EMAIL and SYSTEM_ADMIN_PASSWORD in .env first.'
            );

            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('SYSTEM_ADMIN_NAME', 'System Admin'),
                'password' => Hash::make($password),
                'role' => UserRole::SystemAdmin->value,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("System admin seeded: {$email}");
    }
}
