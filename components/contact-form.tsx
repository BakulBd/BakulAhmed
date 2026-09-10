"use client";

import { useState } from "react";
import { Send } from "./icons";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string; fallback: boolean };

/**
 * Posts to /api/contact, which sends the mail server-side through Resend.
 *
 * If the server reports that email is not configured (503), the form offers a
 * mailto link instead of failing — the visitor can always reach him.
 */
export default function ContactForm({ to }: { to: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const ready = name.trim() !== "" && email.trim() !== "" && message.trim() !== "";
  const sending = status.kind === "sending";

  const mailto = () => {
    const subject = encodeURIComponent(`Portfolio enquiry from ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()}\n${email.trim()}`);
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ready || sending) return;
    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, company }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (response.ok && data?.ok) {
        setStatus({ kind: "sent" });
        setName("");
        setEmail("");
        setMessage("");
        return;
      }

      setStatus({
        kind: "error",
        message: data?.error ?? "Could not send the message right now.",
        fallback: response.status === 503,
      });
    } catch {
      setStatus({
        kind: "error",
        message: "Network problem — the message did not send.",
        fallback: true,
      });
    }
  };

  const field =
    "w-full rounded-xl border border-line bg-panel-soft px-4 py-3 text-[0.9rem] text-fg placeholder:text-muted transition-colors duration-300 focus:border-accent focus:outline-none disabled:opacity-60";

  if (status.kind === "sent") {
    return (
      <div className="sent tile shine shine--panel mt-6 flex flex-col items-center gap-3 p-8 text-center" role="status">
        <span className="sent__mark" aria-hidden="true">
          <svg viewBox="0 0 52 52" width="52" height="52" fill="none">
            <circle cx="26" cy="26" r="23" stroke="currentColor" strokeWidth="2.5" />
            <path
              d="m15.5 26.5 7 7 14-14"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="sent__line text-[1.15rem] font-semibold text-fg" style={{ "--d": "420ms" } as React.CSSProperties}>
          Message sent.
        </p>
        <p
          className="sent__line max-w-sm text-[0.9rem] leading-relaxed text-muted"
          style={{ "--d": "520ms" } as React.CSSProperties}
        >
          Thanks for getting in touch — I&apos;ll reply to the address you gave.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="sent__line mt-1 inline-flex min-h-[2rem] items-center text-[0.85rem] text-accent transition-opacity duration-300 hover:opacity-75"
          style={{ "--d": "620ms" } as React.CSSProperties}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="eyebrow mb-2 block">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={100}
            disabled={sending}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="eyebrow mb-2 block">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            disabled={sending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="eyebrow mb-2 block">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          disabled={sending}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${field} resize-y`}
          placeholder="What would you like to build?"
        />
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={!ready || sending}
        className="btn-shine mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[0.9rem] font-semibold text-accent-contrast transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send width={16} height={16} />
        {sending ? "Sending…" : "Send message"}
      </button>

      <p aria-live="polite" className="mt-3 text-[0.8rem] leading-relaxed">
        {status.kind === "error" ? (
          <span className="text-accent">
            {status.message}
            {status.fallback && (
              <>
                {" "}
                <a href={mailto()} className="underline">
                  Send it by email instead
                </a>
                .
              </>
            )}
          </span>
        ) : (
          <span className="text-muted">
            Goes straight to my inbox. I usually reply within a day or two.
          </span>
        )}
      </p>
    </form>
  );
}
