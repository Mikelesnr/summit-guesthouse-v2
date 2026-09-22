import { Booking } from '@/types';
import { router } from '@inertiajs/react';

interface Props {
    booking: Booking;
    onClose: () => void;
}

export default function BookingModal({ booking, onClose }: Props) {
    const handleCheckInSingle = () => {
        router.put(
            route('dashboard.bookings.check-in', booking.id),
            {},
            { preserveScroll: true, onSuccess: () => onClose() },
        );
    };

    const handleCheckInGroup = () => {
        router.put(
            route('dashboard.bookings.check-in-group', booking.id),
            {},
            { preserveScroll: true, onSuccess: () => onClose() },
        );
    };

    const handleCheckOutSingle = () => {
        router.put(
            route('dashboard.bookings.check-out', booking.id),
            {},
            { preserveScroll: true, onSuccess: () => onClose() },
        );
    };

    const handleCheckOutGroup = () => {
        router.put(
            route('dashboard.bookings.check-out-group', booking.id),
            {},
            { preserveScroll: true, onSuccess: () => onClose() },
        );
    };

    const isGroup = Boolean(booking.group_reference);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="font-display text-xl text-ink">
                        Booking Details ({booking.reference.substring(0, 8)})
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-ink/40 hover:text-ink"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-4 space-y-3 text-sm text-ink/80">
                    <p>
                        <strong>Guest:</strong>{' '}
                        {booking.first_name || booking.last_name
                            ? `${booking.first_name} ${booking.last_name}`
                            : 'Not yet filled in (Booking.com)'}
                    </p>
                    {booking.source === 'booking_com' &&
                        !booking.created_by && (
                            <p className="rounded-lg bg-gold-light/20 px-3 py-2 text-xs font-medium text-gold-dark">
                                Synced from Booking.com — use &quot;Take
                                over&quot; on the bookings list to fill in guest
                                details.
                            </p>
                        )}
                    <p>
                        <strong>Phone:</strong> {booking.phone || 'N/A'}
                    </p>
                    <p>
                        <strong>Email:</strong> {booking.email || 'N/A'}
                    </p>
                    <p>
                        <strong>Room:</strong> {booking.room?.name}
                    </p>
                    <p>
                        <strong>Dates:</strong> {booking.check_in} to{' '}
                        {booking.check_out}
                    </p>
                    <p>
                        <strong>Status:</strong>{' '}
                        <span className="font-semibold capitalize">
                            {booking.status}
                        </span>
                    </p>
                    {booking.notes && (
                        <p>
                            <strong>Notes:</strong> {booking.notes}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4">
                    {/* Check In Action Group */}
                    {booking.status !== 'checked_in' &&
                        booking.status !== 'checked_out' && (
                            <>
                                <button
                                    onClick={handleCheckInSingle}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                                >
                                    Check In This Room
                                </button>

                                {isGroup && (
                                    <button
                                        onClick={handleCheckInGroup}
                                        className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-900"
                                    >
                                        Check In Entire Group
                                    </button>
                                )}
                            </>
                        )}

                    {/* Check Out Action Group */}
                    {booking.status === 'checked_in' && (
                        <>
                            <button
                                onClick={handleCheckOutSingle}
                                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700"
                            >
                                Check Out Guest
                            </button>

                            {isGroup && (
                                <button
                                    onClick={handleCheckOutGroup}
                                    className="rounded-xl bg-purple-900 px-4 py-2 text-xs font-medium text-white hover:bg-purple-950"
                                >
                                    Check Out Entire Group
                                </button>
                            )}
                        </>
                    )}

                    <button
                        onClick={onClose}
                        className="rounded-xl border border-line px-4 py-2 text-xs hover:bg-cream-deep"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
