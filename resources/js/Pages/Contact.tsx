import { Head } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';

export default function Contact() {
    return (
        <SiteLayout>
            <Head title="Contact — Summit Lodge" />
            <section className="mx-auto max-w-xl px-6 py-16 text-center">
                <p className="eyebrow">Contact</p>
                <h1 className="mt-2 font-display text-3xl text-ink">Talk to us directly</h1>
                <p className="mt-4 text-sm text-ink/70">
                    Most guests reach us fastest on WhatsApp. Tap the button in the corner any time, or use the
                    details below.
                </p>

                <div className="mt-8 space-y-2 text-sm text-ink/70">
                    <p><a href="tel:+263773270659" className="hover:text-ink">+263 77 327 0659</a></p>
                    <p><a href="mailto:info@summitguesthouse.org" className="hover:text-ink">info@summitguesthouse.org</a></p>
                    <p>Harare, Zimbabwe</p>
                </div>
            </section>
        </SiteLayout>
    );
}
