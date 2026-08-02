import { Link } from '@inertiajs/react';
import { Room } from '@/types';

interface RoomCardProps {
    room: Room;
    onSelect: (room: Room) => void;
    selectLabel?: string;
    viewHref?: string;
}

export default function RoomCard({ room, onSelect, selectLabel = 'Select room', viewHref }: RoomCardProps) {
    const image = room.images?.[0]?.path;
    console.log(room.images);
    

    const media = (
        <div className="relative h-56 w-full overflow-hidden bg-cream-deep">
            {image ? (
                <img
                    src={image}
                    alt={room.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-ink/30">
                    Photo coming soon
                </div>
            )}
            {room.is_featured && (
                <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-cream">
                    Popular
                </span>
            )}
        </div>
    );

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:shadow-lift">
            {viewHref ? <Link href={viewHref}>{media}</Link> : media}

            <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg text-ink">
                    {viewHref ? <Link href={viewHref} className="hover:text-gold-dark">{room.name}</Link> : room.name}
                </h3>
                <p className="mt-1 text-sm text-ink/60">
                    {room.type === 'double' ? 'Double room' : 'Single room'} · up to {room.max_guests} guest{room.max_guests > 1 ? 's' : ''}
                    {room.has_breakfast ? ' · breakfast included' : ''}
                </p>

                <p className="mt-3 line-clamp-2 text-sm text-ink/70">{room.description}</p>

                <div className="mt-auto flex items-center justify-between pt-5">
                    <p className="font-display text-xl text-ink">
                        ${Number(room.price).toFixed(0)}
                        <span className="font-sans text-sm text-ink/50"> / night</span>
                    </p>
                    <button onClick={() => onSelect(room)} className="btn-secondary px-4 py-2 text-xs">
                        {selectLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
