import { useState } from 'react';
import { Head } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import AvailabilitySearchForm from '@/Components/AvailabilitySearchForm';
import RoomCard from '@/Components/RoomCard';
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
            ? { check_in: initialSearch.check_in, check_out: initialSearch.check_out, guests: initialSearch.guests ?? 1 }
            : null
    );
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function runSearch(params: AvailabilitySearch) {
        setLoading(true);
        setError(null);
        setSearch(params);

        try {
            const qs = new URLSearchParams({
                check_in: params.check_in,
                check_out: params.check_out,
                guests: String(params.guests),
            }).toString();
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

    function selectRoom(room: Room) {
        setSelectedRoom(room);
        setStep('details');
    }

    return (
        <SiteLayout>
            <Head title="Book a room — Summit Lodge" />

            <section className="mx-auto max-w-6xl px-6 py-16">
                <p className="eyebrow">Book direct</p>
                <h1 className="mt-2 font-display text-3xl text-ink">When would you like to stay?</h1>
                <p className="mt-2 max-w-lg text-sm text-ink/60">
                    Pick your dates and we&apos;ll show you exactly what&apos;s free — no guessing.
                </p>

                <div className="mt-8">
                    <AvailabilitySearchForm onSearch={runSearch} loading={loading} initial={search ?? {}} />
                </div>

                {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

                {step === 'results' && (
                    <div className="mt-12">
                        <h2 className="font-display text-xl text-ink">
                            {rooms.length > 0
                                ? `${rooms.length} room${rooms.length > 1 ? 's' : ''} available`
                                : 'Nothing free for those dates'}
                        </h2>

                        {rooms.length === 0 ? (
                            <p className="mt-2 text-sm text-ink/60">
                                Try different dates, or message us on WhatsApp — we sometimes have last-minute changes.
                            </p>
                        ) : (
                            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {rooms.map((room) => (
                                    <RoomCard key={room.id} room={room} onSelect={selectRoom} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 'details' && selectedRoom && search && (
                    <div className="mt-12 max-w-xl">
                        <button onClick={() => setStep('results')} className="mb-4 text-sm text-ink/50 hover:text-ink">
                            &larr; Choose a different room
                        </button>
                        <BookingDetailsForm room={selectedRoom} search={search} />
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}
