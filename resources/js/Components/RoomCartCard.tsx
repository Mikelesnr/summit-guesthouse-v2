import { Room } from '@/types';

interface RoomCartCardProps {
    room: Room;
    quantity: number;
    onChange: (quantity: number) => void;
}

export default function RoomCartCard({ room, quantity, onChange }: RoomCartCardProps) {
    const image = room.images?.[0]?.path;
    const available = room.available_quantity ?? 0;

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:flex-row">
            <div className="h-44 w-full shrink-0 overflow-hidden bg-cream-deep sm:h-auto sm:w-48">
                {image ? (
                    <img src={image} alt={room.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-ink/30">
                        Photo coming soon
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg text-ink">{room.name}</h3>
                        <p className="font-display text-lg text-ink">
                            ${Number(room.price).toFixed(0)}
                            <span className="font-sans text-xs text-ink/50"> / night</span>
                        </p>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">
                        Up to {room.max_guests} guest{room.max_guests > 1 ? 's' : ''} per room
                        {room.has_breakfast ? ' · breakfast included' : ''}
                    </p>
                    <p className="mt-1 text-xs text-gold-dark">
                        {available > 0 ? `${available} room${available > 1 ? 's' : ''} available` : 'Fully booked for these dates'}
                    </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onChange(Math.max(0, quantity - 1))}
                            disabled={quantity === 0}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink disabled:opacity-30"
                            aria-label={`Fewer ${room.name} rooms`}
                        >
                            &minus;
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-ink">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => onChange(Math.min(available, quantity + 1))}
                            disabled={quantity >= available}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink disabled:opacity-30"
                            aria-label={`More ${room.name} rooms`}
                        >
                            +
                        </button>
                    </div>
                    {quantity > 0 && (
                        <p className="text-xs text-ink/50">covers up to {quantity * room.max_guests} guests</p>
                    )}
                </div>
            </div>
        </div>
    );
}
