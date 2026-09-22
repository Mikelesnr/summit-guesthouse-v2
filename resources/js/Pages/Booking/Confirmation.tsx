import SiteLayout from '@/Layouts/SiteLayout';
import { Booking } from '@/types';
import { Head } from '@inertiajs/react';

type ConfirmationStatus = 'paid' | 'pending' | 'failed';

const STATUS_COPY: Record<ConfirmationStatus, { title: string; body: string }> =
    {
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
    bookings: Booking[];
    total: number;
    status?: ConfirmationStatus;
}

export default function Confirmation({
    bookings = [],
    total,
    status = 'pending',
}: ConfirmationProps) {
    const copy = STATUS_COPY[status];
    const primary = bookings[0];

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return isNaN(date.getTime())
            ? dateString
            : date.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC',
              });
    };

    return (
        <SiteLayout>
            <Head title="Booking confirmation — Summit Lodge" />

            <section className="mx-auto max-w-xl px-6 py-24 text-center">
                <h1 className="font-display text-3xl text-ink">{copy.title}</h1>
                <p className="mt-4 text-ink/70">{copy.body}</p>

                {primary && (
                    <div className="mt-8 rounded-2xl border border-line bg-white p-6 text-left shadow-card">
                        <p className="eyebrow">Booking reference</p>
                        <p className="mt-1 font-mono text-sm text-ink">
                            {primary.group_reference ?? primary.reference}
                        </p>

                        <ul className="mt-4 space-y-1 text-sm text-ink/70">
                            {bookings.map((b) => (
                                <li key={b.id}>{b.room?.name} room</li>
                            ))}
                        </ul>

                        <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm text-ink/70">
                            <p>
                                {`${formatDate(primary.check_in)} → ${formatDate(primary.check_out)}`}
                            </p>
                            <p className="font-display text-lg text-ink">
                                ${total}
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}
