import Stars from '@/Components/Reviews/Stars';
import SiteLayout from '@/Layouts/SiteLayout';
import { PageProps, Review, ReviewStatus } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface AccountProps {
    reviews: Review[];
}

const STATUS_STYLE: Record<ReviewStatus, { label: string; className: string }> =
    {
        pending: {
            label: 'Awaiting approval',
            className: 'bg-gold-light/40 text-gold-dark',
        },
        approved: {
            label: 'Published',
            className: 'bg-green-100 text-green-700',
        },
        rejected: {
            label: 'Not published',
            className: 'bg-cream-deep text-ink/60',
        },
    };

const MAX_LENGTH = 1000;

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

export default function Index({ reviews }: AccountProps) {
    const { auth, flash } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        rating: 0,
        body: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/account/reviews', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    function remove(review: Review) {
        if (!confirm('Delete this review?')) return;
        router.delete(`/account/reviews/${review.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <SiteLayout>
            <Head title="My account — Summit Lodge" />

            <section className="mx-auto max-w-3xl px-6 py-16">
                <p className="eyebrow">My account</p>
                <h1 className="mt-2 font-display text-3xl text-ink">
                    Hello, {auth.user.name.split(' ')[0]}
                </h1>
                <p className="mt-2 text-sm text-ink/60">
                    Stayed with us? Tell other guests what it was like.{' '}
                    <Link href="/profile" className="underline hover:text-ink">
                        Edit your details
                    </Link>
                </p>
                <p>
                    <Link
                        href={route('logout')}
                        method="post"
                        className="underline hover:text-ink"
                    >
                        log out
                    </Link>
                </p>

                {flash?.success && (
                    <div className="mt-6 rounded-xl border border-gold-light bg-gold-light/20 px-4 py-3 text-sm text-gold-dark">
                        {flash.success}
                    </div>
                )}

                <form
                    onSubmit={submit}
                    className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card"
                >
                    <p className="font-display text-lg text-ink">
                        Write a review
                    </p>

                    <div>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                            Your rating
                        </span>
                        <div
                            role="radiogroup"
                            aria-label="Rating"
                            className="flex gap-1 text-2xl"
                        >
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={data.rating === value}
                                    aria-label={`${value} star${value > 1 ? 's' : ''}`}
                                    onClick={() => setData('rating', value)}
                                    className={
                                        value <= data.rating
                                            ? 'text-gold-dark'
                                            : 'text-ink/20 hover:text-gold'
                                    }
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        {errors.rating && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.rating}
                            </p>
                        )}
                    </div>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/60">
                            Your review
                        </span>
                        <textarea
                            rows={5}
                            value={data.body}
                            maxLength={MAX_LENGTH}
                            onChange={(e) => setData('body', e.target.value)}
                            placeholder="What did you enjoy? Anything we could do better?"
                            className="w-full resize-none rounded-lg border-line text-sm focus:border-gold focus:ring-gold"
                        />
                        <span className="mt-1 flex justify-between text-xs text-ink/40">
                            <span className="text-red-600">{errors.body}</span>
                            <span>
                                {data.body.length}/{MAX_LENGTH}
                            </span>
                        </span>
                    </label>

                    <button
                        type="submit"
                        disabled={processing || data.rating === 0}
                        className="btn-primary disabled:opacity-40"
                    >
                        {processing ? 'Sending…' : 'Submit review'}
                    </button>
                    <p className="text-xs text-ink/40">
                        Reviews are read by our team before they appear on the
                        site.
                    </p>
                </form>

                <div className="mt-10">
                    <h2 className="font-display text-xl text-ink">
                        Your reviews
                    </h2>

                    {reviews.length === 0 ? (
                        <p className="mt-3 text-sm text-ink/50">
                            You haven&apos;t written a review yet.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-4">
                            {reviews.map((review) => {
                                const status = STATUS_STYLE[review.status];
                                return (
                                    <li
                                        key={review.id}
                                        className="rounded-2xl border border-line bg-white p-5 shadow-card"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Stars rating={review.rating} />
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                                            >
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="mt-3 whitespace-pre-line text-sm text-ink/80">
                                            {review.body}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-xs text-ink/40">
                                            <span>
                                                {dateFormatter.format(
                                                    new Date(review.created_at),
                                                )}
                                            </span>
                                            <button
                                                onClick={() => remove(review)}
                                                className="text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </section>
        </SiteLayout>
    );
}
