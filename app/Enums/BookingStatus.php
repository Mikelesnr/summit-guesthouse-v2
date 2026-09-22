<?php

namespace App\Enums;

enum BookingStatus: string
{
    case PENDING     = 'pending';
    case CONFIRMED   = 'confirmed';
    case CHECKED_IN  = 'checked_in';
    case CHECKED_OUT = 'checked_out';
    case COMPLETED   = 'completed';
    case CANCELLED   = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::PENDING     => 'Pending',
            self::CONFIRMED   => 'Confirmed',
            self::CHECKED_IN  => 'Checked In',
            self::CHECKED_OUT => 'Checked Out',
            self::COMPLETED   => 'Completed',
            self::CANCELLED   => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING     => 'amber',
            self::CONFIRMED   => 'blue',
            self::CHECKED_IN  => 'emerald',
            self::CHECKED_OUT => 'purple',
            self::COMPLETED   => 'slate',
            self::CANCELLED   => 'rose',
        };
    }
}
