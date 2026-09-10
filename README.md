# Bakul Ahmed — Portfolio

A personal portfolio for **Bakul Ahmed**, Computer Science Engineer & Technology
Builder. Glass panels — a sticky identity rail and a tabbed content panel — float
over a living background that can be re-lit four ways.

Built with Next.js (App Router), TypeScript and Tailwind CSS v4. Every route is
statically prerendered.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
```

## Editing the content

**All copy lives in [`lib/content.ts`](lib/content.ts).** No component needs to be
touched to add a project, a role, a service, a post or a link.

| Export | What it drives |
| --- | --- |
| `site` | Domain, name, title, SEO description |
| `profile` | Name, role chip, avatar, CV path |
| `contactDetails` | Sidebar + contact page detail rows |
| `socials` | Sidebar and contact page social links |
| `nav` | The five tabs |
| `about` / `services` | About page prose and "What I'm Doing" cards |
| `education` / `experience` / `skills` | Resume page |
| `projects` | Portfolio grid (category drives the filter chips) |
| `posts` | Blog page |
| `contact` | Contact page heading |
| `versions` | Links to the Classic and Digital portfolios |

Prose in `about.paragraphs` supports `**bold**` — rendered by
[`components/rich-text.tsx`](components/rich-text.tsx), so no raw HTML lives in the
content file.

Content is taken from `Bakul_Ahmed_CV.pdf` (August 2026) — education, experience,
projects, skills and awards are all real. Two things still need your attention:

1. **`socials` → LinkedIn** is marked `VERIFY`. The CV shows the label "Bakul" but not
   the URL, so it currently guesses `linkedin.com/in/bakulbd`. Correct it if that is
   not your handle.
2. **`posts`** are sample blog articles. Give each a real `href`, or remove `Blog`
   from `nav`.

Optional:

- **`profile.photos`** is empty, so the portrait swiper cycles four generated scenes.
  Drop square images into `public/photos/` and list them there to swipe real
  photographs instead — no code change needed. Photos are cropped `object-[center_35%]`
  (slightly above centre, which suits most portraits); adjust that in
  `components/photo-swiper.tsx` if your framing differs.
- **CV** lives at `public/Bakul_Ahmed_CV.pdf`. Replace the file to update the download.

### Project previews

`public/work/*.svg` are original abstract placeholders on a 16:10 canvas. Replace them
with real screenshots — any 16:10 PNG/JPG/WebP drops straight in and `next/image`
optimises it. If a swapped image still looks stale locally, clear `.next/cache/images`.

> `next.config.ts` sets `dangerouslyAllowSVG` so the placeholder SVGs pass through the
> image optimiser, sandboxed by a strict CSP. Once every preview is a raster image you
> can remove that block.

### Contact form (email)

The form posts to [`app/api/contact/route.ts`](app/api/contact/route.ts), which sends
the message with [Resend](https://resend.com). Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key. A **send-only** key is enough — prefer that. |
| `CONTACT_FROM` | Sender, e.g. `"Portfolio <hello@yourdomain>"` |
| `CONTACT_TO` | Where messages are delivered |
| `NEXT_PUBLIC_SITE_URL` | Public origin — feeds canonical URLs, OG and the sitemap |

`.env.local` is gitignored; `.env.example` is the committed template.

Two things to know about Resend:

- **`onboarding@resend.dev` is a sandbox sender.** Until you verify your own domain in
  Resend, it will generally only deliver to the address that owns the Resend account.
  Verify a domain and set `CONTACT_FROM` to an address on it for real delivery.
- The route answers **503** when the three server variables are missing, and the form
  then offers a `mailto:` link instead — so the form is never a dead end.

The route validates length and email shape, blocks CR/LF in the name and email (mail
header injection), and carries a honeypot field that answers `200` so bots learn
nothing. Rate limiting is a coarse in-memory 5-per-10-minutes per IP: it resets on
redeploy and is per-instance, and it reads `x-forwarded-for`, so a self-hosted deploy
needs a reverse proxy that sets it — otherwise every visitor shares one bucket. Put a
real limiter in front if it ever matters.

## Moods (the background)

The background is **one scene, re-lit four ways**: `dawn`, `day`, `dusk`, `night`.

The four are deliberately **different characters**, not four tints of one:

| | sky | horizon | band | accent | extras |
| --- | --- | --- | --- | --- | --- |
| **dawn** | indigo, L12% | rose 327° | **tight 46%** | violet 255° | thin cool cloud, stars fading |
| **day** | azure, L50% | gold 43° | 90% | gold 48° | white cloud banks |
| **dusk** | violet → maroon | orange 18° | **broad 96%** | orange 27° | warm haze, lit windows, first fireflies |
| **night** | near-black, L3% | deep blue | 70% | cyan 188° | fireflies, full stars, clear sky |

Dawn and dusk are opposites on purpose — cool and crisp with a thin rose band against
warm and hazy with a broad orange one. A test asserts their accents and horizons stay
far apart in hue, and that dusk's band is much wider.

**Every mood is dark.** The hour is expressed in the sky, never in the surfaces, so
text, panels, borders and contrast are identical in all four and nothing flips
mid-transition. This follows how daylight actually reads: the sky hue barely moves
(it stays blue from dawn to night); what changes is **how light it is** and **how much
warmth collects at the horizon**.

| Attribute | Controls |
| --- | --- |
| `data-mood` on `<html>` | The scene — sky, clouds, sun/moon, horizon glow, window lights, stars, accent pair, shadow tint |
| `data-theme` on `<html>` | The surfaces. One value today (`dark`); kept as its own axis so a light mood could be added without re-plumbing. |

- **Default** comes from the visitor's local clock (`lib/mood.ts`), then their choice
  is remembered.
- **Scene layers** (`components/scene.tsx`): sky gradient → sun/moon → horizon glow →
  two drifting cloud banks → two skyline ridges → lit windows → grain. All CSS/SVG
  masks, no image payload, parallaxed on scroll.
- **Fireflies at night.** A second particle system on the *same* canvas as the stars,
  so the page still runs one `requestAnimationFrame`. They wander by nudging their
  heading rather than their position, so paths curve like an insect's, and each blinks
  on its own phase. Full at night, a third at dusk, none by day.
- **Warmth lives at the horizon**, not the sky: a peach glow at dawn, amber at dusk,
  deep blue at night. Each mood also sets `--shadow-tint`, so panels cast a warm
  shadow at dusk and a cold one at night.
- **Nightfall is staged, not simultaneous.** The sky turns first, the horizon follows,
  the city windows come on once it is dark enough to notice, and the stars arrive last
  — the order it happens outside, and the reason it reads as dusk falling rather than a
  palette swap:

  | Layer | Duration | Delay |
  | --- | --- | --- |
  | Sky | 3000ms | — |
  | Sun / moon (position, size, colour) | 3200ms | — |
  | Horizon glow (colour and band size) | 2600ms | 200ms |
  | Clouds | 2800ms | 300ms |
  | City windows | 1800ms | 1000ms |
  | Stars | 2800ms | 1300ms |
  | Fireflies | 2400ms | 1600ms |

  > Every mood token is registered with **`@property`**. This is load-bearing: an
  > unregistered custom property is a `<custom-ident>` and does **not** interpolate, so
  > a `transition` on it is silently inert and the sky snaps. A test asserts the sky is
  > mid-way between two moods 600ms in, and that lights and stars are still off then.

- **Colour grades rather than cuts** — only paint properties transition, so a mood
  change can never move layout (asserted by a test).
- Add or retune a mood in `moods` in `lib/content.ts` plus its `[data-mood="…"]` block
  in `app/globals.css`. Each mood also carries the hero line shown while it's active.

## Performance

The scene is elaborate but must not cost frames. Two findings from profiling, both
counter-intuitive enough to be worth writing down:

- **A `mix-blend-mode` layer above the clouds cost 25 FPS.** The blend forces
  everything beneath it to re-composite every frame. Grain now sits directly over the
  sky — which is the only layer that bands — and the cost disappears.
- **`filter: blur()` on full-viewport cloud layers cost 19 FPS**, because a filtered
  layer that size re-rasterises constantly. Soft edges now come from the gradient
  falloff, with `will-change: transform` so the drift is composited.
- **Rotating a conic-gradient ring is paint-driven, not composited.** Four always-on
  panel rings cost 9 FPS for motion nobody looks at, so panels hold a still gradient
  edge and only the card under the pointer animates.

Measured after: **61 fps idle** on desktop, 4×-throttled desktop and 6×-throttled
mobile; FCP ~270ms; CLS 0.000. `verify3` asserts a floor of 50 fps and CLS under 0.1
on both desktop and mobile so this cannot regress quietly.

## Legibility gate

Text sits on translucent glass over a moving background, which is exactly how designs
like this quietly go unreadable. `npm run contrast` composites every panel and tile
over the extremes of its own mood — sky top, sky bottom and the horizon glow — and
fails if any text pair drops below WCAG AA:

```bash
npm run contrast   # 104 checks across 4 moods
npm run verify     # contrast gate + production build
```

`--panel-a` / `--tile-a` in `app/globals.css` are the legibility floor, and a theme may
raise its own (white glass over a bright sky needs more than dark glass: light runs
0.90 / 0.88, dark 0.86 / 0.74). Lower them for more glass and the gate will tell you
when text stops passing.

## Motion

Every animation is built from scratch — no animation library ships to the browser.

| Piece | What it does |
| --- | --- |
| `components/photo-swiper.tsx` | The portrait: photographs cross-fade on their own, and the only chrome is a hairline rail whose active segment fills as that photo's turn elapses — no arrows, dots or counter. Segments are still buttons (24px targets), swipe works on touch, arrow keys work, and auto-advance pauses on hover, focus, drag and tab-hide. Uses `profile.photos` when set, otherwise four generated SVG scenes. |
| `components/panel-nav.tsx` | Docked into the content panel's top-right corner (a bottom bar on mobile); the gradient underline is measured from live geometry so it survives font and zoom changes. |
| `components/mood-switch.tsx` | The four-way light switch, with a sliding pill. |
| `.shine` (globals.css) | Gradient ring masked to the border box, sweeping via an `@property` conic angle. Always-on for panels, hover-revealed for cards. |
| `.btn-shine` (globals.css) | A light sweep that crosses primary buttons on hover and focus. |
| `components/card.tsx` | The panel surface every inner-page section sits on, carrying the shine ring, spotlight and reveal in one place. |
| `components/role-rotator.tsx` | Types, holds and erases each role. Screen readers get the full list once rather than a character stream. |
| `components/constellation.tsx` | Sparse particle field on a canvas, density scaled to viewport area, paused while the tab is hidden. |
| `components/counter.tsx` | Counts each statistic up the first time it scrolls into view. |
| `components/spotlight.tsx` | One delegated pointer listener writes `--mx/--my` onto the hovered card, so cards stay server-rendered. |
| `components/route-transition.tsx` | Re-keys on navigation so panel content settles in on each tab change. One animation on the wrapper only — staggering the first child made it fade twice. |
| `components/panel-nav.tsx` (hover) | The underline follows the pointer to preview where you are about to go, then settles back on the current page. |
| `.sent` (globals.css) | After a message sends, the tick draws itself inside an expanding ring and the copy rises in behind it. |
| `components/mood-provider.tsx` | Owns the mood, persists it, and wraps light↔dark flips in a View Transition. |
| `[data-reveal]` | Fade-up on scroll, driven by a single `IntersectionObserver` that is **re-armed on every route change** — a client navigation replaces the DOM, and unobserved nodes stay hidden by CSS (a test guards this). |

Under `prefers-reduced-motion: reduce` the constellation is not rendered at all, the
portrait holds one static frame, the caret disappears, counters show their final value
immediately, and route transitions are off.

## Design system

Tokens sit at the top of [`app/globals.css`](app/globals.css): a dark surface palette
with a cyan/indigo accent pair, defined once for dark and once for light. Change
`--accent` and `--accent-2` to re-brand the whole site.

- **Type** — Geist Sans for text, Geist Mono for numerals.
- **Surfaces** — two classes do the work: `.panel` (glass: the rail and the content
  panel) and `.tile` (everything nested inside them).
- **Motion** — fade-up reveals on scroll, image scale on card hover, nav underline
  transitions. All collapse under `prefers-reduced-motion: reduce`, and every page is
  fully readable with JavaScript disabled.

## Other versions

`versions` in `lib/content.ts` links the two sibling portfolios, shown on the home page
and in the footer:

- **Classic** — [me.bakul.tech](https://me.bakul.tech), text-forward and pared back.
- **Digital** — [bakul.app](https://bakul.app), the 3D "machine room" take.

Because both of those domains are already in use, **this site needs its own domain**.
`site.url` is currently `https://bakul.tech` and is marked `VERIFY` — set it before
deploying, since canonical URLs, Open Graph and the sitemap all derive from it.

## SEO

- Per-route `title`, `description` and canonical URL.
- A generated Open Graph image per route (`/opengraph-image`, `/resume/opengraph-image`,
  …) from one shared template in [`lib/og.tsx`](lib/og.tsx).
- Four JSON-LD nodes: `Person` (real contact details, `alumniOf`, `memberOf`,
  `knowsAbout`, `award`), `WebSite`, `ProfilePage` and `BreadcrumbList`.
- `sitemap.xml` and `robots.txt` driven by `NEXT_PUBLIC_SITE_URL`. Sitemap URLs match
  the canonical tags **exactly** — including the bare origin for the home route, with
  no trailing slash (a test asserts this).
- A web app manifest, an SVG favicon and a generated 180px `apple-icon`.

## Accessibility

- One `h1` per route, no skipped heading levels, no duplicate element ids.
- Skip link, visible focus rings, labelled form fields, named buttons.
- The dock moves to the bottom of the viewport on small screens and shrinks its
  padding at 320px so five items and the theme switch still fit.
- Interactive targets are at least 24px tall; the carousel is operable by keyboard.
- All text meets WCAG AA contrast in both themes.

## Responsive

Layout is audited by script across 13 widths (320 → 2560) on every route, checking for
horizontal scroll, elements escaping the viewport, and short touch targets. The content
measure is 1200px, widening to 1340px above 1536px so large displays get more content
rather than more gutter.

## Production

- **Security headers** ([`next.config.ts`](next.config.ts)): CSP, `nosniff`,
  `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS, and
  `X-Powered-By` removed. `/api/*` is `no-store`.
  > The CSP allows inline **scripts** on purpose: the mood script runs before first
  > paint so the page never flashes the wrong sky, and a nonce would need middleware,
  > which would make every route dynamic and lose static prerendering. Everything else
  > is locked to `'self'` — no third-party origins, no framing, no plugins, forms post
  > only here.
  >
  > `'unsafe-eval'` and the HMR websocket are added **in development only** — React's
  > dev build uses `eval()` for debugging. Neither is ever sent in production. Note
  > that `next.config.ts` changes need a dev-server restart.
- **Branded `404`** ([`app/not-found.tsx`](app/not-found.tsx), `noindex`) and a route
  **error boundary** ([`app/error.tsx`](app/error.tsx)) that depends on no providers.
- **Images**: AVIF/WebP, with device and image sizes trimmed to the widths the portrait
  and project frames actually request.
- Every route is statically prerendered except `/api/contact`.

## Structural audit

The codebase is checked by script rather than by eye, since a design that changed this
often accumulates quiet debt. What the sweep covers, and what it caught:

| Check | Found |
| --- | --- |
| CSS classes defined but never used in markup | 4 rules left by a deleted component |
| Duplicate property declarations in one rule | `display` twice in `.swiper__seg` |
| CSS variables referenced but never defined | none (inline-set ones carry fallbacks) |
| `getComputedStyle` inside a rAF loop | forced a style recalc every frame |
| Effects re-registering listeners on every render | resize listener churned on each nav hover |
| Incomplete ARIA patterns | `role="tab"` without a tabpanel to own |
| Raw `<img>` bypassing `next/image` | one, on the featured project |
| Duplicate element ids, dangling `aria-*`, nested interactives, console errors | none across all five routes |

## Checks

```bash
npm run contrast   # 104 WCAG AA checks across 4 moods
npm run verify     # contrast gate + production build
```

Beyond that, the work in this repo was verified by script against a running build:
behaviour and accessibility on all five routes, the contact API's validation, honeypot,
rate limiting and secret containment, security headers, canonical/sitemap agreement,
JSON-LD shape, reveal visibility after client-side navigation, and a responsive sweep
across 13 widths.

## Deploying

Deploys to Vercel (or any Node host) with no build configuration. Before the first
deploy:

1. Set the four environment variables from `.env.example` in your host's dashboard —
   `NEXT_PUBLIC_SITE_URL` must be the real origin, since canonical URLs, Open Graph and
   the sitemap all derive from it.
2. Verify a sending domain in Resend and point `CONTACT_FROM` at it, or contact mail
   will only reach the Resend account owner.
3. Add your CV at `public/Bakul_Ahmed_CV.pdf` (already present) and photos in
   `public/photos/`.

The in-memory rate limiter reads `x-forwarded-for`. Vercel sets it; a self-hosted
deploy needs a reverse proxy that does too, or every visitor shares one bucket.
