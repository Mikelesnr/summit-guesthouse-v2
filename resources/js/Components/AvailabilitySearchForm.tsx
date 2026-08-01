import { FormEvent, useState } from 'react';
import { AvailabilitySearch } from '@/types';

const todayIso = () => new Date().toISOString().slice(0, 10);

interface AvailabilitySearchFormProps {
    onSearch: (search: AvailabilitySearch) => void;
    loading?: boolean;
    initial?: Partial<AvailabilitySearch>;
}

export default function AvailabilitySearchForm({
    onSearch,
    loading = false,
    initial = {},
}: AvailabilitySearchFormProps) {
    const [checkIn, setCheckIn] = useState(initial.check_in ?? '');
    const [checkOut, setCheckOut] = useState(initial.check_out ?? '');
    const [guests, setGuests] = useState<number>(initial.guests ?? 1);

    function submit(e: FormEvent) {
        e.preventDefault();
        onSearch({ check_in: checkIn, check_out: checkOut, guests: Number(guests) });
    }

    return (
        <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-white/95 p-5 shadow-lift backdrop-blur sm:grid-cols-4 sm:items-end"
        >
            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Check-in</span>
                <input
                    type="date"
                    required
                    min={todayIso()}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                />
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Check-out</span>
                <input
                    type="date"
                    required
                    min={checkIn || todayIso()}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                />
            </label>

            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Guests</span>
                <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                >
                    <option value={1}>1 guest</option>
                    <option value={2}>2 guests</option>
                </select>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                {loading ? 'Searching…' : 'Check availability'}
            </button>
        </form>
    );
}
