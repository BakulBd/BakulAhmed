# Bakul Ahmed — Portfolio

A personal portfolio for **Bakul Ahmed**, Computer Science Engineer & Technology
Builder. Glass panels — a sticky identity rail and a tabbed content panel — float
over a living sky that keeps real time: the sun tracks the visitor's clock, the
moon shows tonight's actual phase, the land wears the season, and the whole scene
can be re-lit four ways.

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
| `blog` | Blog page heading and SEO description (posts themselves live in `content/blog`) |
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
2. **The three blog posts** in `content/blog` were drafted from your repositories'
   READMEs and docs. Read them, adjust anything that isn't how you'd put it, and set
   each `date` to when you actually publish.

Optional:

- **`profile.photos`** lists the portraits the swiper turns through. Empty, it cycles four generated scenes.
  Drop square images into `public/photos/` and list them there to swipe real
  photographs instead — no code change needed. Photos are cropped `object-[center_35%]`
  (slightly above centre, which suits most portraits); adjust that in
  `components/photo-swiper.tsx` if your framing differs.
- **CV** lives at `public/Bakul_Ahmed_CV.pdf`. Replace the file to update the download.

### Project art

The three project previews are drawn inline by
[`components/project-art.tsx`](components/project-art.tsx) from the mood's own
tokens, so a card at dusk is lit like dusk. Each animates what the project does —
packets between clients and an authoritative server, an explanation being written
before a merge, a detector scanning a frame — but only while its card is pointed
at or focused (always on touch, and on a post's cover). Idle cards animate nothing.

They used to be static SVGs in stock `cyan-400`/`indigo-400`: the same two colours
in every mood, and the two the palette gate exists to keep out. The files in
`public/work` remain, recoloured to the night palette, for RSS readers and anything
else that needs a real image.

To use a screenshot instead, point `image` (or a post's `cover`) at any 16:10
PNG/JPG/WebP: paths without inline art fall back to `next/image`. `fit="contain"`
shows the whole scene in a frame of another shape — the art's ground runs on past
its edges, so the letterbox is more of the same field.

> `next.config.ts` sets `dangerouslyAllowSVG` so SVG files pass through the image
> optimiser, sandboxed by a strict CSP. Once every preview is a raster image you can
> remove that block.

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

## Blog

Posts are Markdown files in [`content/blog`](content/blog); the filename is the URL
slug. Add a file, rebuild, and it appears on `/blog`, in the sitemap and in the RSS
feed with its own Open Graph card. Frontmatter is documented at the top of
[`lib/blog.ts`](lib/blog.ts):

```md
---
title: Keeping a 3D multiplayer game in sync
description: One or two sentences — this is the search-result snippet.
date: 2026-06-12
updated: 2026-07-01        # optional
category: Engineering      # drives the filter chips
tags: [netcode, colyseus]
cover: /work/web-game.svg
coverAlt: What the cover shows.
featured: true             # optional — pins it to the top of /blog
draft: false               # optional — drafts show in `npm run dev` only
---
```

- **Everything happens at build time.** Markdown is rendered by `marked`, code is
  highlighted by Shiki, and every post is static HTML — no highlighter, parser or
  Markdown runtime ships to the browser.
- **Code colours follow the mood.** Shiki emits CSS variables instead of a fixed
  theme, so keywords take the mood's accent and functions its second accent.
- **Per post:** reading time, a table of contents (from `##`/`###`), heading
  anchors, copy buttons on code, share links, author card, previous/next and
  related posts (by shared tags), and a reading-progress bar done entirely in CSS
  with a scroll-driven animation.
- **`/blog`** pins the featured (or newest) post, then offers category chips and
  search over the rest, all client-side over what is already on the page.
- **`/feed.xml`** is RSS 2.0 with full post content.

## Checks

- `npm run contrast` — no browser needed. Palette discipline, 424 contrast
  checks over 4 moods x 4 seasons (particles in both season colours), 672
  sky-geometry checks that keep the sun and moon inside their strip at every
  position the live clock can give them, and 1,625 checks on the sky clock itself.
- `npm run visual` — needs a dev server. Real layout and real pixels: the
  celestial body across 9 viewports x 4 moods, 13 widths x 5 routes for
  overflow and touch targets, image loading, and idle frame rate on a desktop
  and a 6x-throttled phone. The two agree independently — both put the tightest
  celestial clearance at dusk, 768px, 4px.

## The live sky

The sky is a clock, and it keeps time.

- **The sun tracks the hour.** While the sky follows the visitor's clock, the sun
  creeps along its strip minute by minute — low on the left at dawn, across the top
  through the day, down to the right at dusk — and the moon makes its own crossing
  at night. The windows meet end to end, so the sun never jumps when the hour turns
  over, and every position stays inside the strip the sky-geometry gate guards.
- **The moon is tonight's moon, rendered rather than painted.** The phase comes from
  the mean synodic month, counted from the new moon of 6 January 2000. The head
  script then renders the moon per pixel into a small canvas before React hydrates:
  a sphere lit from the real direction of the sun for that phase, with lunar
  (Lommel–Seeliger) rather than matte shading — so a full moon stays bright to its
  limb and the terminator falls off the way it does through binoculars, slightly
  rough where mountains catch the light. The maria sit where they really are and
  join up as they really do; Tycho and Copernicus brighten only where sunlit. The
  dark side carries earthshine as bright as the Earth is lit from the Moon — strong
  under a thin crescent ("the old moon in the new moon's arms"), almost nothing
  under a gibbous one — and turns more translucent as the phase fills, so a gibbous
  moon's unlit limb melts into the sky as it does to the eye. The haze that glows
  round the moon is painted *in front of* it (`.scene__flare`), with a faint
  diffraction corona whose strength follows the season's haze: drawn behind the
  canvas, it outlined the dark side as a disc (measured: 8 levels darker than the
  aureole; now within 2). Moonlight centres on the lit part, not the whole disc,
  and dims with the phase. It is never drawn thinner than a fingernail. Checked
  against the 2026 almanac (every full and new moon within 0.9%), and by reading
  the renderer's own pixels back for every night of a month: lit area within 4.7%
  of the phase, always on the correct side.
- **The sun is a star seen through air.** White-hot at its centre only when it is
  high; low at dawn and dusk it stays warm right through, and its limb darkens and
  reddens the way a real one does. When a cumulus drifts across it, the sun burns
  through — the cloud's middle lights up around a bright core — rather than
  vanishing behind a flat white shape.
- **Golden hour.** On a live clock the last hours of the day warm the air low over
  the city before dusk takes it: the sky keeps time *within* a mood, not only
  between them.
- **The hour turns over on its own.** Leave the tab open at 4:59pm and dusk falls
  at 5. Picking a mood pins it; the footer offers *Follow my clock again*.
- **Seasons can be previewed.** The season still follows the calendar by default,
  and the mood switch is still the one control up top — but the footer carries a
  small season picker, so all sixteen hour × season skies can be seen. A preview
  persists like a mood does, and *Follow the calendar* hands it back.
- **The footer reads the sky aloud**: which hour, which season, and tonight's moon
  with an exact phase glyph — "waning gibbous, 74% lit tonight".

**One clock, written once.** Everything above lives in a single ES5 string in
[`lib/mood.ts`](lib/mood.ts). It runs in `<head>` before first paint, so the page
never flashes the wrong sky, and it is left on `window.__sky` for React to call
rather than mirrored in TypeScript. `npm run contrast` evaluates that exact string:
every minute of a day against the mood windows, the sun's continuity at each
hand-over, the moon against the almanac, and that every phase it can produce has a
CSS rule to draw it.

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
- **The season follows the calendar**, set before first paint by the same blocking
  script as the mood, so the site changes quietly through the year. It can be
  previewed from the footer, but it never touches accents, so the palette family and
  its contrast guarantees hold on every day of the year.
- **The land wears the season.** Rolling hills behind the city take spring green,
  deep summer green, autumn rust or winter snow, seen through the hour's air: only as
  much land colour as there is daylight to show it, so at night they are a silhouette
  a shade off the sky.
- **The rooftops catch the light.** The near skyline's own path, intersected with
  itself shifted down a few pixels, leaves just the top edge of every roof — lit rose
  at dawn, warm at noon, fire at dusk, silver under the moon. In winter the edge
  thickens and whitens into snow on the roofs.
- **Clouds are cumulus**, not smears: each of the six grown from its own seed
  ([`scripts/clouds.mjs`](scripts/clouds.mjs)) — a row of cells on one flat
  condensation level, a dome leaning off-centre, a tower rising out of it, and
  the shade inside the base. Drawn once as an SVG tile and used as both mask
  and greyscale shading multiplied over the hour's cloud colour. They loop
  seamlessly (the layer moves exactly one tile), the high deck slower than the
  low haze, which is frayed stratus streaks rather than flat discs.
- **Windows at every hour.** By day the same panes are glass holding the sky
  (`--glass`), pale azure at noon and lilac at dawn; as dusk falls each one
  warms from that reflection into lamplight. The street level sinks into its
  own shadow. The city planes are solid — at 92–94% opacity every building
  behind showed through as a ghost inside the towers in front.
- **The portrait stands in the same light.** A soft-light wash from the side the sun
  or moon is on, in its colour — warm from the left at dawn, fire at dusk, cool and
  dim at night. Subtle on purpose: it is a face.

- **Scene layers** (`components/scene.tsx`): sky gradient (graded to a deeper
  zenith, with a lens's falloff at the corners) → grain → the Milky Way → sun /
  rendered moon → horizon glow → high cirrus → two drifting cumulus decks → the
  air in front of the sun or moon → seasonal hills → the city in three planes,
  with mist lying between the far one and the rest → rooftop light. All CSS/SVG
  masks, no image payload, parallaxed on scroll.
- **The city is Dhaka's.** [`scripts/skyline.mjs`](scripts/skyline.mjs) draws it
  (seeded, so it never changes unless the script does) and writes the shapes to
  `app/scene-art.css`: a dense hazy far plane; a mid plane of rooftop water tanks
  and one mosque; and the near plane — towers with setback crowns and masts,
  stepped and slanted roofs, and a mosque with a dome and twin minarets. Further
  planes sit higher, take more of the air's colour and move less on scroll. Three
  tile widths (1240/1460/1680) so the planes never repeat in step. Run
  `npm run skyline` after editing it.
- **Windows per building, in two waves.** Each facade takes one of four window
  styles (small residential panes, office strips, sparse tall panes, a lit hotel)
  at its own phase; some buildings are simply dark. The first set comes on as dusk
  falls, the second only once it is properly dark, a little cooler — screens and
  LED tubes rather than lamps. They are the near skyline's own pseudo-elements, so
  its silhouette clips them for free.
- **Aviation lights** blink red on the masts, two sets on different rhythms as
  unrelated towers do — drawn on the sky's canvas at positions exported by the
  skyline script (`lib/skyline-masts.ts`), not as animated full-width layers.
- **The Milky Way** crosses the high sky on a dark night: a band of unresolved
  starlight (dust and fractal-noise rifts drawn once by the skyline script), a
  warmer core, and a third of the canvas's stars gathered along the same line so
  the band is resolved, not just a glow. A bright moon washes it out, as it does
  outside.
- **Cirrus** — hair-thin, wind-combed fibres in a faint veil — takes the hour's
  light first at dawn and holds it longest at dusk.
- **One canvas, the whole living sky** (`components/constellation.tsx`), on one
  `requestAnimationFrame`: a still field of background stars twinkling in three
  temperatures (a few bright ones with diffraction spikes), the drifting
  constellation, an occasional shooting star on a dark enough night, birds crossing
  in loose V's by day, whatever the season drops, and fireflies.
- **High resolution.** The canvas is backed at the device pixel ratio (capped at 2),
  and every glow — star, firefly, snowflake, meteor head — is a sprite pre-rendered
  at that ratio and drawn 1:1. The old `shadowBlur` dots smeared on dense screens and
  cost a blur per dot. Sprites take any colour the stylesheet hands over (including
  `oklch()`), by tinting a white alpha falloff with `source-in`.
- **Fireflies flash like fireflies**: a short bright pulse on a species rhythm, then
  seconds of faint glow, some double-flashing; lime-gold, which is the colour real
  ones are. They wander with a smoothed random turn and bob as they go, and nearer
  ones are larger and brighter. Full at night, a third at dusk, none by day.
  They live **among the buildings** — street level up to the rooftops, moving
  with the skyline's parallax — where they used to drift at half the screen's
  height and read as stars. Each flash is a short upward swoop (the "J" real
  ones fly) and throws a faint bloom into the air around it, additively, so two
  crossing flashes brighten each other. **The season sets how many**: all of
  them in the monsoon summer, about half in spring, a third in autumn, none in
  winter.
- **The sky ends at the horizon.** The canvas sits in front of the city, so
  stars, the drifting constellation and shooting stars are kept above the
  landscape's highest point (hills 21.1vh, far masts 6vh + 122px) — they used to
  land on rooftops — and stars dim towards it, through the thicker air low over
  a city.
- **Depth.** Snow, leaves and petals each carry a depth that sets size, speed and
  brightness together, which is what makes snow read as falling through space. Leaves
  and petals tumble — turned by their spin, squashed by the cosine of their flip — and
  each season has a second colour: gold leaves among the rust, white petals among the
  pink. The contrast gate checks both colours against every sky.
- **Real time, not frames.** Motion is scaled by elapsed time, so a 120Hz phone does
  not run the sky at double speed.
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
  correctly as a soft disc; a moon is a lit sphere of rock. The first version drew it
  in CSS — a pale disc, blurred maria, a shadow laid on top — and it looked exactly
  like that: a white circle with a dark shape painted on, the dark side outlined by
  its own rim. It is now rendered (see *The live sky*), and the sun's disc fades out
  as `--moon` rises so nothing sits underneath it.
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
  it shrinks twice on the way down to 320px where only 40px of bar is free.
  (The wordmark is 96.2px: for as long as it was `inline-flex` its word space was
  silently dropped — it read "BakulAhmed." at 93px — and every clearance here was
  re-measured when the space came back.)
- **The sun is drawn like the sun.** A defined disc, white-hot at the centre and
  shading to the mood's colour at the limb, inside a tight bloom and a wide
  atmospheric halo — it used to be one soft gradient, which read as a blurred
  blob. Around it, a faint corona of uneven light shafts turns once every three
  minutes and breathes slightly. Both motions are `rotate` and `scale`, which the
  compositor handles without repainting; the corona fades out as `--moon` rises,
  stops animating at night, and never moves under reduced motion.
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

**The second round (live sky).** Adding the landscape, the clouds and the inline
project art first took mood changes from ~30fps to 6–10fps. A Chrome trace, totalled
by compositor layer, found three causes — none of them the obvious ones:

- **An image passed through a custom property is a new image every frame.** The
  cloud tile was `background-image: var(--cloud-tile)`. A mood change recalculates
  every inherited property each frame, the `var()` was re-resolved, and each
  resolution counted as a changed image: the blurred SVG re-rasterised every frame,
  117ms a frame. Written out literally, it costs nothing. Dropping the SVG blur (the
  gradients' own falloff is soft enough, and the towers read crisper) cut the
  remaining cloud raster by 4×.
- **A 1px ring the height of the page.** The panel rings are conic gradients masked
  to the border, and their layer is the whole panel — 754×4726. Every frame of the
  accent transition re-rasterised all of it to draw a hairline. The rings now take a
  stepped copy of the accent pair (`--ring-a/b`, gated to match): five repaints
  instead of fifty. 1.6s of raster per transition became 0.4s.
- **Off-screen cards still cost.** Every element recalculates style on every frame
  of a mood change, including the ~200 nodes of project art nobody can see. Cards
  and home sections use `content-visibility: auto`, so off-screen content is skipped
  outright (style 21ms → 14ms a frame). It clips painting to the box, so cards that
  already clip take it as is, and sections get padding cancelled by a negative
  margin — room for hover shadows and the tilt, without moving a pixel.
- **The landscape keeps its own copy of the hour.** Hills and rooftops read per-mood
  colours stepped through a change, on their own layers, rather than the animating
  sky — so they repaint a handful of times, not every frame.
- **The sky adapts.** If the page cannot hold ~55fps with the canvas running, the
  sky drops to every other frame, once, and the rest of the page keeps the budget.
  Slow particles look the same at 30fps; a stuttering scroll does not. On a
  6×-throttled phone the canvas took the main thread from 42% to 102% busy; at half
  rate the page holds 60fps.

Measured after, worst case (night + winter, everything on), against the code before
this round in the same headless, software-rendered Chrome: idle 60fps at 1440@2×
(was 50), 61fps on a 6×-throttled phone (was 61); mood change 28fps at 1440@2×
(was 30), 20fps at 1920 (was 19), p95 frame 83ms (was 133–216ms).

**The first round.**

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
npm run contrast   # 424 contrast checks across 4 moods x 4 seasons
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
| `components/panel-nav.tsx` | The navigation, in two forms. **Phones:** a tab bar along the bottom — icon over label, a pill sliding to the current page, tabs that answer the thumb. Each tab is built on shared measurements (a fixed 52×28 icon pod, a 4px gap, then the label), and the pill is drawn to the pod exactly: it used to be taller than the icon's space and its lower edge ran through the label. The bar is solid — inside the glass panel its backdrop blur had nothing to frost and only let the page ghost through the labels. Checked at 9 widths × 5 pages: pill aligned to the pod, a clear gap to the label, no label clipped or outside its tab. It tucks away while you read downwards, returns on any upward scroll, at the end of a page and on every new page, and steps aside while a form field has focus so it never sits over what you type above the keyboard. **Tablets and up:** docked into the content panel's corner, and sticky — it used to scroll away with the corner, leaving a long page with no way to another short of scrolling back up. Once the corner leaves the screen it floats as a glass pill and gains what scrolled away with the header: back to top, and the lighting. The indicator is measured from live geometry; on wide screens it previews the hovered tab. `radio-keys.ts` gives the mood switch and the season picker the WAI-ARIA radio pattern — one Tab stop, arrows to move. |
| `components/mood-switch.tsx` | The four-way light switch, with a sliding pill. |
| `.shine` (globals.css) | Gradient ring masked to the border box, sweeping via an `@property` conic angle. Always-on for panels, hover-revealed for cards. |
| `.btn-shine` (globals.css) | A light sweep that crosses primary buttons on hover and focus. |
| `components/card.tsx` | The panel surface every inner-page section sits on, carrying the shine ring, spotlight and reveal in one place. |
| `components/role-rotator.tsx` | One calm crossfade per role. The server renders exactly the first frame — one role — where it used to render all five joined and collapse on hydration, the home page's only layout shift. Screen readers get the full list once. |
| `components/constellation.tsx` | Sparse particle field on a canvas, density scaled to viewport area, paused while the tab is hidden. |
| `components/counter.tsx` | Counts each statistic up the first time it scrolls into view. |
| `components/spotlight.tsx` | One delegated pointer listener writes `--mx/--my` onto the hovered card, so cards stay server-rendered. |
| `components/route-transition.tsx` | Re-keys on navigation so panel content settles in on each tab change — but not on the first load, where fading the page in from opacity 0 delayed LCP. One animation on the wrapper only — staggering the first child made it fade twice. |
| `.sent` (globals.css) | After a message sends, the tick draws itself inside an expanding ring and the copy rises in behind it. |
| `components/mood-provider.tsx` | Owns the mood, persists it, and wraps light↔dark flips in a View Transition. |
| `[data-reveal]` | Fade-up on scroll. Where the browser supports `animation-timeline: view()` this is pure CSS, and anything already on screen at load paints immediately — the script path hid it until hydration, which Lighthouse measured as the LCP. Elsewhere a single `IntersectionObserver` does it, **re-armed on every route change** so client-navigated content never stays hidden. |

| `components/project-art.tsx` | Project previews drawn from mood tokens; animate on hover, focus or touch. |
| `components/sky-almanac.tsx` | The footer's sky readout, moon phase glyph, season preview and *Follow my clock again*. |
| `.btn` (globals.css) | One button system site-wide: same height, radius, inner highlight, lift on hover, press on `:active`; arrows lean the way they point and downloads drop a pixel. On a phone a `.btn-row` shares the width evenly. |
| `.focus` (globals.css) | The hero's *Builds / Researches / Leads* rows — each a link to its evidence; the label slides, the line brightens and the arrow leans on hover. |
| `.section-title` (globals.css) | A chapter hairline from each home section's title to the edge of its column, drawn in by a CSS scroll timeline as it arrives. |
| `components/view-transition.ts` | Portfolio and blog filters run inside a View Transition: cards that stay glide to their new places, the rest fade. The page itself does not cross-fade, so the sky never freezes. Off under reduced motion. |
| `.timeline` (globals.css) | Resume entries on a spine that fades out below the last one; periods as mono pills; current roles carry a pulsing *Now*. |
| `components/scroll-reveal.tsx` | Also watches for content that arrives later (a card a filter brings back) — in browsers without scroll timelines it used to stay hidden. |
| `components/local-time.tsx` | Dhaka local time in the sky's vocabulary — "9:14 PM in Dhaka · night there". Placeholder and real text both hold one line, so the swap on mount shifts nothing. |
| `.tilt` (globals.css) | Image cards lean a few degrees toward the pointer, built from the `rotate` property so it composes with the scroll reveal's `transform`. |

Under `prefers-reduced-motion: reduce` the sky paints one still frame — stars, resting
fireflies, the moon in its phase — and redraws only when the mood or season changes;
the portrait holds one frame, project art holds its composed still, the caret
disappears, counters show their final value immediately, and route transitions are
off.

## Design system

Tokens sit at the top of [`app/globals.css`](app/globals.css): one dark surface
palette, and an accent pair per mood. Change a mood's `--accent` and `--accent-2` (and
its stepped `--ring-a`/`--ring-b` copy, which the gate checks) to re-brand it.

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

- Per-route `title`, `description`, canonical URL **and Open Graph block**, from
  `pageMetadata()` in [`lib/seo.tsx`](lib/seo.tsx). Routes used to inherit the root
  layout's `og:url` and `og:title`, so every shared link unfurled as the home page.
- **Titles say what the page is about** — "Resume & CV: Full-Stack and AI Engineer —
  Bakul Ahmed", not "Resume — Bakul Ahmed" — all under 60 characters. **Descriptions
  are 148–158 characters**, front-loaded; several ran past 200 and were cut off
  mid-sentence in results. Breadcrumbs and feeds keep the short names.
- **The portrait is the canonical image.** `public/bakul-ahmed.jpg` (1200px square,
  named for the person) is the `Person.image` in structured data, the
  `primaryImageOfPage` of every page, and an image-sitemap entry on the home URL —
  which is what Google needs to show the photo for a search on the name.
- **One JSON-LD graph, linked by `@id`, that resolves on every page** (checked: no
  dangling references). `Person` and `WebSite` everywhere; each page adds a node
  saying what it is — `ProfilePage` (home), `AboutPage` (resume), `CollectionPage`
  over an `ItemList` of `SoftwareSourceCode` (portfolio, each with its repo, demo,
  image and write-up), `Blog` + `BlogPosting` (blog and posts), `ContactPage` — plus a
  real per-page `BreadcrumbList`. The person carries his university (as
  affiliation), his GUCC role through schema.org's `OrganizationRole` (position and
  start date, not just membership), languages, awards and every profile in
  `sameAs`; the website carries the names people search for (`alternateName`).
- **`rel="me"`** on every link to his own profiles, the identity signal IndieWeb
  tools and Mastodon verify against.
- `sitemap.xml` with each post's real `lastmod`, the pages' from `site.updated` in
  `lib/content.ts` rather than the build time (a lastmod that moves on every deploy
  teaches search engines to ignore it — bump it when you edit the copy), and image
  entries for the portrait and every post card. URLs match the canonical tags
  **exactly**, including the bare origin for the home route. `robots.txt` keeps
  `/api/` out. RSS `<link>` on every page.
- `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` emit ownership meta tags when
  set. After deploying, verify in Search Console and submit `/sitemap.xml`.
- **Icons, one mark at every size.** "B." — the real Geist Bold B (its outline
  lifted from the font file) and the accent full stop that ends the wordmark,
  which doubles as a moon. From 180px up the icon carries the site's night: stars,
  a horizon glow and the same Dhaka skyline the page draws. `app/icon.svg`, a
  16/32/48 `favicon.ico`, a 180px `apple-icon.png` and 192/512 + maskable manifest
  icons, all rendered by [`scripts/icons.mjs`](scripts/icons.mjs)
  (`npm run icons`). The manifest carries an `id` and `scope`, and
  `apple-mobile-web-app` metadata opens a home-screen launch full-screen under the
  sky.
- **`/llms.txt`** — the site in plain Markdown for language models and answer
  engines ([llmstxt.org](https://llmstxt.org)): who he is, the pages, projects and
  posts with one-line summaries, and how to reach him. Generated from
  `lib/content.ts`, so it cannot drift from the pages.
- The `Person` node also carries `hasOccupation` (with his skills) and a work
  location, and the home page's `dateModified` is `site.updated` rather than the
  build date.

### Share cards (Open Graph)

Every card is generated at build time by one template family in
[`lib/og.tsx`](lib/og.tsx), set in the site's own night: stars, **the site's own
skyline** (`lib/skyline-art.json` — domes, minarets, lit windows, rooftops
catching the light), and **the moon from the site's
renderer** — the same `drawMoon` the page runs, pointed at a stand-in canvas and
written out as a PNG. Each card says what its page is, rather than the same
portrait under a different headline:

| Card | Shows |
| --- | --- |
| Home | The role, the portrait, and the home page's figures (CGPA, problems solved, awards) |
| Resume | Degree and CGPA, university, current role |
| Portfolio | The three projects' art, fanned like prints, with their names |
| Blog | The newest posts, dated |
| Contact | Email, timezone, what he is open to |
| Each post | Its title, date and reading time, its cover art, and a byline |

Post cards are a prerendered route, `/blog/<slug>/card.png`, named explicitly in
the post's metadata with **its own alt text** (title plus a description of the art).
The `opengraph-image` file convention can only give every post the same static alt;
the per-card alternative (`generateImageMetadata`) put the card under an id segment
that Next 16 never prerenders, and with `dynamicParams` off every post card 404'd in
production while working in dev.

Check them after deploying with the
[Rich Results Test](https://search.google.com/test/rich-results) (home should show
*Profile page*, posts *Article*) and [opengraph.xyz](https://www.opengraph.xyz).

## Accessibility

- One `h1` per route, no skipped heading levels, no duplicate element ids.
- Skip link, visible focus rings, labelled form fields, named buttons.
- Navigation is reachable at every width and every scroll position: a bottom tab bar
  on phones (44px+ targets), a sticky, floating nav from 768px up, and the page links
  again in the footer. The mood switch and season picker follow the radio pattern
  (one Tab stop, arrow keys, Home/End).
- **Down to a 280px folding-phone cover screen.** Below 340px the profile card can
  shrink (it set a 300px minimum and stretched the layout off-screen, taking the tab
  bar with it) and its name wraps; below 300px the wordmark and switcher tighten, and
  the sun shrinks into the 20px of sky left between them — checked by the
  sky-geometry gate like every other width.
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
- **The footer is on glass.** Below the panels it sits on open sky, and muted text on
  a noon sky measured about 2:1; on a panel it passes the same gate as everything else.
- **Narrow screens.** Below 380px the role pill beside the portrait sheds its border
  and reads as a subtitle (as a pill it wrapped to three lines), and below 640px the
  hero's local time takes its own line rather than stranding a separator.
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
npm run contrast   # palette, contrast, sky geometry and the sky clock
npm run verify     # contrast gate + production build
npm run visual     # real layout and pixels (needs a running server)
npm run skyline    # regenerate the city and high-sky shapes (app/scene-art.css)
npm run clouds     # regenerate the cumulus and horizon-haze tiles (in app/globals.css)
npm run icons      # regenerate every icon from the mark (needs Chrome)
npm run contrast -- --table   # worst-case ratio of every text role, per mood
npm run contrast:pixels       # contrast on real pixels (needs a running server)
```

### The fourth round (an audit of every block, icon and text)

Measured rather than eyeballed, on a production build:

- **The palette, arithmetically** (`npm run contrast -- --table`; worst case over
  all four seasons and every part of the sky): body text 13.1–16.7:1, secondary
  9.6–12.2, muted labels 6.2–7.8, errors 6.6–8.4, accents 8.1–11.8, text on the
  accent 9.1–11.6. Every role clears AA on every surface; most clear AAA.
- **The page, on real pixels** (`npm run contrast:pixels`): every visible text
  node and UI icon on six routes, four moods, phone and desktop — 8,603 renders.
  It found what arithmetic cannot: a disabled button faded to 1.6:1 (now muted
  text on the tile surface — clearly inert, still readable), placeholders and a
  character count faded by opacity modifiers (3.7:1, now full strength), version
  URLs at 70% (now full), and the wordmark on a noon sky — white on a passing
  cumulus, citron against the sun's glare — at 1.3–2:1. Its halo is now layered
  tight to wide, measured against the ring around each stroke: median 4.7–7.2:1
  in every mood. 98.9% of all renders pass; what remains below threshold is the
  wordmark by the strict box measure, and three decorative separators.
- **Errors have their own colour** (`--danger`, gated like every other text
  role). They used to take the accent — mint at night, which reads as success.
- **Accessibility**: axe-core over every route at both sizes — one violation
  (the wordmark and light switch sat outside any landmark; they are now the
  page's `<header>`), now none. Lighthouse: Accessibility, Best Practices and SEO
  100 on every page, desktop and mobile.
- **Icons**: every decorative icon is hidden from assistive tech, every
  icon-only control has a name, none sits more than 1px off its label's centre
  line; strokes unified at 1.7.
- **Devices**: a 10-device matrix per route, from a 280px fold cover to a
  3440px ultrawide. Landscape phones (390px tall) now see the hero on the first
  screen — the profile card and panel padding tighten there; narrow phones
  (≤379px) get slimmer insets, so a résumé line holds a sentence's worth of words
  rather than three.
- **The wordmark had lost its space.** It is `inline-flex`, and a plain space at
  the end of an anonymous flex item is dropped: it has read "BakulAhmed." at
  93px since it became a flex box. A no-break space restores "Bakul Ahmed."; the
  sky geometry was re-measured (96.2px, and a slightly smaller sun below 380px)
  and both gates agree — tightest clearance 2.5px arithmetically, 3px in pixels.
- **Print**: a résumé gets printed. Ink on white, the sky and controls gone,
  accents become dark ink, links show where they go, the footer is the name, the
  line and the address.
- **Forced colours** (Windows High Contrast): the sky steps aside, the gradient
  headline becomes plain text, and current-state markers keep a system highlight.
- **Weight**: the Milky Way's dust is now thresholded noise (0.5KB where 170
  placed dots took 2.6KB gzipped), cirrus bundles carry one rotation each, and the
  generated art is inlined into the main stylesheet instead of a second
  render-blocking request. Lighthouse mobile, home, three interleaved runs against
  the original build: Performance 94–97 (was 91–93), TBT 80–210ms (was
  230–270ms), LCP 2.5s (2.4–2.6s), CLS 0.

### The third round (the city, the stars, the interface)

The richer sky first cost frames: idle at night fell from 61fps to 40 on the
software-rendered desktop the gate measures. Toggling each new layer off in turn
found the costs — and, again, none was the obvious one. Every full-viewport layer
stacked *above* the animated cloud decks is composited separately on every frame,
so a static vignette cost as much as an animated one; a rotated 210vmax element
with `will-change` made the Milky Way the single worst; and two blinking
full-width beacon layers cost more than the lights were worth. The vignette moved
into the sky's own paint, the galaxy became an angled gradient on a plain layer
under the clouds, the windows became the skyline's pseudo-elements, the beacons
moved onto the canvas, and cirrus stopped drifting (at its real height it moves
about two pixels a second — no one could see it). Measured after: 58–61fps in
every mood, indistinguishable from the scene without any of the new layers.

Beyond that, the work in this repo was verified by script against a running build:
behaviour and accessibility on all five routes, the contact API's validation, honeypot,
rate limiting and secret containment, security headers, canonical/sitemap agreement,
JSON-LD shape, reveal visibility after client-side navigation, and a responsive sweep
across 13 widths.

## Lighthouse

Mobile profile (simulated slow 4G, 4x CPU) against the production build:

| Route | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 93–95 | 100 | 100 | 100 |
| `/resume`, `/contact` | 94–95 | 100 | 100 | 100 |
| `/blog`, `/portfolio` | 94–95 | 100 | 100 | 100 |
| `/blog/<post>` | 92–95 | 100 | 100 | 100 |

CLS is 0 everywhere. Above-the-fold images use `preload` + `fetchPriority="high"`
(Next 16 deprecated `priority`, which no longer emits the hint), and SVG art skips
the image optimiser. `experimental.inlineCss` was measured and made no difference,
so it is off.

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

After the first deploy:

4. In [Google Search Console](https://search.google.com/search-console), add the
   domain, put the token in `GOOGLE_SITE_VERIFICATION`, redeploy, verify, then
   submit `https://<your-domain>/sitemap.xml`. Use **URL Inspection → Request
   indexing** on the home page and each post to speed up the first crawl.
5. Check the structured data with the
   [Rich Results Test](https://search.google.com/test/rich-results) (home should
   show *Profile page*, posts *Article*) and preview link cards with
   [opengraph.xyz](https://www.opengraph.xyz).

The in-memory rate limiter reads `x-forwarded-for`. Vercel sets it; a self-hosted
deploy needs a reverse proxy that does too, or every visitor shares one bucket.
