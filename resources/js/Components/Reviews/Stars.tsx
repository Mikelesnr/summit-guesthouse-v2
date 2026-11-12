interface StarsProps {
    rating: number;
    className?: string;
}

/** Read-only star rating, e.g. 4 of 5. */
export default function Stars({ rating, className = '' }: StarsProps) {
    return (
        <span
            className={`text-gold-dark ${className}`}
            role="img"
            aria-label={`${rating} out of 5 stars`}
        >
            {'★'.repeat(rating)}
            <span className="text-ink/20">{'★'.repeat(5 - rating)}</span>
        </span>
    );
}
