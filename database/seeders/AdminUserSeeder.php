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
        // 1. Provision Admin Core Security Account First
        // Email and password come from .env only (ADMIN_EMAIL / ADMIN_PASSWORD) —
        // no hardcoded fallback, so this fails loudly instead of silently
        // seeding a guessable account if the env vars are missing.
        $email = config('services.admin.email');
        $password = config('services.admin.password');

        if (empty($email) || empty($password)) {
            throw new \RuntimeException(
                'ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding the admin account.'
            );
        }

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => config('services.admin.name', 'System Administrator'),
                'password' => Hash::make($password),
                'role' => UserRole::SystemAdmin,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
