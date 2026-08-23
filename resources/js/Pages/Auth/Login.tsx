import ContourLines from '@/Components/ContourLines';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
            <ContourLines
                className="pointer-events-none absolute -right-32 -top-20 h-[420px] w-[600px] text-gold"
                opacity={0.2}
            />
            <Head title="Staff login — Summit Lodge" />

            <div className="w-full max-w-sm rounded-2xl border border-cream/10 bg-cream p-8 shadow-lift">
                <p className="font-display text-lg text-ink">Summit Lodge</p>
                <p className="mt-1 text-sm text-ink/50">Staff sign in</p>

                {status && (
                    <p className="mt-4 text-sm text-green-700">{status}</p>
                )}

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                            Email
                        </span>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoFocus
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                            Password
                        </span>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </label>

                    <label className="flex items-center gap-2 text-sm text-ink/70">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                            className="rounded border-line text-gold focus:ring-gold"
                        />
                        Remember me
                    </label>

                    <button
                        type="submit"
                        disabled={processing}
                        className="btn-primary w-full"
                    >
                        Sign in
                    </button>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="block text-center text-xs text-ink/50 hover:text-ink"
                        >
                            Forgot your password?
                        </Link>
                    )}
                </form>
            </div>
        </div>
    );
}
