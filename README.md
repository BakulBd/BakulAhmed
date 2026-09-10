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

## Checks

- `npm run contrast` — no browser needed. Palette discipline, 408 contrast
  checks over 4 moods x 4 seasons, particle visibility, and 224 sky-geometry
  checks that keep the sun and moon inside the one strip of sky they own.
- `npm run visual` — needs a dev server. Real layout and real pixels: the
  celestial body across 9 viewports x 4 moods, 13 widths x 5 routes for
  overflow and touch targets, image loading, and idle frame rate on a desktop
  and a 6x-throttled phone. The two agree independently — both put the tightest
  celestial clearance at dusk, 768px, 4px.

## Moods (the background)

The background is **one scene, re-lit four ways**: `dawn`, `day`, `dusk`, `night`.

### The palette is bespoke, not borrowed

Accents are built in **oklch** at a shared lightness/chroma band, varying only hue, so
the four moods read as one family. Hues are chosen *away* from the clusters every CSS
framework ships — sky-blue 190–210, indigo 235–250, orange 25–35 — because an earlier
version of this palette was, measurably, 13 of 24 stock Tailwind values, including
`cyan-400 → indigo-400`, the most-used gradient on the web.

| mood | accent | accent-2 | hue arc |
| --- | --- | --- | --- |
| dawn | lilac 294° | celadon 172° | 122° |
| day | citron 105° | apricot 42° | 63° |
| dusk | terracotta 46° | plum 340° | 66° |
| night | glacier mint 180° | periwinkle 291° | 111° |

The family is held to measured tolerances, not taste: **lightness spread 0.10**,
**chroma spread 0.032**, every pair separated by **45–130°**, and every accent carrying
**7–9× the chroma of body text** — which is what makes an accent read as emphasis
rather than as differently-coloured text.

Accent gradients interpolate **`in oklch`**. In sRGB they route through a desaturated
midpoint: dawn's rule measured a **46% chroma loss** halfway across. Sampled from
rendered pixels afterwards, the loss is **−5% to +3%** — none.

`npm run contrast` enforces all of it, including a check that no colour is a stock
framework value. That check caught two survivors (cyan-400 and indigo-400) hiding in
`@property` fallbacks after the palette was replaced.

Skies are generated in the same way and sit on each mood's own hue family, so the
background and the accents are one system rather than accents bolted onto a backdrop.
Every accent clears **AAA** on the panel surface, and tests assert the four accent hues
stay at least 15° apart — and that dawn's horizon (rose, 332°) never drifts back
towards dusk's (orange, 18°), which is how the two collapsed into each other once.

The four are deliberately **different characters**, not four tints of one:

| | sky | horizon | band | accent | extras |
| --- | --- | --- | --- | --- | --- |
| **dawn** | violet 250°, L13% | rose 332° | **tight 46%** | lilac 295° | thin cool cloud, stars fading |
| **day** | azure 201°, L50% | gold 48° | 90% | citron 110° | white cloud banks |
| **dusk** | plum → maroon 302→359° | orange 18° | **broad 96%** | terracotta 48° | warm haze, lit windows, first fireflies |
| **night** | near-black 217°, L4% | deep blue 222° | 70% | glacier mint 178° | fireflies, full stars, clear sky |

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
| `data-season` on `<html>` | The time of *year* — a tint over the sky, how hazy the air is, and what falls through it |

- **Default** comes from the visitor's local clock (`lib/mood.ts`), then their choice
  is remembered.
- **The season is not a control.** It follows the visitor's date (`seasonForMonth`),
  set before first paint by the same blocking script as the mood, so the site changes
  quietly through the year while the mood switch stays the one thing to press. It
  never touches accents, so the palette family and its contrast guarantees hold on
  every day of the year.

- **Scene layers** (`components/scene.tsx`): sky gradient → sun/moon → horizon glow →
  two drifting cloud banks → two skyline ridges → lit windows → grain. All CSS/SVG
  masks, no image payload, parallaxed on scroll.
- **Fireflies at night.** A second particle system on the *same* canvas as the stars,
  so the page still runs one `requestAnimationFrame`. They wander by nudging their
  heading rather than their position, so paths curve like an insect's, and each blinks
  on its own phase. Full at night, a third at dusk, none by day.
- **Seasons ride the same canvas.** Snow, leaves, petals and rising summer heat are a
  *third* system in that one loop — still one `requestAnimationFrame`, still one canvas,
  no extra DOM layer. Each particle holds an evenly-spread threshold and joins once
  `--fall` passes it, so a season change thickens the air over the transition instead
  of popping particles into existence. Leaves and petals are ellipses that turn and
  sway wide; snow drifts straight; summer inverts the fall so heat rises off the
  rooftops.
- **Each season carries two colours, and the mood picks between them.** A particle is
  only visible by contrast against the sky, and the pale palette that reads beautifully
  at night measured **1.2–1.4 against the bright day sky — invisible**. So every season
  has a light variant and a deep one of the same hue, and `--fall-shade` (per mood)
  mixes between them **in oklch**: mixing toward a neutral ink instead turned spring's
  pink into grey mush. `npm run contrast` gates this — it fails if any of the sixteen
  mood×season pairs drops below 1.5 against its own sky.
