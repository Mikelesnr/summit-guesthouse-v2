import { ChangeEvent, FormEvent, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageProps, User, UserRole } from '@/types';

interface UsersIndexProps {
    users: User[];
    assignableRoles: UserRole[];
}

const ROLE_LABEL: Record<UserRole, string> = {
    staff: 'Staff',
    manager: 'Manager',
    owner: 'Owner',
    system_admin: 'System Admin',
};

export default function Index({ users = [], assignableRoles = [] }: UsersIndexProps) {
    const { auth } = usePage<PageProps>().props;

    return (
        <DashboardLayout>
            <Head title="Users" />
            <h1 className="font-display text-2xl text-ink">Users</h1>
            <p className="mt-1 text-sm text-ink/60">
                You can only see and manage roles at or below your own — {ROLE_LABEL[auth.user.role]} sees{' '}
                {assignableRoles.map((r) => ROLE_LABEL[r]).join(', ').toLowerCase()}.
            </p>

            <NewUserForm assignableRoles={assignableRoles} />

            <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <table className="w-full text-sm">
                    <thead className="bg-cream-deep text-left text-xs uppercase tracking-wide text-ink/50">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Active</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {users.map((u) => (
                            <UserRow key={u.id} user={u} assignableRoles={assignableRoles} isSelf={u.id === auth.user.id} />
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}

function NewUserForm({ assignableRoles }: { assignableRoles: UserRole[] }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: assignableRoles[assignableRoles.length - 1] ?? 'staff',
        password: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function update(field: keyof typeof form) {
        return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        router.post('/dashboard/users', form, {
            preserveScroll: true,
            onSuccess: () => {
                setForm({ name: '', email: '', phone: '', role: assignableRoles[assignableRoles.length - 1] ?? 'staff', password: '' });
                setOpen(false);
            },
            onError: (errors) => setError(Object.values(errors)[0] as string),
            onFinish: () => setSubmitting(false),
        });
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="btn-primary mt-6">
                Add user
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-line bg-white p-6 shadow-card sm:grid-cols-2">
            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Name</span>
                <input required value={form.name} onChange={update('name')} className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold" />
            </label>
            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Email</span>
                <input type="email" required value={form.email} onChange={update('email')} className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold" />
            </label>
            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Phone (optional)</span>
                <input value={form.phone} onChange={update('phone')} className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold" />
            </label>
            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Role</span>
                <select value={form.role} onChange={update('role')} className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold">
                    {assignableRoles.map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                </select>
            </label>
            <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">Temporary password</span>
                <input type="text" required minLength={8} value={form.password} onChange={update('password')} className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold" />
            </label>

            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

            <div className="flex gap-3 sm:col-span-2">
                <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Adding…' : 'Add user'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                    Cancel
                </button>
            </div>
        </form>
    );
}

function UserRow({ user, assignableRoles, isSelf }: { user: User; assignableRoles: UserRole[]; isSelf: boolean }) {
    const [role, setRole] = useState(user.role);
    const [active, setActive] = useState(user.is_active);

    function saveRole(newRole: UserRole) {
        setRole(newRole);
        router.put(`/dashboard/users/${user.id}`, { role: newRole }, { preserveScroll: true });
    }

    function toggleActive() {
        const next = !active;
        setActive(next);
        router.put(`/dashboard/users/${user.id}`, { is_active: next }, { preserveScroll: true });
    }

    function deactivate() {
        if (!confirm(`Deactivate ${user.name}?`)) return;
        router.delete(`/dashboard/users/${user.id}`, { preserveScroll: true });
    }

    return (
        <tr>
            <td className="px-4 py-3 font-medium text-ink">
                {user.name} {isSelf && <span className="text-xs text-ink/40">(you)</span>}
            </td>
            <td className="px-4 py-3 text-ink/70">{user.email}</td>
            <td className="px-4 py-3 text-ink/70">{user.phone ?? '—'}</td>
            <td className="px-4 py-3">
                {isSelf ? (
                    <span className="text-ink/70">{ROLE_LABEL[role]}</span>
                ) : (
                    <select
                        value={role}
                        onChange={(e) => saveRole(e.target.value as UserRole)}
                        className="rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                    >
                        {assignableRoles.map((r) => (
                            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                    </select>
                )}
            </td>
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={active}
                    disabled={isSelf}
                    onChange={toggleActive}
                    className="rounded border-line text-gold focus:ring-gold disabled:opacity-40"
                />
            </td>
            <td className="px-4 py-3 text-right">
                {!isSelf && (
                    <button onClick={deactivate} className="text-xs text-red-600 hover:underline">
                        Deactivate
                    </button>
                )}
            </td>
        </tr>
    );
}
