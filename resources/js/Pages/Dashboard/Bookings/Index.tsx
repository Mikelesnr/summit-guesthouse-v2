import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Booking } from '@/types';

interface BookingsIndexProps {
    bookings: Booking[];
}

const STATUS_STYLES: Record<Booking['status'], string> = {
    pending: 'bg-gold-light/40 text-gold-dark',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-cream-deep text-ink/60',
};

export default function Index({ bookings = [] }: BookingsIndexProps) {
    function updateStatus(booking: Booking, status: Booking['status']) {
        router.put(`/dashboard/bookings/${booking.id}`, { status }, { preserveScroll: true });
    }

    return (
        <DashboardLayout>
            <Head title="Bookings" />
            <h1 className="font-display text-2xl text-ink">Bookings</h1>

            <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <table className="w-full text-sm">
                    <thead className="bg-cream-deep text-left text-xs uppercase tracking-wide text-ink/50">
                        <tr>
                            <th className="px-4 py-3">Guest</th>
                            <th className="px-4 py-3">Room</th>
                            <th className="px-4 py-3">Dates</th>
                            <th className="px-4 py-3">Payment</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {bookings.map((b) => (
                            <tr key={b.id}>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-ink">{b.first_name} {b.last_name}</p>
                                    <p className="text-xs text-ink/50">{b.phone}</p>
                                </td>
                                <td className="px-4 py-3">{b.room?.name}</td>
                                <td className="px-4 py-3 text-ink/70">{b.check_in} &rarr; {b.check_out}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-2 py-1 text-xs ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-cream-deep text-ink/50'}`}>
                                        {b.payment_status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        value={b.status}
                                        onChange={(e) => updateStatus(b, e.target.value as Booking['status'])}
                                        className={`rounded-full border-0 text-xs font-medium focus:ring-gold ${STATUS_STYLES[b.status]}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
