interface ContourLinesProps {
    className?: string;
    opacity?: number;
}

/**
 * Nested, irregular contour rings like a topographic map. Used once per
 * page as a background texture (hero, section dividers), never as a
 * repeated pattern-fill, so it reads as a mark rather than wallpaper.
 */
export default function ContourLines({ className = '', opacity = 0.16 }: ContourLinesProps) {
    return (
        <svg
            viewBox="0 0 600 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <g stroke="currentColor" strokeWidth="1" opacity={opacity}>
                <path d="M40 340 C 120 300, 160 260, 150 210 C 142 168, 200 150, 260 165 C 330 182, 360 140, 340 90 C 325 52, 370 20, 430 30" />
                <path d="M10 300 C 90 268, 130 236, 122 196 C 116 160, 172 142, 232 158 C 300 176, 336 138, 320 92 C 308 58, 350 26, 405 38" />
                <path d="M-10 260 C 60 236, 100 210, 96 178 C 92 148, 144 132, 202 148 C 268 168, 306 134, 292 92 C 282 62, 320 34, 372 46" />
                <path d="M-20 220 C 32 202, 66 184, 66 158 C 66 132, 116 120, 168 136 C 230 154, 268 124, 258 88 C 250 62, 284 38, 332 50" />
            </g>
        </svg>
    );
}
