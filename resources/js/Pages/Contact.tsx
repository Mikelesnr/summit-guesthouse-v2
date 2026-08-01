import { ChangeEvent, FormEvent, useState } from 'react';
import { Head } from '@inertiajs/react';
import SiteLayout from '@/Layouts/SiteLayout';

interface FormState {
    name: string;
    email: string;
    subject: string;
    message: string;
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
    const [form, setForm] = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

    function update(field: keyof FormState) {
        return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify(form),
            });
            const data: { message: string } = await res.json();

            setResult({ ok: res.ok, message: data.message });
            if (res.ok) setForm(EMPTY);
        } catch {
            setResult({ ok: false, message: "Sorry, that didn't send — please try WhatsApp instead." });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <SiteLayout>
            <Head title="Contact — Summit Lodge" />
            <section className="mx-auto max-w-5xl px-6 py-16">
                <p className="eyebrow">Contact</p>
                <h1 className="mt-2 font-display text-3xl text-ink">Talk to us directly</h1>
                <p className="mt-4 max-w-lg text-sm text-ink/70">
                    Most guests reach us fastest on WhatsApp — tap the button in the corner any time. Prefer to
                    write it out? Use the form below.
                </p>

                <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
                    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card">
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Full name</span>
                            <input
                                required
                                value={form.name}
                                onChange={update('name')}
                                className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Email address</span>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={update('email')}
                                className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Subject</span>
                            <input
                                required
                                value={form.subject}
                                onChange={update('subject')}
                                className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Message</span>
                            <textarea
                                required
                                rows={5}
                                value={form.message}
                                onChange={update('message')}
                                className="w-full resize-none rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                            />
                        </label>

                        {result && (
                            <p className={`text-sm ${result.ok ? 'text-green-700' : 'text-red-600'}`}>{result.message}</p>
                        )}

                        <button type="submit" disabled={submitting} className="btn-primary w-full">
                            {submitting ? 'Sending…' : 'Send message'}
                        </button>
                    </form>

                    <div>
                        <div className="space-y-2 text-sm text-ink/70">
                            <p><a href="tel:+263780652983" className="hover:text-ink">+263 78 065 2983</a></p>
                            <p><a href="tel:+263718267984" className="hover:text-ink">+263 71 826 7984</a></p>
                            <p><a href="mailto:summitguestlodge@gmail.com" className="hover:text-ink">summitguestlodge@gmail.com</a></p>
                            <p>687 Baobab Road, Beitbridge, Zimbabwe</p>
                            <p>
                                <a href="https://www.facebook.com/Summitguestlodge" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                                    facebook.com/Summitguestlodge
                                </a>
                            </p>
                        </div>

                        <div className="mt-6 overflow-hidden rounded-2xl border border-line shadow-card">
                            <iframe
                                title="Summit Lodge location"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7387.997945551164!2d29.99551970762577!3d-22.202145335433737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ec8c914f8ae4739%3A0x27c53b28a705a55d!2sSummit%20Guest%20house!5e0!3m2!1sen!2szw!4v1703140046815!5m2!1sen!2szw"
                                width="100%"
                                height="280"
                                style={{ border: 0 }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
