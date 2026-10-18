"use client";

import { useState } from "react";
import { Send } from "./icons";

/** The longest message the API accepts (app/api/contact/route.ts, which also
    wants at least 2 characters of name and 10 of message — mirrored below as
    minLength, so the browser says so before a round trip does). */
const MAX = 4000;

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
    // Read the fields from the form, not only from state: an AI agent filling
    // it through WebMCP sets the values directly, and React never hears of it.
    const form = new FormData(event.currentTarget);
    const field = (key: string, fallback: string) => {
      const value = form.get(key);
      return typeof value === "string" && value.trim() !== "" ? value : fallback;
    };
    const payload = {
      name: field("name", name),
      email: field("email", email),
      message: field("message", message),
      company: field("company", company),
    };
    // An agent-invoked submit (WebMCP) waits for an answer it can read.
    const native = event.nativeEvent as SubmitEvent & {
      agentInvoked?: boolean;
      respondWith?: (result: Promise<string>) => void;
    };
    let answer: (text: string) => void = () => {};
    if (native.agentInvoked && typeof native.respondWith === "function") {
      native.respondWith(new Promise<string>((resolve) => (answer = resolve)));
    }

    if (!payload.name.trim() || !payload.email.trim() || !payload.message.trim()) {
      answer("Not sent: name, email and message are all required.");
      return;
    }
    if (sending) return answer("Not sent: a message is already being sent.");
    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (response.ok && data?.ok) {
        setStatus({ kind: "sent" });
        setName("");
        setEmail("");
        setMessage("");
        answer("Sent. Bakul usually replies within a day or two.");
        return;
      }

      const failure = data?.error ?? "Could not send the message right now.";
      setStatus({ kind: "error", message: failure, fallback: response.status === 503 });
      answer(`Not sent: ${failure} You can email ${to} instead.`);
    } catch {
      setStatus({
        kind: "error",
        message: "Network problem — the message did not send.",
        fallback: true,
      });
      answer(`Not sent: network problem. You can email ${to} instead.`);
    }
  };


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
    <form
      onSubmit={handleSubmit}
      className="mt-6"
      toolname="send_message_to_bakul"
      tooldescription="Send a message to Bakul Ahmed (software engineer and AI researcher) about internships, research or collaboration. Delivered to his inbox by email; he usually replies within a day or two."
    >
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
            minLength={2}
            maxLength={100}
            disabled={sending}
            value={name}
            onChange={(e) => setName(e.target.value)}
            toolparamtitle="Name"
            toolparamdescription="The sender's full name (2-100 characters)."
            className="field"
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
            inputMode="email"
            spellCheck={false}
            maxLength={254}
            disabled={sending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            toolparamtitle="Email"
            toolparamdescription="The sender's email address, where the reply will go."
            className="field"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label htmlFor="message" className="eyebrow block">
            Message
          </label>
          {/* Quiet until it matters: the count warms as the limit nears. */}
          <span
            aria-hidden="true"
            className={`font-mono text-[0.68rem] tabular-nums transition-colors duration-300 ${
              message.length > MAX * 0.9 ? "text-accent" : "text-muted"
            }`}
          >
            {message.length.toLocaleString("en-US")} / {MAX.toLocaleString("en-US")}
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={MAX}
          disabled={sending}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          toolparamtitle="Message"
          toolparamdescription="The message itself, 10-4000 characters."
          className="field"
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
          toolparamtitle="Spam trap"
          toolparamdescription="Spam trap for bots. Always leave this empty, or the message is discarded."
        />
      </div>

      <button
        type="submit"
        disabled={!ready || sending}
        className="btn btn--primary btn-shine mt-5"
      >
        <Send width={16} height={16} />
        {sending ? "Sending…" : "Send message"}
      </button>

      <p aria-live="polite" className="mt-3 text-[0.8rem] leading-relaxed">
        {status.kind === "error" ? (
          <span className="text-danger">
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
