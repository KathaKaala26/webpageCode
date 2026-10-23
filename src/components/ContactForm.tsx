"use client";

import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), page: "contact" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn't send. Please try again.");
        setSending(false);
        return;
      }
      setDone(true);
    } catch {
      setErr("You seem to be offline. Please try again when connected.");
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-2xl text-maroon">Message sent</p>
        <p className="mt-2 text-ink-soft">Thanks — we'll get back to you shortly, usually within a day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label htmlFor="c-name" className="label">Your name</label>
        <input id="c-name" name="name" required autoComplete="name" className="field" />
      </div>
      <div>
        <label htmlFor="c-email" className="label">Email</label>
        <input id="c-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="c-message" className="label">Message</label>
        <textarea
          id="c-message"
          name="message"
          required
          rows={5}
          placeholder="Let us know which artwork you'd like, and we'll follow up to arrange payment and shipping."
          className="field"
        />
      </div>
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {err && <p role="alert" className="text-sm font-semibold text-sindoor">{err}</p>}
      <button type="submit" disabled={sending} className="btn-primary h-12 w-full">
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
