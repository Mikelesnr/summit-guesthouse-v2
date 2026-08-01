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
    const [partySize, setPartySize] = useState<number>(initial.party_size ?? 1);

    function submit(e: FormEvent) {
        e.preventDefault();
        onSearch({ check_in: checkIn, check_out: checkOut, party_size: Number(partySize) });
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
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                    Guests <span className="normal-case text-ink/40">(whole party)</span>
                </span>
                <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                />
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                {loading ? 'Searching…' : 'Check availability'}
            </button>
        </form>
    );
}
