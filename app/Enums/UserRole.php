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

    /**
     * Roles allowed to open the user management page at all.
     * Row-level visibility within that page is further restricted by rank()
     * — see visibleTo() below.
     */
    public static function canManageUsers(): array
    {
        return [self::Manager->value, self::Owner->value, self::SystemAdmin->value];
    }

    /** Higher number = higher in the hierarchy. */
    public function rank(): int
    {
        return match ($this) {
            self::Staff => 0,
            self::Manager => 1,
            self::Owner => 2,
            self::SystemAdmin => 3,
        };
    }

    /**
     * Roles a given viewer is allowed to see/manage in the user list —
     * itself and anything below, never anything above. So a manager sees
     * manager + staff, an owner sees owner + manager + staff, and a
     * system_admin sees everyone. Staff can't reach this page at all
     * (gated separately by canManageUsers()).
     *
     * @return array<int, string>
     */
    public static function visibleTo(self $viewer): array
    {
        return array_values(array_map(
            fn (self $role) => $role->value,
            array_filter(self::cases(), fn (self $role) => $role->rank() <= $viewer->rank())
        ));
    }
}