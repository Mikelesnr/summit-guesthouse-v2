import { Head, Link, router } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';
import { Room } from '@/types';

interface ShowProps {
    room: Room;
}

export default function Show({ room }: ShowProps) {
    const images = room.images ?? [];

    return (
        <SiteLayout>
            <Head title={`${room.name} room — Summit Lodge`} />

            <section className="mx-auto max-w-6xl px-6 py-12">
                <Link href="/rooms" className="text-sm text-ink/50 hover:text-ink">
                    &larr; Back to rooms
                </Link>

                <h1 className="mt-4 font-display text-3xl text-ink">{room.name} room</h1>

                {images.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {images.map((img) => (
                            <div key={img.id} className="aspect-[4/3] overflow-hidden rounded-xl bg-cream-deep">
                                <img src={img.path} alt={img.alt_text ?? room.name} className="h-full w-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <p className="eyebrow">Details</p>
                        <p className="mt-2 text-ink/70">{room.description}</p>

                        {room.extras && room.extras.length > 0 && (
                            <div className="mt-8">
                                <p className="eyebrow">What&apos;s included</p>
                                <ul className="mt-3 space-y-2 text-sm text-ink/70">
                                    {room.extras.map((extra) => (
                                        <li key={extra} className="flex gap-2">
                                            <span className="text-gold-dark">–</span>
                                            {extra}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="h-fit rounded-2xl border border-line bg-white p-6 shadow-card">
                        <p className="font-display text-2xl text-ink">
                            ${Number(room.price).toFixed(0)}
                            <span className="font-sans text-sm text-ink/50"> / night</span>
                        </p>

                        <dl className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-ink/50">Room type</dt>
                                <dd className="text-ink">{room.type === 'double' ? 'Double' : 'Single'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-ink/50">Max guests</dt>
                                <dd className="text-ink">{room.max_guests} {room.max_guests > 1 ? 'people' : 'person'}</dd>
                            </div>
                            {room.size && (
                                <div className="flex justify-between">
                                    <dt className="text-ink/50">Size</dt>
                                    <dd className="text-ink">{room.size} sq ft</dd>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <dt className="text-ink/50">Breakfast</dt>
                                <dd className="text-ink">{room.has_breakfast ? 'Included' : 'Not included'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-ink/50">Pets</dt>
                                <dd className="text-ink">{room.pets_allowed ? 'Allowed' : 'Not allowed'}</dd>
                            </div>
                        </dl>

                        <button
                            onClick={() => router.get('/book')}
                            className="btn-primary mt-6 w-full"
                        >
                            Check availability
                        </button>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
