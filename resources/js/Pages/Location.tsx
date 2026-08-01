import { Head } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';

export default function Location() {
    return (
        <SiteLayout>
            <Head title="Location — Summit Lodge" />
            <section className="mx-auto max-w-4xl px-6 py-16">
                <p className="eyebrow">Find us</p>
                <h1 className="mt-2 font-display text-3xl text-ink">Getting to Summit Lodge</h1>
                <p className="mt-4 max-w-lg text-sm text-ink/70">
                    We&apos;re in Harare, Zimbabwe. Message us on WhatsApp for turn-by-turn directions or a pin drop —
                    it&apos;s the fastest way to reach us.
                </p>

                {/* Swap in a real embedded map once you have the exact address/coordinates */}
                <div className="mt-8 flex h-80 items-center justify-center rounded-2xl border border-line bg-cream-deep text-sm text-ink/40">
                    Map embed goes here
                </div>
            </section>
        </SiteLayout>
    );
}
