import { ChangeEvent, FormEvent, useState } from 'react';
import { AvailabilitySearch, Room } from '@/types';

interface BookingDetailsFormProps {
    room: Room;
    search: AvailabilitySearch;
}

interface FormState {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    notes: string;
}

export default function BookingDetailsForm({ room, search }: BookingDetailsFormProps) {
    const [form, setForm] = useState<FormState>({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nights = Math.max(
        1,
        Math.round((new Date(search.check_out).getTime() - new Date(search.check_in).getTime()) / 86400000)
    );
    const total = (Number(room.price) * nights).toFixed(0);

    function update(field: keyof FormState) {
        return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    room_id: room.id,
                    check_in: search.check_in,
                    check_out: search.check_out,
                    guests: search.guests,
                    ...form,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message ?? 'Could not create booking');
            }

            const data: { redirect_url?: string } = await res.json();
            if (data.redirect_url) {
                window.location.href = data.redirect_url; // off to Paynow's hosted checkout
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong — please try again or message us on WhatsApp.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card">
            <div>
                <p className="font-display text-lg text-ink">{room.name}</p>
                <p className="text-sm text-ink/60">
                    {search.check_in} &rarr; {search.check_out} · {nights} night{nights > 1 ? 's' : ''} · ${total} total
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Field label="First name" value={form.first_name} onChange={update('first_name')} required />
                <Field label="Last name" value={form.last_name} onChange={update('last_name')} required />
            </div>

            <Field type="email" label="Email" value={form.email} onChange={update('email')} required />
            <Field type="tel" label="Phone (WhatsApp works too)" value={form.phone} onChange={update('phone')} required />

            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Notes (optional)</span>
                <textarea
                    value={form.notes}
                    onChange={update('notes')}
                    rows={3}
                    className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Redirecting to payment…' : `Pay $${total} with Paynow`}
            </button>
            <p className="text-center text-xs text-ink/40">You&apos;ll be sent to Paynow&apos;s secure checkout to complete payment.</p>
        </form>
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
