"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getProduct } from "@/lib/products";
import { QUICK_START, reply, type BotAction } from "@/lib/chatbot";
import { formatMoney } from "@/lib/format";
import { site } from "@/lib/site";
import { useCart } from "@/context/CartContext";
import { usePriceOverrides } from "@/lib/usePriceOverrides";
import { ChatIcon, CloseIcon, KKMark, SendIcon } from "./Icons";

type Msg = {
  id: number;
  from: "bot" | "user";
  text: string;
  productSlugs?: string[];
  actions?: BotAction[];
  quick?: string[];
};

const KEY = "kk_chat_v1";
const WELCOME: Msg = {
  id: 0,
  from: "bot",
  text: "Namaste! 🙏 Welcome to Katha & Kaala. How can we help you today?",
  quick: QUICK_START,
};

export default function ChatWidget() {
  const pathname = usePathname();
  const { add } = useCart();
  const priceOverrides = usePriceOverrides();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [unread, setUnread] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore conversation for this browser tab
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setMsgs(JSON.parse(saved));
      else {
        const t = setTimeout(() => setUnread(true), 6000);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* ignore */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, showForm]);

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Don't cover the checkout / admin pages' buttons on small screens
  const hidden = pathname.startsWith("/admin");

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const id = Date.now();
    setMsgs((m) => [...m.map((x) => ({ ...x, quick: undefined })), { id, from: "user", text: clean }]);
    setInput("");
    setTyping(true);
    const r = reply(clean);
    const wantsForm = r.actions?.some((a) => a.type === "contact");
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [
        ...m,
        { id: id + 1, from: "bot", text: r.text, productSlugs: r.products?.map((p) => p.slug), actions: r.actions, quick: r.quick },
      ]);
      if (wantsForm && /human|person|talk|contact|speak/i.test(clean)) setShowForm(true);
    }, 450 + Math.min(900, r.text.length * 6));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  if (hidden) return null;

  const waHref = site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hi Katha & Kaala, I have a question about ")}`
    : null;

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        aria-expanded={open}
        className={`fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-sindoor text-shankh shadow-xl ring-4 ring-shankh transition hover:bg-sindoor-dark sm:right-6 ${
          open ? "max-sm:hidden" : ""
        }`}
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {open ? <CloseIcon /> : <ChatIcon className="h-7 w-7" />}
        {unread && !open && <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-shankh bg-haldi" aria-hidden />}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat with Katha & Kaala"
          className="fixed inset-0 z-50 flex animate-slide-up flex-col bg-shankh sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:shadow-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center gap-3 bg-maroon px-4 py-3 text-shankh" style={{ paddingTop: "max(.75rem, env(safe-area-inset-top))" }}>
            <KKMark className="h-10 w-10" />
            <div className="flex-1">
              <p className="font-display text-lg font-semibold leading-tight">Katha &amp; Kaala</p>
              <p className="text-xs text-shankh/70">Typically replies within a day</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close chat">
              <CloseIcon />
            </button>
          </div>
          <div className="patta-band-thin" />

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[88%] space-y-2 ${m.from === "user" ? "items-end" : ""}`}>
                  <p className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.from === "user" ? "rounded-br-sm bg-maroon text-shankh" : "rounded-bl-sm bg-white text-ink shadow-sm"}`}>{m.text}</p>

                  {m.productSlugs?.map((slug) => {
                    const p = getProduct(slug);
                    if (!p) return null;
                    return (
                      <div key={slug} className="flex gap-3 rounded-xl bg-white p-2 shadow-sm">
                        <Link href={`/shop/${p.slug}`} onClick={() => window.innerWidth < 640 && setOpen(false)} className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg">
                          <Image src={p.image} alt={p.title} fill sizes="56px" className="object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{p.title}</p>
                          <p className="text-xs text-ink-soft">{p.purchaseCode} · {formatMoney(priceOverrides[p.slug] ?? p.priceCents)}</p>
                          {p.available ? (
                            <button type="button" onClick={() => add(p.slug)} className="mt-1 text-xs font-extrabold text-sindoor hover:underline">
                              + Add to cart
                            </button>
                          ) : (
                            <span className="mt-1 text-xs font-bold text-ink/50">Sold</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {!!m.actions?.length && (
                    <div className="flex flex-wrap gap-2">
                      {m.actions.map((a, i) =>
                        a.type === "link" ? (
                          <Link key={i} href={a.href} onClick={() => window.innerWidth < 640 && setOpen(false)} className="rounded-full border border-maroon/30 bg-white px-3 py-1.5 text-xs font-bold text-maroon hover:bg-maroon hover:text-shankh">
                            {a.label} →
                          </Link>
                        ) : a.type === "contact" ? (
                          <button key={i} type="button" onClick={() => setShowForm(true)} className="rounded-full bg-sindoor px-3 py-1.5 text-xs font-bold text-white hover:bg-sindoor-dark">
                            Leave a message
                          </button>
                        ) : waHref ? (
                          <a key={i} href={waHref} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white">
                            WhatsApp us
                          </a>
                        ) : null,
                      )}
                    </div>
                  )}

                  {!!m.quick?.length && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.quick.map((q) => (
                        <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-sindoor/40 bg-white px-3 py-1.5 text-xs font-semibold text-sindoor hover:bg-sindoor hover:text-white">
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex">
                <span className="flex gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm" aria-label="Typing">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
              </div>
            )}

            {showForm && <ContactForm page={pathname} onDone={(ok) => {
              setShowForm(false);
              setMsgs((m) => [...m, { id: Date.now(), from: "bot", text: ok ? "Thank you! Your message has reached our team — we'll reply by email soon. 🙏" : "Sorry, that didn't send. Please try again in a moment." }]);
            }} onCancel={() => setShowForm(false)} />}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-ink/10 bg-white p-3">
            <label htmlFor="chat-input" className="sr-only">Type your message</label>
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about an artwork or code…"
              autoComplete="off"
              className="h-11 flex-1 rounded-full border border-ink/15 bg-shankh px-4 text-base focus:border-haldi focus:outline-none sm:text-sm"
            />
            <button type="submit" disabled={!input.trim()} className="grid h-11 w-11 place-items-center rounded-full bg-sindoor text-white disabled:opacity-40" aria-label="Send">
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function ContactForm({ page, onDone, onCancel }: { page: string; onDone: (ok: boolean) => void; onCancel: () => void }) {
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), page }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn't send.");
        setSending(false);
        return;
      }
      onDone(true);
    } catch {
      setErr("You seem to be offline. Please try again when connected.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
      <p className="text-sm font-bold text-maroon">Leave us a message</p>
      <input name="name" required placeholder="Your name" autoComplete="name" className="field py-2 text-sm" />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className="field py-2 text-sm" />
      <textarea name="message" required rows={3} placeholder="How can we help? (include an order number if you have one)" className="field py-2 text-sm" />
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {err && <p className="text-xs font-semibold text-sindoor">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={sending} className="btn-primary h-10 flex-1 px-4 text-xs">
          {sending ? "Sending…" : "Send message"}
        </button>
        <button type="button" onClick={onCancel} className="h-10 px-3 text-xs font-bold text-ink-soft">
          Cancel
        </button>
      </div>
    </form>
  );
}
