import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import WhatsAppButton from '@/Components/WhatsAppButton';
import ChatbotWidget from '@/Components/ChatbotWidget';

const NAV = [
    { href: '/', label: 'Home' },
    { href: '/rooms', label: 'Rooms' },
    { href: '/book', label: 'Book' },
    { href: '/contact', label: 'Contact' },
];

export default function SiteLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/images/brand/logo.png" alt="Summit Lodge" className="h-9 w-auto object-contain" />
                    </Link>
                    <nav className="hidden gap-8 text-sm font-medium text-ink/70 sm:flex">
                        {NAV.map((item) => (
                            <Link key={item.href} href={item.href} className="transition hover:text-ink">
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <Link href="/book" className="btn-primary hidden sm:inline-flex">
                        Check availability
                    </Link>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-line bg-cream-deep">
                <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
                    <div>
                        <p className="font-display text-lg text-ink">Summit Lodge</p>
                        <p className="mt-3 text-sm text-ink/60">
                            A warm stay in Zimbabwe, close to everything that matters.
                        </p>
                    </div>

                    <div>
                        <p className="eyebrow">Get in touch</p>
                        <ul className="mt-3 space-y-2 text-sm text-ink/70">
                            <li>687 Baobab Road, Beitbridge, Zimbabwe</li>
                            <li>
                                <Link href="/location" className="hover:text-ink">Get directions</Link>
                            </li>
                            <li>
                                <a href="tel:+263780652983" className="hover:text-ink">+263 78 065 2983</a>
                            </li>
                            <li>
                                <a href="tel:+263718267984" className="hover:text-ink">+263 71 826 7984</a>
                            </li>
                            <li>
                                <a href="mailto:summitguestlodge@gmail.com" className="hover:text-ink">
                                    summitguestlodge@gmail.com
                                </a>
                            </li>
                            <li>
                                <a href="https://www.facebook.com/Summitguestlodge" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                                    Facebook
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="eyebrow">Explore</p>
                        <ul className="mt-3 space-y-2 text-sm text-ink/70">
                            {NAV.slice(1).map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="hover:text-ink">{item.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <p className="border-t border-line py-5 text-center text-xs text-ink/40">
                    &copy; {new Date().getFullYear()} Summit Lodge. All rights reserved.
                </p>
            </footer>

            <WhatsAppButton />
            <ChatbotWidget />
        </div>
    );
}
