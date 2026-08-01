import { Head, router } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import ContourLines from '@/Components/ContourLines';
import AvailabilitySearchForm from '@/Components/AvailabilitySearchForm';
import RoomCard from '@/Components/RoomCard';
import { AvailabilitySearch, Room } from '@/types';

const AMENITIES = [
    { title: 'High-speed Wi-Fi', desc: 'Fast, reliable connectivity in every room.' },
    { title: 'Full DStv package', desc: 'A wide channel bouquet on every TV.' },
    { title: 'Hot water, always', desc: 'Pressurised hot water, day or night.' },
    { title: 'Room service', desc: 'All meals available straight to your room.' },
];

interface WelcomeProps {
    featuredRooms: Room[];
}

export default function Welcome({ featuredRooms = [] }: WelcomeProps) {
    function goToBooking(search: AvailabilitySearch) {
        router.get('/book', search);
    }

    return (
        <SiteLayout>
            <Head title="Summit Lodge — A warm stay in Zimbabwe" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-ink text-cream">
                <ContourLines className="pointer-events-none absolute -right-24 -top-16 h-[420px] w-[600px] text-gold" opacity={0.22} />
                <div className="mx-auto max-w-6xl px-6 pb-28 pt-20 sm:pt-28">
                    <p className="eyebrow text-gold-light">Harare, Zimbabwe</p>
                    <h1 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">
                        A quiet place at the top of your trip.
                    </h1>
                    <p className="mt-5 max-w-md text-cream/70">
                        Comfortable rooms, genuine hospitality, and everything within reach —
                        book direct and skip the middleman.
                    </p>
                </div>
            </section>

            {/* Search card, overlapping the hero */}
            <div className="mx-auto -mt-14 max-w-4xl px-6">
                <AvailabilitySearchForm onSearch={goToBooking} />
            </div>

            {/* Featured rooms */}
            <section className="mx-auto max-w-6xl px-6 py-20">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="eyebrow">Rooms</p>
                        <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">A room for every stay</h2>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {featuredRooms.length === 0 && (
                        <p className="text-sm text-ink/50">Rooms will appear here once added in the dashboard.</p>
                    )}
                    {featuredRooms.map((room) => (
                        <RoomCard key={room.id} room={room} onSelect={() => router.get('/book')} />
                    ))}
                </div>
            </section>

            {/* Amenities */}
            <section className="relative overflow-hidden bg-cream-deep py-20">
                <ContourLines className="pointer-events-none absolute -left-20 bottom-0 h-[320px] w-[460px] text-gold" opacity={0.18} />
                <div className="mx-auto max-w-6xl px-6">
                    <p className="eyebrow">What&apos;s included</p>
                    <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">Every stay comes with</h2>

                    <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {AMENITIES.map((a) => (
                            <div key={a.title}>
                                <p className="font-display text-lg text-ink">{a.title}</p>
                                <p className="mt-1 text-sm text-ink/60">{a.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-6xl px-6 py-20 text-center">
                <h2 className="font-display text-2xl text-ink sm:text-3xl">Ready when you are.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
                    Pick your dates and see what&apos;s actually free — no back-and-forth needed.
                </p>
                <button onClick={() => router.get('/book')} className="btn-primary mt-6">
                    Check availability
                </button>
            </section>
        </SiteLayout>
    );
}
