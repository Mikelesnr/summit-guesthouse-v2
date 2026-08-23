import { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function DashboardLayout({ children }: PropsWithChildren) {
    const { auth, flash } = usePage<PageProps>().props;
    const canManageRooms = ['manager', 'owner', 'system_admin'].includes(
        auth.user.role,
    );

    return (
        <div className="min-h-screen bg-cream">
            <div className="flex">
                <aside className="hidden w-56 shrink-0 border-r border-line bg-white/60 p-6 sm:block">
                    <Link
                        href="/dashboard"
                        className="font-display text-lg text-ink"
                    >
                        Summit Lodge
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-wide text-ink/40">
                        {auth.user.role.replace('_', ' ')}
                    </p>

                    <nav className="mt-8 space-y-1 text-sm">
                        <NavItem href="/dashboard">Overview</NavItem>
                        <NavItem href="/dashboard/bookings">Bookings</NavItem>
                        {canManageRooms && (
                            <NavItem href="/dashboard/rooms">Rooms</NavItem>
                        )}
                        {canManageRooms && (
                            <NavItem href="/dashboard/users">Users</NavItem>
                        )}
                    </nav>

                    <button
                        onClick={() => router.post('/logout')}
                        className="mt-10 text-sm text-ink/50 hover:text-ink"
                    >
                        Sign out
                    </button>
                </aside>

                <main className="flex-1 p-6 sm:p-10">
                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-gold-light bg-gold-light/20 px-4 py-3 text-sm text-gold-dark">
                            {flash.success}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, children }: PropsWithChildren<{ href: string }>) {
    const { url } = usePage();
    const active =
        url.startsWith(href) && (href !== '/dashboard' || url === '/dashboard');

    return (
        <Link
            href={href}
            className={`block rounded-lg px-3 py-2 transition ${
                active ? 'bg-ink text-cream' : 'text-ink/70 hover:bg-cream-deep'
            }`}
        >
            {children}
        </Link>
    );
}
