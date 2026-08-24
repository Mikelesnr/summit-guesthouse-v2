import BookingModal from '@/Components/Booking/BookingModal';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Booking, Paginated, PaginationLink } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ChangeEvent, useState } from 'react';

interface BookingsIndexProps {
    bookings: Paginated<Booking>;
}

const STATUS_STYLES: Record<Booking['status'], string> = {
    pending: 'bg-gold-light/40 text-gold-dark',
    confirmed: 'bg-green-100 text-green-700',
    checked_in: 'bg-blue-100 text-blue-700',
    checked_out: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-cream-deep text-ink/60',
};

const STALE_AFTER_MINUTES = 30;

function isStale(booking: Booking): boolean {
    if (booking.payment_status === 'paid') return false;
    const ageMinutes =
        (Date.now() - new Date(booking.created_at ?? 0).getTime()) / 60000;
    return ageMinutes > STALE_AFTER_MINUTES;
}

// Placeholder rows the Booking.com sync created — no guest details yet,
// and nobody's claimed them via take-over.
function needsDetails(booking: Booking): boolean {
    return booking.source === 'booking_com' && !booking.created_by;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
});

function formatDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? value
        : dateFormatter.format(parsed);
}

function formatDateRange(checkIn: string, checkOut: string): string {
    return `${formatDate(checkIn)} \u2192 ${formatDate(checkOut)}`;
}

export default function Index({ bookings }: BookingsIndexProps) {
    const [takingOver, setTakingOver] = useState<string | null>(null);
    const [modalBooking, setModalBooking] = useState<Booking | null>(null);

    function updateStatus(booking: Booking, status: Booking['status']) {
        router.put(
            `/dashboard/bookings/${booking.id}`,
            { status },
            { preserveScroll: true },
        );
    }

    return (
        <DashboardLayout>
            <Head title="Bookings" />
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-display text-2xl text-ink">Bookings</h1>
                <Link href="/dashboard/bookings/create" className="btn-primary">
                    New walk-in booking
                </Link>
            </div>

            {bookings.total > 0 && (
                <p className="mt-1 text-xs text-ink/40">
                    Showing {bookings.from}–{bookings.to} of {bookings.total}
                </p>
            )}

            {/* Mobile: stacked cards */}
            <div className="mt-6 space-y-3 sm:hidden">
                {bookings.data.map((b) => (
                    <BookingCard
                        key={b.id}
                        booking={b}
                        onUpdateStatus={updateStatus}
                        expanded={takingOver === b.id}
                        onToggleTakeOver={() =>
                            setTakingOver(takingOver === b.id ? null : b.id)
                        }
                        onViewDetails={() => setModalBooking(b)}
                    />
                ))}
                {bookings.data.length === 0 && (
                    <p className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/50">
                        No bookings yet.
                    </p>
                )}
            </div>

            {/* Desktop: table */}
            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:block">
                <table className="w-full text-sm">
                    <thead className="bg-cream-deep text-left text-xs uppercase tracking-wide text-ink/50">
                        <tr>
                            <th className="px-4 py-3">Guest</th>
                            <th className="px-4 py-3">Room</th>
                            <th className="px-4 py-3">Dates</th>
                            <th className="px-4 py-3">Payment</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {bookings.data.map((b) => (
                            <BookingRow
                                key={b.id}
                                booking={b}
                                onUpdateStatus={updateStatus}
                                expanded={takingOver === b.id}
                                onToggleTakeOver={() =>
                                    setTakingOver(
                                        takingOver === b.id ? null : b.id,
                                    )
                                }
                                onViewDetails={() => setModalBooking(b)}
                            />
                        ))}
                        {bookings.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-sm text-ink/50"
                                >
                                    No bookings yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={bookings.links} />

            {/* Render details and check-in modal */}
            {modalBooking && (
                <BookingModal
                    booking={modalBooking}
                    onClose={() => setModalBooking(null)}
                />
            )}
        </DashboardLayout>
    );
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) return null;

    return (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-1">
            {links.map((link, i) => (
                <PaginationItem key={i} link={link} />
            ))}
        </nav>
    );
}

function PaginationItem({ link }: { link: PaginationLink }) {
    const base =
        'flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition';

    if (!link.url) {
        return (
            <span
                className={`${base} text-ink/30`}
                dangerouslySetInnerHTML={{ __html: link.label }}
            />
        );
    }

    return (
        <Link
            href={link.url}
            preserveScroll
            className={`${base} ${link.active ? 'bg-ink text-cream' : 'border border-line text-ink/70 hover:bg-cream-deep'}`}
            dangerouslySetInnerHTML={{ __html: link.label }}
        />
    );
}

