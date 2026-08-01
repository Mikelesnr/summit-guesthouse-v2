import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageProps } from '@/types';

interface DashboardIndexProps {
    stats?: {
        checkinsToday?: number;
        pending?: number;
        occupied?: number;
    };
}

export default function Index({ stats = {} }: DashboardIndexProps) {
    const { auth } = usePage<PageProps>().props;

    const cards = [
        { label: "Today's check-ins", value: stats.checkinsToday ?? 0 },
        { label: 'Pending bookings', value: stats.pending ?? 0 },
        { label: 'Occupied rooms', value: stats.occupied ?? 0 },
    ];

    return (
        <DashboardLayout>
            <Head title="Dashboard" />
            <h1 className="font-display text-2xl text-ink">Welcome back, {auth.user.name.split(' ')[0]}</h1>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {cards.map((c) => (
                    <div key={c.label} className="rounded-2xl border border-line bg-white p-6 shadow-card">
                        <p className="text-xs uppercase tracking-wide text-ink/50">{c.label}</p>
                        <p className="mt-2 font-display text-3xl text-ink">{c.value}</p>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
