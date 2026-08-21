import ChatbotWidget from '@/Components/ChatbotWidget';
import WhatsAppButton from '@/Components/WhatsAppButton';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';

const NAV = [
    { href: '/', label: 'Home' },
    { href: '/rooms', label: 'Rooms' },
    { href: '/book', label: 'Book' },
    { href: '/contact', label: 'Contact' },
];

function isActive(url: string, href: string) {
    return href === '/' ? url === '/' : url.startsWith(href);
}

export default function SiteLayout({ children }: PropsWithChildren) {
    const { url } = usePage();
    const [open, setOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-cream">
            <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2"
                        onClick={() => setOpen(false)}
                    >
                        <img
                            src="/images/brand/logo.png"
                            alt="Summit Lodge"
                            className="h-9 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop nav — active page marked with a small sliding gold underline */}
                    <nav className="hidden gap-1 text-sm font-medium text-ink/70 sm:flex">
                        {NAV.map((item) => {
                            const active = isActive(url, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative px-3 py-2 transition ${active ? 'text-ink' : 'hover:text-ink'}`}
                                >
                                    {item.label}
                                    <span
                                        className={`absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gold-dark transition-all duration-300 ${
                                            active
                                                ? 'opacity-100'
                                                : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-60'
                                        }`}
                                    />
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="hidden items-center gap-4 sm:flex">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-ink/50 transition hover:text-ink"
                        >
                            Staff portal
                        </Link>
                        <Link href="/book" className="btn-primary">
                            Check availability
                        </Link>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setOpen((o) => !o)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-cream-deep sm:hidden"
                    >
                        {open ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* Mobile nav panel */}
                <div
                    className={`overflow-hidden border-t border-line/70 bg-cream transition-all duration-300 sm:hidden ${
                        open ? 'max-h-80' : 'max-h-0 border-t-0'
                    }`}
                >
                    <nav className="flex flex-col px-6 py-4 text-sm font-medium text-ink/70">
                        {NAV.map((item) => {
                            const active = isActive(url, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center justify-between border-b border-line/60 py-3 last:border-0 ${
                                        active ? 'text-ink' : 'hover:text-ink'
                                    }`}
                                >
                                    {item.label}
                                    {active && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-gold-dark" />
                                    )}
                                </Link>
                            );
                        })}
                        <Link
                            href="/book"
                            onClick={() => setOpen(false)}
                            className="btn-primary mt-4 justify-center"
                        >
                            Check availability
                        </Link>
                        <Link
                            href="/login"
                            onClick={() => setOpen(false)}
                            className="mt-3 text-center text-sm text-ink/50 hover:text-ink"
                        >
                            Staff portal
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-line bg-cream-deep">
                <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
                    <div>
                        <p className="font-display text-lg text-ink">
                            Summit Lodge
                        </p>
                        <p className="mt-3 text-sm text-ink/60">
                            A warm stay in Zimbabwe, close to everything that
                            matters.
                        </p>
                    </div>

                    <div>
                        <p className="eyebrow">Get in touch</p>
                        <ul className="mt-3 space-y-2 text-sm text-ink/70">
                            <li>687 Baobab Road, Beitbridge, Zimbabwe</li>
                            <li>
                                <Link
                                    href="/location"
                                    className="hover:text-ink"
                                >
                                    Get directions
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="tel:+263780652983"
                                    className="hover:text-ink"
                                >
                                    +263 78 065 2983
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+263718267984"
                                    className="hover:text-ink"
                                >
                                    +263 71 826 7984
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:summitguestlodge@gmail.com"
                                    className="hover:text-ink"
                                >
                                    summitguestlodge@gmail.com
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.facebook.com/Summitguestlodge"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-ink"
                                >
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
                                    <Link
                                        href={item.href}
                                        className="hover:text-ink"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <p className="border-t border-line py-5 text-center text-xs text-ink/40">
                    &copy; {new Date().getFullYear()} Summit Lodge. All rights
                    reserved.
                </p>
            </footer>

            <WhatsAppButton />
            <ChatbotWidget />
        </div>
    );
}
