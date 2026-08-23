import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface DashboardIndexProps {
    stats?: {
        checkinsToday?: number;
        pending?: number;
        occupied?: number;
        monthlyRevenue?: number | null;
    };
    canViewRevenue?: boolean;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

interface StatCardItem {
    label: string;
    value: number | string;
    href: string;
}

export default function Index({
    stats = {},
    canViewRevenue = false,
}: DashboardIndexProps) {
    const { auth } = usePage<PageProps>().props;

    const cards: StatCardItem[] = [
        {
            label: "Today's check-ins",
            value: stats.checkinsToday ?? 0,
            href: '/dashboard/bookings',
        },
        {
            label: 'Pending bookings',
            value: stats.pending ?? 0,
            href: '/dashboard/bookings',
        },
        {
            label: 'Occupied rooms',
            value: stats.occupied ?? 0,
            href: '/dashboard/bookings',
        },
    ];

    if (
        canViewRevenue &&
        stats.monthlyRevenue !== undefined &&
        stats.monthlyRevenue !== null
    ) {
        cards.push({
            label: 'Monthly Revenue',
            value: currencyFormatter.format(stats.monthlyRevenue),
            href: '/dashboard/bookings',
        });
    }

    return (
        <DashboardLayout>
            <Head title="Dashboard" />
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl text-ink">
                    Welcome back, {auth.user.name.split(' ')[0]}
                </h1>
                <Link
                    href="/dashboard/bookings/create"
                    className="btn-primary text-xs"
                >
                    New Walk-In Booking
                </Link>
            </div>

            <div
                className={`mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 ${
                    canViewRevenue ? 'lg:grid-cols-4' : ''
                }`}
            >
                {cards.map((c) => (
                    <Link
                        key={c.label}
                        href={c.href}
                        className="group rounded-2xl border border-line bg-white p-6 shadow-card transition hover:border-gold"
                    >
                        <p className="text-xs uppercase tracking-wide text-ink/50 group-hover:text-gold-dark">
                            {c.label}
                        </p>
                        <p className="mt-2 font-display text-3xl text-ink">
                            {c.value}
                        </p>
                    </Link>
                ))}
            </div>
        </DashboardLayout>
    );
}
