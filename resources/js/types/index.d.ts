import { Config } from 'ziggy-js';

export type UserRole = 'staff' | 'manager' | 'owner' | 'system_admin';

export interface User {
    id: string;
    name: string;
    email: string;
    email_verified_at?: string;
    role: UserRole;
    phone: string | null;
    is_active: boolean;
}

export interface RoomImage {
    id: string;
    room_id: string;
    path: string;
    alt_text: string | null;
    sort_order: number;
}

export interface Room {
    id: string;
    name: string;
    slug: string;
    type: 'single' | 'double';
    description: string | null;
    price: number | string;
    size: number | null;
    max_guests: number;
    quantity: number;
    available_quantity?: number;
    has_breakfast: boolean;
    pets_allowed: boolean;
    is_featured: boolean;
    is_active: boolean;
    extras: string[] | null;
    images?: RoomImage[];
}

export interface Booking {
    id: string;
    reference: string;
    group_reference: string | null;
    room_id: string;
    room?: Room;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    check_in: string;
    check_out: string;
    guests: number;
    party_size: number | null;
    total_price: number | string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status: 'unpaid' | 'paid' | 'partially_paid' | 'refunded';
    payment_method: string | null;
    notes: string | null;
}

export interface CartItem {
    room: Room;
    quantity: number;
}

export interface AvailabilitySearch {
    check_in: string;
    check_out: string;
    party_size: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash: {
        success?: string | null;
    };
    ziggy: Config & { location: string };
};