- **Dawn and midnight used to look identical**, for two compounding reasons.
  The accents were the same two hues swapped — dawn's accent sat **3deg** from
  night's accent-2, and dawn's accent-2 **8deg** from night's accent — and the
  gate only ever compared primary against primary, so it never saw it. Worse,
  the headline used `linear-gradient(in oklch **longer hue** ...)`, and that
  keyword forces interpolation the long way round the hue wheel: the gradient
  swept every hue on the circle regardless of which two colours it was handed,
  so all four moods rendered the same rainbow. The hues were re-placed by
  search rather than by eye (minimum cross-mood separation **41deg**, lightness
  spread 0.079, chroma spread 0.020), the headline now takes the short path,
  and `npm run contrast` gates both — every accent against every other mood's,
  and any reappearance of `longer hue`.
- **The moon is a moon, not a pale sun.** A sun is a light source and reads
  correctly as a soft disc; a moon is a lit sphere of rock, and without maria, a
  terminator and limb darkening it just looks like a small white ball. A `--moon`
  token (0 by day, 1 at night) raises soft-edged, low-contrast maria and pulls
  the disc's falloff in so the limb goes crisp — a moon's edge is sharp, a sun's
  bleeds. It is drawn on a pseudo-element, so it costs no extra node, and at
  `--moon: 0` it is fully transparent and the sun below is untouched.
- **The sun and moon have exactly one strip of sky to live in** — above the
  panels, between the wordmark and the mood switcher — and getting that wrong
  caused three separate bugs, all now gated in `npm run contrast`:
  the body was placed as a share of the viewport **height** while the panels sat
  at a fixed offset, so it sank behind them on any display taller than ~760px,
  worsening with height; it was placed as a share of viewport **width** while the
  wordmark moves with the shell, so at some widths it parked behind
  "Bakul Ahmed." and washed the text out; and the clearances ignored the body's
  own radius, leaving it 2px under the switcher at 768px. It is now anchored to
  the same container as the chrome, with bounds that subtract its own radius, and
  it shrinks twice on the way down to 320px where only 43px of bar is free.
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

**A mood change used to run at 14fps.** Idle was a clean 61fps, but every mood
transition sat at p50 72ms for its full 2.6s. Leave-one-out across the whole
transition list found a single cause: `--cloud-color`. Both cloud layers are
inset past the viewport (≈1.7× its width) and compositor-promoted for their
drift, so interpolating a colour *inside* their gradient stops re-rasterised
that oversized layer on every frame. Opacity does not. Changing it to `steps(6)`
— a handful of value changes instead of 150, under a layer that is fading anyway
— took it to **p50 26–34ms with the per-mood cloud colours unchanged**. Stepping
the sky gradient too was tried and rejected: the gain was small and inconsistent,
and banding a large smooth gradient is a poor trade. What remains is spread
across several full-viewport gradient repaints, below this machine's ~10ms
measurement noise.

The scene is elaborate but must not cost frames. Two findings from profiling, both
counter-intuitive enough to be worth writing down:

- **A `mix-blend-mode` layer above the clouds cost 25 FPS.** The blend forces
  everything beneath it to re-composite every frame. Grain now sits directly over the
  sky — which is the only layer that bands — and the cost disappears.
- **`filter: blur()` on full-viewport cloud layers cost 19 FPS**, because a filtered
  layer that size re-rasterises constantly. Soft edges now come from the gradient
  falloff, with `will-change: transform` so the drift is composited.
- **The sun was a full-viewport gradient with an animated centre.** Every frame of a
  mood change repainted the whole screen — which is what made it look like it was
  flickering. It is now a compact positioned element (348px, not 1280px).
- **Cross-fading two complete scene sets was tried and reverted.** It sounds right —
  opacity is composited — but it rasterises twice the gradient area and measured
  *worse* (median frame 39–43ms against 23ms). Kept as a single interpolated set.
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

## Mobile

Handled explicitly rather than left to the responsive breakpoints:

- **Safe areas.** `viewport-fit=cover` plus `env(safe-area-inset-*)` on the fixed nav,
  the shell's inline padding and its bottom padding — without these the bar sits under
  the iPhone home indicator and content clips behind a landscape notch.
- **The nav scrim belongs to the nav.** As a document-level sibling it sat in a higher
  stacking context and painted *over* the bar, and it was built from `--sky-b`, the
  brightest sky colour — so on a day sky it washed the labels out instead of scrimming
  them. It is now the nav's own pseudo-element, derived from the panel colour so it
  always darkens. A test samples the rendered pixels behind the labels in both a bright
  and a dark sky and asserts at least 4.5:1.
- **Touch feedback.** No hover on touch, so pressable things scale slightly on
  `:active`, and the tap-highlight flash is suppressed.
- **`overscroll-behavior-y: none`** so a rubber-band pull does not reveal the page behind.
- **Browser chrome follows the sky** — `theme-color` is kept in step with the current
  mood, so a phone's status bar matches the page.
- Landscape phones, small landscape and short viewports are checked alongside the
  portrait widths.

## Structural audit

The codebase is checked by script rather than by eye, since a design that changed this
often accumulates quiet debt. What the sweep covers, and what it caught:

| Check | Found |
| --- | --- |
| CSS classes defined but never used in markup | 4 rules left by a deleted component |
| Unlayered CSS overriding Tailwind utilities | `.shine{position:relative}` silently beat `lg:sticky`, so the identity rail never stuck |
| Unused imports and locals (`tsc --noUnusedLocals`) | one stale import |
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
