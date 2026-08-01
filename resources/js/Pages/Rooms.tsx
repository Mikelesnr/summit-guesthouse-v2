import { Head, router } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import RoomCard from '@/Components/RoomCard';
import { Room } from '@/types';

interface RoomsProps {
    rooms: Room[];
}

export default function Rooms({ rooms = [] }: RoomsProps) {
    return (
        <SiteLayout>
            <Head title="Rooms — Summit Lodge" />
            <section className="mx-auto max-w-6xl px-6 py-16">
                <p className="eyebrow">Rooms</p>
                <h1 className="mt-2 font-display text-3xl text-ink">Every room we offer</h1>
                <p className="mt-2 max-w-lg text-sm text-ink/60">
                    Prices shown are per night. Select &quot;Check availability&quot; to see what&apos;s free on your dates.
                </p>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            viewHref={`/rooms/${room.slug}`}
                            selectLabel="View room"
                            onSelect={() => router.get(`/rooms/${room.slug}`)}
                        />
                    ))}
                </div>
            </section>
        </SiteLayout>
    );
}
