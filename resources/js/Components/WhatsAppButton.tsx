const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '263780652983';

interface WhatsAppButtonProps {
    message?: string;
}

export default function WhatsAppButton({
    message = "Hi! I'd like to ask about a booking at Summit Lodge.",
}: WhatsAppButtonProps) {
    const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center
                       rounded-full bg-[#25D366] shadow-lift transition hover:scale-105
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
            <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" aria-hidden="true">
                <path d="M16.02 3C9.4 3 4 8.36 4 14.96c0 2.36.68 4.55 1.86 6.42L4 29l7.86-1.82a12.9 12.9 0 0 0 4.16.7c6.62 0 12.02-5.36 12.02-11.96C28.04 8.36 22.64 3 16.02 3Zm0 21.7c-1.4 0-2.76-.34-3.96-1l-.28-.16-4.66 1.08 1.1-4.5-.18-.3a9.6 9.6 0 0 1-1.5-5.16c0-5.32 4.36-9.66 9.7-9.66 2.6 0 5.02 1 6.86 2.84a9.55 9.55 0 0 1 2.84 6.82c0 5.32-4.36 9.64-9.92 9.64Zm5.32-7.24c-.3-.14-1.72-.84-1.98-.94-.26-.1-.46-.14-.66.14-.2.3-.76.94-.94 1.12-.16.2-.34.22-.64.08-.3-.14-1.26-.46-2.4-1.46a9 9 0 0 1-1.66-2.04c-.18-.3 0-.46.14-.6.14-.14.3-.34.44-.52.14-.16.2-.3.3-.5.1-.2.04-.38-.02-.52-.08-.14-.66-1.58-.9-2.16-.24-.56-.48-.48-.66-.5h-.56c-.2 0-.52.08-.78.38-.28.3-1.02 1-1.02 2.42s1.04 2.8 1.18 3c.14.2 2.06 3.14 5 4.4.7.3 1.24.48 1.66.62.7.22 1.34.19 1.84.11.56-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.16-1.38-.06-.12-.24-.2-.54-.34Z" />
            </svg>
        </a>
    );
}