function GuestName({ booking: b }: { booking: Booking }) {
    if (!b.first_name && !b.last_name) {
        return (
            <p className="font-medium italic text-ink/50">Booking.com guest</p>
        );
    }
    return (
        <p className="font-medium text-ink">
            {b.first_name} {b.last_name}
        </p>
    );
}

function NeedsDetailsBadge() {
    return (
        <p className="mt-1 text-xs font-medium text-gold-dark">
            via Booking.com — needs details
        </p>
    );
}

function BookingRow({
    booking: b,
    onUpdateStatus,
    expanded,
    onToggleTakeOver,
    onViewDetails,
}: {
    booking: Booking;
    onUpdateStatus: (b: Booking, status: Booking['status']) => void;
    expanded: boolean;
    onToggleTakeOver: () => void;
    onViewDetails: () => void;
}) {
    const eligible = b.payment_status !== 'paid' && b.status !== 'cancelled';
    const stale = isStale(b);

    return (
        <>
            <tr className="hover:bg-cream-light/50 group">
                <td className="px-4 py-3">
                    <button
                        onClick={onViewDetails}
                        className="text-left hover:underline"
                    >
                        <GuestName booking={b} />
                        <p className="text-xs text-ink/50">{b.phone || '—'}</p>
                    </button>
                    {needsDetails(b) && <NeedsDetailsBadge />}
                </td>
                <td className="px-4 py-3">{b.room?.name}</td>
                <td className="px-4 py-3 text-ink/70">
                    {formatDateRange(b.check_in, b.check_out)}
                </td>
                <td className="px-4 py-3">
                    <span
                        className={`rounded-full px-2 py-1 text-xs ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-cream-deep text-ink/50'}`}
                    >
                        {b.payment_status}
                    </span>
                    {b.payment_method && (
                        <p className="mt-1 text-xs capitalize text-ink/40">
                            {b.payment_method.replace('_', '.')}
                        </p>
                    )}
                    {!b.created_by && !needsDetails(b) && stale && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                            stuck / abandoned
                        </p>
                    )}
                </td>
                <td className="px-4 py-3">
                    <select
                        value={b.status}
                        onChange={(e) =>
                            onUpdateStatus(
                                b,
                                e.target.value as Booking['status'],
                            )
                        }
                        className={`rounded-full border-0 text-xs font-medium focus:ring-gold ${STATUS_STYLES[b.status]}`}
                    >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked_in">Checked In</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </td>
                <td className="space-x-3 px-4 py-3 text-right">
                    <button
                        onClick={onViewDetails}
                        className="text-xs font-medium text-ink/70 hover:text-ink"
                    >
                        Details
                    </button>
                    {eligible && (
                        <button
                            onClick={onToggleTakeOver}
                            className="text-xs text-gold-dark hover:underline"
                        >
                            {expanded ? 'Cancel' : 'Take over'}
                        </button>
                    )}
                </td>
            </tr>
            {expanded && <TakeOverRow booking={b} onDone={onToggleTakeOver} />}
        </>
    );
}

function BookingCard({
    booking: b,
    onUpdateStatus,
    expanded,
    onToggleTakeOver,
    onViewDetails,
}: {
    booking: Booking;
    onUpdateStatus: (b: Booking, status: Booking['status']) => void;
    expanded: boolean;
    onToggleTakeOver: () => void;
    onViewDetails: () => void;
}) {
    const eligible = b.payment_status !== 'paid' && b.status !== 'cancelled';
    const stale = isStale(b);

    return (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
                <button
                    onClick={onViewDetails}
                    className="text-left hover:underline"
                >
                    <GuestName booking={b} />
                    <p className="text-xs text-ink/50">{b.phone || '—'}</p>
                </button>
                <select
                    value={b.status}
                    onChange={(e) =>
                        onUpdateStatus(b, e.target.value as Booking['status'])
                    }
                    className={`shrink-0 rounded-full border-0 text-xs font-medium focus:ring-gold ${STATUS_STYLES[b.status]}`}
                >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {needsDetails(b) && <NeedsDetailsBadge />}

            <div className="mt-3 space-y-1 text-sm text-ink/70">
                <p>{b.room?.name}</p>
                <p>{formatDateRange(b.check_in, b.check_out)}</p>
                <p className="flex items-center gap-2">
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-cream-deep text-ink/50'}`}
                    >
                        {b.payment_status}
                    </span>
                    {b.payment_method && (
                        <span className="text-xs capitalize text-ink/40">
                            {b.payment_method.replace('_', '.')}
                        </span>
                    )}
                </p>
                {!b.created_by && !needsDetails(b) && stale && (
                    <p className="text-xs font-medium text-red-600">
                        stuck / abandoned
                    </p>
                )}
            </div>

            <div className="mt-3 flex items-center gap-4">
                <button
                    onClick={onViewDetails}
                    className="text-xs font-medium text-ink/70 hover:text-ink"
                >
                    View Details
                </button>
                {eligible && (
                    <button
                        onClick={onToggleTakeOver}
                        className="text-xs text-gold-dark hover:underline"
                    >
                        {expanded ? 'Cancel' : 'Take over'}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="mt-3 border-t border-line pt-3">
                    <TakeOverFields booking={b} onDone={onToggleTakeOver} />
                </div>
            )}
        </div>
    );
}

