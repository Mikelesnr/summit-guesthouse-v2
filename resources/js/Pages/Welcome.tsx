import AvailabilitySearchForm from '@/Components/AvailabilitySearchForm';
import ContourLines from '@/Components/ContourLines';
import RoomCard from '@/Components/RoomCard';
import SiteLayout from '@/Layouts/SiteLayout';
import { AvailabilitySearch, Room } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Coffee, Fan, Satellite, Wifi } from 'lucide-react';

const SERVICES = [
    {
        icon: Coffee,
        title: 'Breakfast',
        info: 'Dining services for all meals, with room service as an option.',
    },
    {
        icon: Satellite,
        title: 'DStv',
        info: 'Full bouquet DStv, every channel available for your viewing pleasure.',
    },
    {
        icon: Fan,
        title: 'Air conditioning',
        info: 'Every room is air-conditioned to keep things comfortable.',
    },
    {
        icon: Wifi,
        title: 'Wi-Fi',
        info: 'High-speed fibre Wi-Fi in every room, for work or downtime.',
    },
];

const AMENITY_PHOTOS = [
    { src: '/images/amenities/2.jpeg', alt: 'Guesthouse frontage' },
    { src: '/images/amenities/5.jpeg', alt: 'Lounge seating' },
    { src: '/images/amenities/3.jpeg', alt: 'Dining area' },
    { src: '/images/amenities/4.jpeg', alt: 'Veranda' },
    { src: '/images/amenities/1.jpeg', alt: 'Guesthouse grounds' },
    { src: '/images/amenities/6.jpeg', alt: 'Garden' },
];

const TESTIMONIALS = [
    {
        name: 'Tinashe',
        quote: "It's a warm place to be, feels like home and the accommodation and services are too good. Very hospitable staff. Recommend this place to anyone. The best in Beitbridge by far.",
        avatar: '/images/reviews/tinashe.jpg',
    },
    {
        name: 'Knowledge',
        quote: 'I would recommend it 100% to anyone who needs accommodation in Beitbridge for a decent price. No complaints whatsoever.',
    },
    {
        name: 'Ngoni',
        quote: 'High speed internet, could keep up with my online classes. The food was great, comfortable clean rooms and very friendly staff. I highly recommend.',
        avatar: '/images/reviews/ngoni.jpeg',
    },
    {
        name: 'Nicholas',
        quote: 'Excellent place to stay. Great service. The hosts are very friendly, kind and welcoming. The rooms were clean with fresh linen on the bed.',
    },
    {
        name: 'Lazarus S.',
        quote: 'I really enjoyed their services, keep the standard. Once you arrive at the place — wow, excellent services, thumbs up team.',
    },
];

interface WelcomeProps {
    featuredRooms: Room[];
}

export default function Welcome({ featuredRooms = [] }: WelcomeProps) {
    function goToBooking(search: AvailabilitySearch) {
        router.get('/book', search as any);
    }

    return (
        <SiteLayout>
            <Head title="Summit Lodge — A warm stay in Beitbridge" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-ink text-cream">
                <ContourLines
                    className="pointer-events-none absolute -right-24 -top-16 h-[420px] w-[600px] text-gold"
                    opacity={0.22}
                />
                <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-28 pt-20 sm:pt-28 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <p className="eyebrow text-gold-light">
                            Beitbridge, Zimbabwe
                        </p>
                        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                            A quiet place at the top of your trip.
                        </h1>
                        <p className="mt-5 max-w-md text-cream/70">
                            Deluxe rooms starting at $50 — comfortable, close to
                            the border, and run by people who actually want you
                            to enjoy your stay.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-lift">
                            <img
                                src="/images/home-b.jpeg"
                                alt="Summit Lodge guesthouse"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Search card, overlapping the hero */}
            <div className="mx-auto -mt-14 max-w-4xl px-6">
                <AvailabilitySearchForm onSearch={goToBooking} />
            </div>

            {/* Services */}
            <section className="mx-auto max-w-6xl px-6 py-20">
                <p className="eyebrow">Services</p>
                <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
                    Every stay includes
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {SERVICES.map((s) => (
                        <div key={s.title}>
                            <s.icon
                                className="h-6 w-6 text-gold-dark"
                                strokeWidth={1.5}
                            />
                            <p className="mt-3 font-display text-lg text-ink">
                                {s.title}
                            </p>
                            <p className="mt-1 text-sm text-ink/60">{s.info}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Featured rooms */}
            <section className="bg-cream-deep py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <p className="eyebrow">Rooms</p>
                    <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
                        Featured rooms
                    </h2>

                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredRooms.length === 0 && (
                            <p className="text-sm text-ink/50">
                                Rooms will appear here once added in the
                                dashboard.
                            </p>
                        )}
                        {featuredRooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                viewHref={`/rooms/${room.slug}`}
                                selectLabel="View room"
                                onSelect={() =>
                                    router.get(`/rooms/${room.slug}`)
                                }
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Book a room CTA */}
            <section className="relative overflow-hidden bg-ink py-20 text-center text-cream">
                <ContourLines
                    className="pointer-events-none absolute -bottom-16 -left-24 h-[380px] w-[540px] text-gold"
                    opacity={0.18}
                />
                <div className="relative mx-auto max-w-2xl px-6">
                    <h2 className="font-display text-2xl sm:text-3xl">
                        Book a room
                    </h2>
                    <p className="mt-3 text-cream/70">
                        Plan an unforgettable experience at Summit Lodge today.
                    </p>
                    <button
                        onClick={() => router.get('/book')}
                        className="btn-primary mt-6"
                    >
                        Book
                    </button>
                </div>
            </section>

            {/* Amenities gallery */}
            <section className="mx-auto max-w-6xl px-6 py-20">
                <p className="eyebrow">Amenities</p>
                <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
                    Around the guesthouse
                </h2>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {AMENITY_PHOTOS.map((photo) => (
                        <div
                            key={photo.src}
                            className="aspect-square overflow-hidden rounded-xl bg-cream-deep"
                        >
                            <img
                                src={photo.src}
                                alt={photo.alt}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-cream-deep py-20">
                <div className="mx-auto max-w-6xl px-6">
                    <p className="eyebrow text-center">Testimonials</p>
                    <h2 className="mt-2 text-center font-display text-2xl text-ink sm:text-3xl">
                        What our guests say
                    </h2>

                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {TESTIMONIALS.map((t) => (
                            <div
                                key={t.name}
                                className="rounded-2xl border border-line bg-white p-6 shadow-card"
                            >
                                <div className="flex items-center gap-3">
                                    {t.avatar ? (
                                        <img
                                            src={t.avatar}
                                            alt={t.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-light font-display text-sm text-ink">
                                            {t.name[0]}
                                        </div>
                                    )}
                                    <p className="font-display text-ink">
                                        {t.name}
                                    </p>
                                </div>
                                <p className="mt-4 text-sm text-ink/70">
                                    {t.quote}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
