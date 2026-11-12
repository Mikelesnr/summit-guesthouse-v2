<?php

namespace App\Enums;

enum ReviewStatus: string
{
    case PENDING  = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::PENDING  => 'Awaiting approval',
            self::APPROVED => 'Published',
            self::REJECTED => 'Not published',
        };
    }
}
