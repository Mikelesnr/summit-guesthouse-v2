import { FormEvent, useRef, useState } from 'react';
import { ChatMessage } from '@/types';

const GREETING = "Hi, I'm the Summit Lodge assistant. Ask me about room prices, availability for your dates, or how booking works — or tap the WhatsApp button if you'd rather chat with our team directly.";

export default function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: GREETING }]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    async function send(e: FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || sending) return;

        const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
        setMessages(next);
        setInput('');
        setSending(true);

        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: next }),
            });
            const data: { reply?: string } = await res.json();
            setMessages([...next, { role: 'assistant', content: data.reply ?? "Sorry, I couldn't reach the assistant just now — try WhatsApp instead." }]);
        } catch {
            setMessages([...next, { role: 'assistant', content: 'Sorry, something went wrong. Try WhatsApp instead.' }]);
        } finally {
            setSending(false);
            queueMicrotask(() => listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: 'smooth' }));
        }
    }

    return (
        <div className="fixed bottom-6 left-6 z-40">
            {open && (
                <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-line bg-cream shadow-lift">
                    <div className="flex items-center justify-between bg-ink px-4 py-3">
                        <p className="font-display text-sm text-cream">Summit Lodge Assistant</p>
                        <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-cream/70 hover:text-cream">
                            &times;
                        </button>
                    </div>

                    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                    m.role === 'user' ? 'ml-auto bg-gold text-ink' : 'bg-cream-deep text-ink'
                                }`}
                            >
                                {m.content}
                            </div>
                        ))}
                        {sending && (
                            <div className="max-w-[85%] rounded-2xl bg-cream-deep px-3 py-2 text-sm text-ink/50">
                                Typing&hellip;
                            </div>
                        )}
                    </div>

                    <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about rooms, prices…"
                            className="flex-1 rounded-full border-line bg-white text-sm focus:border-gold focus:ring-gold"
                        />
                        <button type="submit" className="btn-primary px-4 py-2 text-xs" disabled={sending}>
                            Send
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream shadow-lift
                           transition hover:bg-gold-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
                {open ? (
                    <span className="text-2xl leading-none">&times;</span>
                ) : (
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                        <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4.6 3.45A.5.5 0 0 1 2.6 20V6a2 2 0 0 1 1.4-1.9V4Zm0 2v11.2L7.1 15H19V6H4Z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
