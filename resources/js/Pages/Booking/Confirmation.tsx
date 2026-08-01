import { Head } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import { Booking } from '@/types';

type ConfirmationStatus = 'paid' | 'pending' | 'failed';

const STATUS_COPY: Record<ConfirmationStatus, { title: string; body: string }> = {
    paid: {
        title: "You're booked.",
        body: 'Payment received — a confirmation has been sent to your email. We look forward to hosting you.',
    },
    pending: {
        title: 'Almost there.',
        body: "We're still waiting on confirmation from Paynow. This page will update shortly — you can also refresh in a minute.",
    },
    failed: {
        title: "That didn't go through.",
        body: "Your payment wasn't completed. No charge was made — feel free to try again, or message us on WhatsApp and we'll help directly.",
    },
};

interface ConfirmationProps {
    booking?: Booking;
    status?: ConfirmationStatus;
}

export default function Confirmation({ booking, status = 'pending' }: ConfirmationProps) {
    const copy = STATUS_COPY[status];

    return (
        <SiteLayout>
            <Head title="Booking confirmation — Summit Lodge" />

            <section className="mx-auto max-w-xl px-6 py-24 text-center">
                <h1 className="font-display text-3xl text-ink">{copy.title}</h1>
                <p className="mt-4 text-ink/70">{copy.body}</p>

                {booking && (
                    <div className="mt-8 rounded-2xl border border-line bg-white p-6 text-left shadow-card">
                        <p className="eyebrow">Booking reference</p>
                        <p className="mt-1 font-mono text-sm text-ink">{booking.reference}</p>
                        <div className="mt-4 space-y-1 text-sm text-ink/70">
                            <p>{booking.room?.name}</p>
                            <p>{booking.check_in} &rarr; {booking.check_out}</p>
                            <p>${booking.total_price}</p>
                        </div>
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}
