import { Resend } from "resend";

/** Server-only: the API key must never reach the client bundle. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITS = { name: [2, 100], message: [10, 4000] } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * A coarse per-IP limiter. In-memory on purpose: it resets on redeploy and is
 * per-instance, so it deters casual abuse rather than a determined flood. Put
 * a real limiter in front if this ever matters.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

const bad = (error: string, status = 400) =>
  Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  const { RESEND_API_KEY, CONTACT_FROM, CONTACT_TO } = process.env;
  if (!RESEND_API_KEY || !CONTACT_FROM || !CONTACT_TO) {
    // 503 tells the client to offer its mailto fallback rather than retry.
    return bad("Email is not configured on the server.", 503);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return bad("Too many messages from this address. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Malformed request.");
  }

  const { name, email, message, company } = (body ?? {}) as Record<string, unknown>;

  // Honeypot: a real person never sees this field, so anything in it is a bot.
  // Answer 200 so the bot cannot tell it was rejected.
  if (typeof company === "string" && company.trim() !== "") {
    return Response.json({ ok: true });
  }

  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
    return bad("Missing fields.");
  }

  const clean = { name: name.trim(), email: email.trim(), message: message.trim() };

  if (clean.name.length < LIMITS.name[0] || clean.name.length > LIMITS.name[1]) {
    return bad("Please enter your name.");
  }
  if (!EMAIL_RE.test(clean.email) || clean.email.length > 254) {
    return bad("Please enter a valid email address.");
  }
  if (clean.message.length < LIMITS.message[0] || clean.message.length > LIMITS.message[1]) {
    return bad("Please write a slightly longer message.");
  }
  // Header injection guard: newlines in a name would split mail headers.
  if (/[\r\n]/.test(clean.name) || /[\r\n]/.test(clean.email)) {
    return bad("Invalid characters in name or email.");
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      replyTo: clean.email,
      subject: `Portfolio enquiry from ${clean.name}`,
      text: `${clean.message}\n\n—\n${clean.name}\n${clean.email}`,
    });

    if (error) {
      // Log server-side; never hand provider internals to the client.
      console.error("[contact] resend error:", error);
      return bad("Could not send the message right now.", 502);
    }

    return Response.json({ ok: true });
  } catch (cause) {
    console.error("[contact] unexpected error:", cause);
    return bad("Could not send the message right now.", 502);
  }
}
