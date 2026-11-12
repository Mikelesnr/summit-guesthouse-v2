import Stars from '@/Components/Reviews/Stars';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Paginated, PaginationLink, Review, ReviewStatus } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface ReviewsIndexProps {
    reviews: Paginated<Review>;
    status: ReviewStatus;
    counts: Record<ReviewStatus, number>;
}

const TABS: { status: ReviewStatus; label: string }[] = [
    { status: 'pending', label: 'To review' },
    { status: 'approved', label: 'Published' },
    { status: 'rejected', label: 'Rejected' },
];

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

export default function Index({ reviews, status, counts }: ReviewsIndexProps) {
    function setStatus(review: Review, next: ReviewStatus) {
        router.put(
            `/dashboard/reviews/${review.id}`,
            { status: next },
            { preserveScroll: true },
        );
    }

    return (
        <DashboardLayout>
            <Head title="Reviews" />
            <h1 className="font-display text-2xl text-ink">Guest reviews</h1>
            <p className="mt-1 text-sm text-ink/60">
                Nothing a guest writes goes on the website until you approve it.
                Reject anything with offensive language or that isn&apos;t a
                real review.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
                {TABS.map((tab) => (
                    <Link
                        key={tab.status}
                        href={`/dashboard/reviews?status=${tab.status}`}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                            status === tab.status
                                ? 'bg-ink text-cream'
                                : 'border border-line text-ink/70 hover:bg-cream-deep'
                        }`}
                    >
                        {tab.label} ({counts[tab.status] ?? 0})
                    </Link>
                ))}
            </div>

            <ul className="mt-6 space-y-4">
                {reviews.data.map((review) => (
                    <li
                        key={review.id}
                        className="rounded-2xl border border-line bg-white p-5 shadow-card"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-ink">
                                    {review.author_name}
                                </span>
                                <Stars rating={review.rating} />
                            </div>
                            <span className="text-xs text-ink/40">
                                {dateFormatter.format(
                                    new Date(review.created_at),
                                )}
                            </span>
                        </div>

                        <p className="mt-3 whitespace-pre-line text-sm text-ink/80">
                            {review.body}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                            {review.status !== 'approved' && (
                                <button
                                    onClick={() =>
                                        setStatus(review, 'approved')
                                    }
                                    className="btn-primary px-4 py-2 text-xs"
                                >
                                    Approve
                                </button>
                            )}
                            {review.status !== 'rejected' && (
                                <button
                                    onClick={() =>
                                        setStatus(review, 'rejected')
                                    }
                                    className="btn-secondary px-4 py-2 text-xs"
                                >
                                    Reject
                                </button>
                            )}
                            {review.status !== 'pending' && (
                                <button
                                    onClick={() => setStatus(review, 'pending')}
                                    className="text-xs text-ink/50 hover:text-ink"
                                >
                                    Move back to review
                                </button>
                            )}
                        </div>
                    </li>
                ))}

                {reviews.data.length === 0 && (
                    <li className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink/50">
                        {status === 'pending'
                            ? 'Nothing waiting for review.'
                            : 'No reviews here.'}
                    </li>
                )}
            </ul>

            <Pagination links={reviews.links} />
        </DashboardLayout>
    );
}

function Pagination({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) return null;

    return (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-1">
            {links.map((link, i) => {
                const base =
                    'flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition';

                return link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={`${base} ${link.active ? 'bg-ink text-cream' : 'border border-line text-ink/70 hover:bg-cream-deep'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className={`${base} text-ink/30`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}
