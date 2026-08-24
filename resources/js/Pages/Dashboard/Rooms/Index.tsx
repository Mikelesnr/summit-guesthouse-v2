import DashboardLayout from '@/Layouts/DashboardLayout';
import { Room } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface RoomsIndexProps {
    rooms: Room[];
}

export default function Index({ rooms = [] }: RoomsIndexProps) {
    return (
        <DashboardLayout>
            <Head title="Rooms" />
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl text-ink">Rooms</h1>
            </div>
            <p className="mt-1 text-sm text-ink/60">
                Quantity is how many physical rooms of this type exist —
                it&apos;s what stops the site double-booking.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <table className="w-full text-sm">
                    <thead className="bg-cream-deep text-left text-xs uppercase tracking-wide text-ink/50">
                        <tr>
                            <th className="px-4 py-3">Room</th>
                            <th className="px-4 py-3">Price / night</th>
                            <th className="px-4 py-3">Quantity</th>
                            <th className="px-4 py-3">Max guests</th>
                            <th className="px-4 py-3">Active</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {rooms.map((room) => (
                            <RoomRow key={room.id} room={room} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-10">
                <h2 className="font-display text-lg text-ink">
                    Booking.com calendar sync
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                    For each room: copy the &quot;Our calendar&quot; link into
                    Booking.com&apos;s Extranet (Calendar &rarr; Sync calendars
                    &rarr; Export), then paste the .ics link Booking.com gives
                    you back into &quot;Booking.com&apos;s calendar&quot; below.
                    Synced automatically every few minutes once both are set.
                </p>

                <div className="mt-4 space-y-4">
                    {rooms.map((room) => (
                        <IcalRow key={room.id} room={room} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

interface RoomValues {
    price: number | string;
    quantity: number;
    max_guests: number;
    is_active: boolean;
}

function RoomRow({ room }: { room: Room }) {
    const [values, setValues] = useState<RoomValues>({
        price: room.price,
        quantity: room.quantity,
        max_guests: room.max_guests,
        is_active: room.is_active,
    });
    const [saving, setSaving] = useState(false);

    function save(patch: Partial<RoomValues>) {
        const next = { ...values, ...patch };
        setValues(next);
        setSaving(true);
        router.put(`/dashboard/rooms/${room.id}`, next, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <tr className={saving ? 'opacity-60' : ''}>
            <td className="px-4 py-3 font-medium text-ink">{room.name}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <span className="text-ink/40">$</span>
                    <input
                        type="number"
                        min={0}
                        step={1}
                        value={values.price}
                        onChange={(e) =>
                            setValues((v) => ({ ...v, price: e.target.value }))
                        }
                        onBlur={() => save({ price: values.price })}
                        className="w-20 rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                    />
                </div>
            </td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    min={0}
                    value={values.quantity}
                    onChange={(e) =>
                        setValues((v) => ({
                            ...v,
                            quantity: Number(e.target.value),
                        }))
                    }
                    onBlur={() => save({ quantity: values.quantity })}
                    className="w-16 rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                />
            </td>
            <td className="px-4 py-3">
                <select
                    value={values.max_guests}
                    onChange={(e) =>
                        save({ max_guests: Number(e.target.value) })
                    }
                    className="rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                </select>
            </td>
            <td className="px-4 py-3">
                <label className="inline-flex cursor-pointer items-center">
                    <input
                        type="checkbox"
                        checked={values.is_active}
                        onChange={(e) => save({ is_active: e.target.checked })}
                        className="rounded border-line text-gold focus:ring-gold"
                    />
                </label>
            </td>
        </tr>
    );
}

function IcalRow({ room }: { room: Room }) {
    const [url, setUrl] = useState(room.ical_import_url ?? '');
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const exportUrl = `${window.location.origin}/ical/rooms/${room.id}.ics`;

    function save() {
        setSaving(true);
        router.put(
            `/dashboard/rooms/${room.id}`,
            { ical_import_url: url || null },
            { preserveScroll: true, onFinish: () => setSaving(false) },
        );
    }

    function copyExportUrl() {
        navigator.clipboard.writeText(exportUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <p className="font-medium text-ink">{room.name}</p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                        Our calendar (give this to Booking.com)
                    </span>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={exportUrl}
                            onFocus={(e) => e.target.select()}
                            className="w-full rounded-lg border-line bg-cream-deep text-xs text-ink/70 focus:border-gold focus:ring-gold"
                        />
                        <button
                            type="button"
                            onClick={copyExportUrl}
                            className="btn-secondary shrink-0 px-3 py-1 text-xs"
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                        Booking.com&apos;s calendar (paste theirs here)
                    </span>
                    <div className="flex gap-2">
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://admin.booking.com/...ics"
                            className="w-full rounded-lg border-line text-xs focus:border-gold focus:ring-gold"
                        />
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            className="btn-primary shrink-0 px-3 py-1 text-xs"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </label>
            </div>

            <p className="mt-2 text-xs text-ink/40">
                {room.ical_import_url
                    ? 'Connected — syncing automatically.'
                    : 'Not connected yet.'}
            </p>
        </div>
    );
}
