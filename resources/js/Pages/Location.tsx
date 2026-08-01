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
                    687 Baobab Road, Beitbridge, Zimbabwe — a short drive from the Beitbridge border post.
                    Message us on WhatsApp if you&apos;d like turn-by-turn directions.
                </p>

                <div className="mt-8 overflow-hidden rounded-2xl border border-line shadow-card">
                    <iframe
                        title="Summit Lodge location"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7387.997945551164!2d29.99551970762577!3d-22.202145335433737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ec8c914f8ae4739%3A0x27c53b28a705a55d!2sSummit%20Guest%20house!5e0!3m2!1sen!2szw!4v1703140046815!5m2!1sen!2szw"
                        width="100%"
                        height="380"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>

                <a
                    href="https://maps.app.goo.gl/BURFindXjKLScrza6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary mt-6 inline-flex"
                >
                    Open in Google Maps
                </a>
            </section>
        </SiteLayout>
    );
}
