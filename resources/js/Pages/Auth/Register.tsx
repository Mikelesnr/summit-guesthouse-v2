import ContourLines from '@/Components/ContourLines';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChangeEvent, FormEventHandler } from 'react';

type Field = 'name' | 'email' | 'phone' | 'password' | 'password_confirmation';

const FIELDS: {
    name: Field;
    label: string;
    type: string;
    autoComplete: string;
}[] = [
    { name: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'username' },
    {
        name: 'phone',
        label: 'Phone (WhatsApp works too)',
        type: 'tel',
        autoComplete: 'tel',
    },
    {
        name: 'password',
        label: 'Password',
        type: 'password',
        autoComplete: 'new-password',
    },
    {
        name: 'password_confirmation',
        label: 'Confirm password',
        type: 'password',
        autoComplete: 'new-password',
    },
];

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 py-10">
            <ContourLines
                className="pointer-events-none absolute -right-32 -top-20 h-[420px] w-[600px] text-gold"
                opacity={0.2}
            />
            <Head title="Create account — Summit Lodge" />

            <div className="w-full max-w-sm rounded-2xl border border-cream/10 bg-cream p-8 shadow-lift">
                <p className="font-display text-lg text-ink">Summit Lodge</p>
                <p className="mt-1 text-sm text-ink/50">
                    Create a guest account to book faster and leave a review.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    {FIELDS.map((field) => (
                        <label key={field.name} className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                                {field.label}
                            </span>
                            <input
                                type={field.type}
                                name={field.name}
                                value={data[field.name]}
                                autoComplete={field.autoComplete}
                                required
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setData(field.name, e.target.value)
                                }
                                className="w-full rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                            />
                            {errors[field.name] && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors[field.name]}
                                </p>
                            )}
                        </label>
                    ))}

                    <button
                        type="submit"
                        disabled={processing}
                        className="btn-primary w-full"
                    >
                        Create account
                    </button>

                    <p className="border-t border-line pt-4 text-center text-xs text-ink/50">
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="font-medium text-ink hover:text-gold-dark"
                        >
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