function TakeOverRow({
    booking,
    onDone,
}: {
    booking: Booking;
    onDone: () => void;
}) {
    return (
        <tr className="bg-cream-deep/60">
            <td colSpan={6} className="px-4 py-4">
                <TakeOverFields booking={booking} onDone={onDone} inline />
            </td>
        </tr>
    );
}

type PaymentMethod = 'cash' | 'ecocash' | 'onemoney' | 'card' | 'booking_com';

function TakeOverFields({
    booking,
    onDone,
    inline = false,
}: {
    booking: Booking;
    onDone: () => void;
    inline?: boolean;
}) {
    const placeholder = needsDetails(booking);

    const [firstName, setFirstName] = useState(booking.first_name);
    const [lastName, setLastName] = useState(booking.last_name);
    const [email, setEmail] = useState(booking.email ?? '');
    const [phone, setPhone] = useState(booking.phone);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
        placeholder ? 'booking_com' : 'cash',
    );
    const [paid, setPaid] = useState(!placeholder);
    const [submitting, setSubmitting] = useState(false);

    function changePaymentMethod(method: PaymentMethod) {
        setPaymentMethod(method);
        // Booking.com collects payment itself (or the guest pays at
        // checkout) — our system never actually took the money, so don't
        // default to "paid" the way a cash/EcoCash take-over would. Staff
        // can still tick it if it's since been reconciled.
        if (method === 'booking_com') setPaid(false);
    }

    function submit() {
        setSubmitting(true);
        router.put(
            `/dashboard/bookings/${booking.id}/take-over`,
            {
                payment_method: paymentMethod,
                paid,
                first_name: firstName,
                last_name: lastName,
                email: email || null,
                phone,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    onDone();
                },
            },
        );
    }

    return (
        <div className={inline ? 'space-y-4' : 'space-y-3'}>
            {inline && (
                <p className="text-sm text-ink/70">
                    {placeholder
                        ? 'Fill in the guest\u2019s details from the Booking.com confirmation email — this becomes a regular staff-handled booking.'
                        : 'Guest paid another way — record it and this booking becomes a staff-handled walk-in.'}
                </p>
            )}

            {placeholder && (
                <div className="grid grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2">
                    <Field
                        label="First name"
                        value={firstName}
                        onChange={setFirstName}
                    />
                    <Field
                        label="Last name"
                        value={lastName}
                        onChange={setLastName}
                    />
                    <Field
                        label="Phone"
                        value={phone}
                        onChange={setPhone}
                        type="tel"
                    />
                    <Field
                        label="Email (optional)"
                        value={email}
                        onChange={setEmail}
                        type="email"
                    />
                </div>
            )}

            <div
                className={
                    inline ? 'flex flex-wrap items-end gap-4' : 'space-y-3'
                }
            >
                <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                        Payment method
                    </span>
                    <select
                        value={paymentMethod}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            changePaymentMethod(e.target.value as PaymentMethod)
                        }
                        className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold sm:w-auto"
                    >
                        <option value="cash">Cash</option>
                        <option value="ecocash">EcoCash</option>
                        <option value="onemoney">OneMoney</option>
                        <option value="card">Card</option>
                        <option value="booking_com">Booking.com</option>
                    </select>
                </label>

                <label className="flex items-center gap-2 text-sm text-ink/70">
                    <input
                        type="checkbox"
                        checked={paid}
                        onChange={(e) => setPaid(e.target.checked)}
                        className="rounded border-line text-gold focus:ring-gold"
                    />
                    Payment collected
                </label>

                <button
                    onClick={submit}
                    disabled={submitting}
                    className="btn-primary w-full px-4 py-2 text-xs sm:w-auto"
                >
                    {submitting ? 'Saving…' : 'Confirm take-over'}
                </button>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
            />
        </label>
    );
}
