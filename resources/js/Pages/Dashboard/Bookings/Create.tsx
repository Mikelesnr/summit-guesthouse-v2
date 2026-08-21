import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import AvailabilitySearchForm from '@/Components/AvailabilitySearchForm';
import RoomCartCard from '@/Components/RoomCartCard';
import { AvailabilitySearch, Room } from '@/types';

type Step = 'search' | 'results';

interface FormState {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    notes: string;
    payment_method: 'cash' | 'ecocash' | 'onemoney' | 'card';
    paid: boolean;
}

const EMPTY_FORM: FormState = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    notes: '',
    payment_method: 'cash',
    paid: true,
};

export default function Create() {
    const [step, setStep] = useState<Step>('search');
    const [search, setSearch] = useState<AvailabilitySearch | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cartItems = useMemo(
        () => rooms.filter((r) => (quantities[r.id] ?? 0) > 0).map((r) => ({ room: r, quantity: quantities[r.id] })),
        [rooms, quantities]
    );

    const nights = search
        ? Math.max(1, Math.round((new Date(search.check_out).getTime() - new Date(search.check_in).getTime()) / 86400000))
        : 1;

    const total = cartItems.reduce((sum, item) => sum + Number(item.room.price) * item.quantity * nights, 0);
    const guestsCovered = cartItems.reduce((sum, item) => sum + item.room.max_guests * item.quantity, 0);

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
            setError("Couldn't check availability — try again.");
        } finally {
            setLoading(false);
        }
    }

    function setQuantity(roomId: string, quantity: number) {
        setQuantities((q) => ({ ...q, [roomId]: quantity }));
    }

    function updateForm<K extends keyof FormState>(field: K) {
        return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const value = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            setForm((f) => ({ ...f, [field]: value }) as FormState);
        };
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        if (!search || cartItems.length === 0) return;

        setSubmitting(true);
        setError(null);

        router.post(
            '/dashboard/bookings',
            {
                ...form,
                check_in: search.check_in,
                check_out: search.check_out,
                party_size: search.party_size,
                items: cartItems.map((i) => ({ room_id: i.room.id, quantity: i.quantity })),
            },
            {
                onError: (errors) => {
                    setError(Object.values(errors)[0] as string ?? 'Could not create booking.');
                    setSubmitting(false);
                },
                onFinish: () => setSubmitting(false),
            }
        );
    }

    return (
        <DashboardLayout>
            <Head title="New walk-in booking" />
            <h1 className="font-display text-2xl text-ink">New walk-in booking</h1>
            <p className="mt-1 text-sm text-ink/60">
                Books straight against the same availability the website uses — this room becomes
                unavailable online the moment you save it here. Payment is recorded directly, no Paynow checkout.
            </p>

            <div className="mt-8 max-w-2xl">
                <AvailabilitySearchForm onSearch={runSearch} loading={loading} initial={search ?? {}} />
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {step === 'results' && search && (
                <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <h2 className="font-display text-lg text-ink">
                            {rooms.length > 0 ? `${rooms.length} room type${rooms.length > 1 ? 's' : ''}` : 'Nothing free for those dates'}
                        </h2>

                        <div className="mt-4 space-y-4">
                            {rooms.map((room) => (
                                <RoomCartCard
                                    key={room.id}
                                    room={room}
                                    quantity={quantities[room.id] ?? 0}
                                    onChange={(qty) => setQuantity(room.id, qty)}
                                />
                            ))}
                        </div>
                    </div>

                    <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card">
                        <p className="eyebrow">Guest details</p>

                        {cartItems.length === 0 ? (
                            <p className="text-sm text-ink/50">Add rooms from the list to continue.</p>
                        ) : (
                            <>
                                <ul className="space-y-1 text-sm text-ink/70">
                                    {cartItems.map((item) => (
                                        <li key={item.room.id}>{item.quantity} &times; {item.room.name}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-ink/50">
                                    Covers {guestsCovered} of {search.party_size} guests · ${total.toFixed(0)} total
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="First name" value={form.first_name} onChange={updateForm('first_name')} required />
                                    <Field label="Last name" value={form.last_name} onChange={updateForm('last_name')} required />
                                </div>
                                <Field type="tel" label="Phone" value={form.phone} onChange={updateForm('phone')} required />
                                <Field type="email" label="Email (optional)" value={form.email} onChange={updateForm('email')} />

                                <label className="block">
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Payment method</span>
                                    <select
                                        value={form.payment_method}
                                        onChange={updateForm('payment_method')}
                                        className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="ecocash">EcoCash</option>
                                        <option value="onemoney">OneMoney</option>
                                        <option value="card">Card</option>
                                    </select>
                                </label>

                                <label className="flex items-center gap-2 text-sm text-ink/70">
                                    <input
                                        type="checkbox"
                                        checked={form.paid}
                                        onChange={updateForm('paid')}
                                        className="rounded border-line text-gold focus:ring-gold"
                                    />
                                    Payment collected now
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Notes (optional)</span>
                                    <textarea
                                        rows={2}
                                        value={form.notes}
                                        onChange={updateForm('notes')}
                                        className="w-full resize-none rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                                    />
                                </label>

                                <button type="submit" disabled={submitting} className="btn-primary w-full">
                                    {submitting ? 'Saving…' : `Book ${cartItems.reduce((n, i) => n + i.quantity, 0)} room(s)`}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            )}
        </DashboardLayout>
    );
}

interface FieldProps {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
}

function Field({ label, ...props }: FieldProps) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</span>
            <input {...props} className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold" />
        </label>
    );
}
