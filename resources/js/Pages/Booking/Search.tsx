import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import AvailabilitySearchForm from '@/Components/AvailabilitySearchForm';
import RoomCartCard from '@/Components/RoomCartCard';
import BookingDetailsForm from '@/Pages/Booking/Partials/BookingDetailsForm';
import { AvailabilitySearch, Room } from '@/types';

type Step = 'search' | 'results' | 'details';

interface SearchProps {
    initialSearch?: Partial<AvailabilitySearch> | null;
}

export default function Search({ initialSearch = null }: SearchProps) {
    const [step, setStep] = useState<Step>('search');
    const [search, setSearch] = useState<AvailabilitySearch | null>(
        initialSearch?.check_in && initialSearch?.check_out
            ? { check_in: initialSearch.check_in, check_out: initialSearch.check_out, party_size: initialSearch.party_size ?? 1 }
            : null
    );
    const [rooms, setRooms] = useState<Room[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cartItems = useMemo(
        () =>
            rooms
                .filter((r) => (quantities[r.id] ?? 0) > 0)
                .map((r) => ({ room: r, quantity: quantities[r.id] })),
        [rooms, quantities]
    );

    const cartTotal = useMemo(() => {
        if (!search) return 0;
        const nights = Math.max(1, Math.round((new Date(search.check_out).getTime() - new Date(search.check_in).getTime()) / 86400000));
        return cartItems.reduce((sum, item) => sum + Number(item.room.price) * item.quantity * nights, 0);
    }, [cartItems, search]);

    const guestsCovered = cartItems.reduce((sum, item) => sum + item.room.max_guests * item.quantity, 0);
    const suggestedRooms = search ? Math.ceil(search.party_size / 2) : 0;

    async function runSearch(params: AvailabilitySearch) {
        setLoading(true);
        setError(null);
        setSearch(params);
        setQuantities({});

        try {
            const qs = new URLSearchParams({ check_in: params.check_in, check_out: params.check_out }).toString();
            const res = await fetch(`/api/rooms/available?${qs}`);
            if (!res.ok) throw new Error('Search failed');
            const data: { rooms: Room[] } = await res.json();
            setRooms(data.rooms);
            setStep('results');
        } catch {
            setError("Couldn't check availability — please try again, or message us on WhatsApp.");
        } finally {
            setLoading(false);
        }
    }

    function setQuantity(roomId: string, quantity: number) {
        setQuantities((q) => ({ ...q, [roomId]: quantity }));
    }

    return (
        <SiteLayout>
            <Head title="Book a room — Summit Lodge" />

            <section className="mx-auto max-w-6xl px-6 py-16">
                <p className="eyebrow">Book direct</p>
                <h1 className="mt-2 font-display text-3xl text-ink">When would you like to stay?</h1>
                <p className="mt-2 max-w-lg text-sm text-ink/60">
                    Planning for a group or a conference? Enter your total party size — we&apos;ll help you put
                    together enough rooms to fit everyone.
                </p>

                <div className="mt-8">
                    <AvailabilitySearchForm onSearch={runSearch} loading={loading} initial={search ?? {}} />
                </div>

                {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

                {step === 'results' && search && (
                    <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <h2 className="font-display text-xl text-ink">
                                {rooms.length > 0 ? `${rooms.length} room type${rooms.length > 1 ? 's' : ''} to choose from` : 'Nothing free for those dates'}
                            </h2>
                            <p className="mt-1 text-sm text-ink/50">
                                Each room fits up to 2 guests — for {search.party_size} guest{search.party_size > 1 ? 's' : ''}, you&apos;ll likely
                                need at least {suggestedRooms} room{suggestedRooms > 1 ? 's' : ''}.
                            </p>

                            {rooms.length === 0 ? (
                                <p className="mt-4 text-sm text-ink/60">
                                    Try different dates, or message us on WhatsApp — we sometimes have last-minute changes.
                                </p>
                            ) : (
                                <div className="mt-6 space-y-4">
                                    {rooms.map((room) => (
                                        <RoomCartCard
                                            key={room.id}
                                            room={room}
                                            quantity={quantities[room.id] ?? 0}
                                            onChange={(qty) => setQuantity(room.id, qty)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-fit rounded-2xl border border-line bg-white p-6 shadow-card">
                            <p className="eyebrow">Your selection</p>

                            {cartItems.length === 0 ? (
                                <p className="mt-3 text-sm text-ink/50">Add rooms from the list to build your booking.</p>
                            ) : (
                                <ul className="mt-3 space-y-2 text-sm">
                                    {cartItems.map((item) => (
                                        <li key={item.room.id} className="flex justify-between text-ink/80">
                                            <span>{item.quantity} &times; {item.room.name}</span>
                                            <span>${(Number(item.room.price) * item.quantity).toFixed(0)}/night</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-4 border-t border-line pt-4">
                                <p className="flex justify-between text-sm text-ink/60">
                                    <span>Covers</span>
                                    <span>{guestsCovered} of {search.party_size} guests</span>
                                </p>
                                <p className="mt-1 flex justify-between font-display text-lg text-ink">
                                    <span>Total</span>
                                    <span>${cartTotal.toFixed(0)}</span>
                                </p>
                            </div>

                            {guestsCovered < search.party_size && cartItems.length > 0 && (
                                <p className="mt-3 text-xs text-gold-dark">
                                    This only covers {guestsCovered} of {search.party_size} guests — add another room, or continue if that&apos;s intentional.
                                </p>
                            )}

                            <button
                                onClick={() => setStep('details')}
                                disabled={cartItems.length === 0}
                                className="btn-primary mt-4 w-full disabled:opacity-40"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {step === 'details' && search && cartItems.length > 0 && (
                    <div className="mt-12 max-w-xl">
                        <button onClick={() => setStep('results')} className="mb-4 text-sm text-ink/50 hover:text-ink">
                            &larr; Edit room selection
                        </button>
                        <BookingDetailsForm items={cartItems} search={search} total={cartTotal} />
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}
