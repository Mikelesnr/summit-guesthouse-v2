import { AvailabilitySearch, CartItem, PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useState } from 'react';

// --- Safe retries -----------------------------------------------------------
// The booking's UUID is made up here, in the browser, and sent with every
// attempt. If the connection drops mid-booking, the retry carries the same
// UUID, so the server finds the booking it already made (and any Paynow
// payment) instead of creating a second one.

const KEY_LIFETIME_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const bookingKeys = new Map<string, { id: string; createdAt: number }>();

function newUuid(): string {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // randomUUID only exists on secure (https / localhost) pages.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));

    return [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10).join(''),
    ].join('-');
}

/** Same rooms and dates reuse the same key, for a while; a changed cart gets a new one. */
function bookingKeyFor(signature: string): string {
    const known = bookingKeys.get(signature);
    if (known && Date.now() - known.createdAt < KEY_LIFETIME_MS) {
        return known.id;
    }

    const id = newUuid();
    bookingKeys.set(signature, { id, createdAt: Date.now() });

    return id;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BookingResponse {
    redirect_url?: string | null;
    paid?: boolean;
    confirmation_url?: string | null;
}

function splitName(fullName: string): { first: string; last: string } {
    const parts = fullName.trim().split(/\s+/);

    return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

interface BookingDetailsFormProps {
    items: CartItem[];
    search: AvailabilitySearch;
    total: number;
}

interface FormState {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    notes: string;
}

export default function BookingDetailsForm({
    items,
    search,
    total,
}: BookingDetailsFormProps) {
    const [form, setForm] = useState<FormState>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // A guest who is signed in has already told us who they are, so only ask
    // for whatever the account does not have.
    const { auth } = usePage<PageProps>().props;
    const account = auth?.user?.role === 'guest' ? auth.user : null;
    const accountName = account ? splitName(account.name) : null;
    const askName = !account || !accountName?.last;
    const askEmail = !account;
    const askPhone = !account || !account.phone;

    const nights = Math.max(
        1,
        Math.round(
            (new Date(search.check_out).getTime() -
                new Date(search.check_in).getTime()) /
                86400000,
        ),
    );

    function update(field: keyof FormState) {
        return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setNotice(null);

        const signature = JSON.stringify([
            search.check_in,
            search.check_out,
            items.map((i) => [i.room.id, i.quantity]),
        ]);

        const contact = {
            first_name: askName ? form.first_name : (accountName?.first ?? ''),
            last_name: askName ? form.last_name : (accountName?.last ?? ''),
            email: askEmail ? form.email : (account?.email ?? ''),
            phone: askPhone ? form.phone : (account?.phone ?? ''),
            notes: form.notes,
        };

        const body = JSON.stringify({
            group_reference: bookingKeyFor(signature),
            check_in: search.check_in,
            check_out: search.check_out,
            party_size: search.party_size,
            items: items.map((i) => ({
                room_id: i.room.id,
                quantity: i.quantity,
            })),
            ...contact,
        });

        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ?? '';

        let leaving = false;

        try {
            let res: Response | null = null;

            for (let attempt = 1; res === null; attempt++) {
                try {
                    res = await fetch('/api/bookings', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                        },
                        body,
                    });
                } catch (networkError) {
                    // fetch only rejects when the network itself failed, so
                    // the request may or may not have reached the server.
                    // Sending it again is safe: same booking UUID.
                    if (attempt >= MAX_ATTEMPTS) throw networkError;
                    setNotice('Connection lost — trying again…');
                    await sleep(1500 * attempt);
                }
            }

            const data: (BookingResponse & Record<string, unknown>) | null =
                await res.json().catch(() => null);

            if (!res.ok) {
                // The server refused this booking reference for good (different
                // rooms/dates, or cancelled): a fresh attempt needs a new one.
                if (
                    data?.code === 'booking_reference_conflict' ||
                    data?.code === 'booking_cancelled'
                ) {
                    bookingKeys.delete(signature);
                }

                const errors = data?.errors as { items?: string[] } | undefined;
                throw new Error(
                    errors?.items?.[0] ??
                        (data?.message as string | undefined) ??
                        'Could not create booking',
                );
            }

            if (data?.paid && data.confirmation_url) {
                // Already paid (e.g. it went through before the retry).
                leaving = true;
                window.location.href = data.confirmation_url;
            } else if (data?.redirect_url) {
                leaving = true;
                window.location.href = data.redirect_url; // off to Paynow's hosted checkout
            } else {
                throw new Error(
                    'We could not start the payment. Please try again, or message us on WhatsApp.',
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong — please try again or message us on WhatsApp.',
            );
        } finally {
            setNotice(null);
            // Stay disabled while the browser is leaving for Paynow.
            if (!leaving) setSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card"
        >
            <div>
                <p className="font-display text-lg text-ink">Your booking</p>
                <ul className="mt-2 space-y-1 text-sm text-ink/70">
                    {items.map((item) => (
                        <li key={item.room.id}>
                            {item.quantity} &times; {item.room.name}
                        </li>
                    ))}
                </ul>
                <p className="mt-2 text-sm text-ink/60">
                    {search.check_in} &rarr; {search.check_out} · {nights} night
                    {nights > 1 ? 's' : ''} · ${total.toFixed(0)} total
                </p>
            </div>

            {account && (
                <p className="rounded-lg bg-cream-deep px-4 py-3 text-sm text-ink/70">
                    Booking as <strong>{account.name}</strong> ({account.email}
                    ). Your details are already on your account.
                </p>
            )}

            {askName && (
                <div className="grid grid-cols-2 gap-4">
                    <Field
                        label="First name"
                        value={form.first_name}
                        onChange={update('first_name')}
                        required
                    />
                    <Field
                        label="Last name"
                        value={form.last_name}
                        onChange={update('last_name')}
                        required
                    />
                </div>
            )}

            {askEmail && (
                <Field
                    type="email"
                    label="Email"
                    value={form.email}
                    onChange={update('email')}
                    required
                />
            )}
            {askPhone && (
                <Field
                    type="tel"
                    label="Phone (WhatsApp works too)"
                    value={form.phone}
                    onChange={update('phone')}
                    required
                />
            )}

            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                    Notes (optional)
                </span>
                <textarea
                    value={form.notes}
                    onChange={update('notes')}
                    rows={3}
                    placeholder="e.g. conference group, arriving late, etc."
                    className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                />
            </label>

            {notice && <p className="text-sm text-ink/60">{notice}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
            >
                {submitting
                    ? 'Redirecting to payment…'
                    : `Pay $${total.toFixed(0)} with Paynow`}
            </button>
            <p className="text-center text-xs text-ink/40">
                You&apos;ll be sent to Paynow&apos;s secure checkout to complete
                payment.
            </p>
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                {label}
            </span>
            <input
                {...props}
                className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
            />
        </label>
    );
}
