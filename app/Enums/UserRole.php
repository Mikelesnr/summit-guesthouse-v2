<?php

namespace App\Enums;

enum UserRole: string
{
    case Staff = 'staff';
    case Manager = 'manager';
    case Owner = 'owner';
    case SystemAdmin = 'system_admin';

    public function label(): string
    {
        return match ($this) {
            self::Staff => 'Staff',
            self::Manager => 'Manager',
            self::Owner => 'Owner',
            self::SystemAdmin => 'System Admin',
        };
    }

    /** Roles allowed to manage rooms (prices, quantity, photos). */
    public static function canManageRooms(): array
    {
        return [self::Manager->value, self::Owner->value, self::SystemAdmin->value];
    }

    /** Roles allowed to manage staff accounts. */
    public static function canManageUsers(): array
    {
        return [self::Owner->value, self::SystemAdmin->value];
    }
}