---
title: Making a 3D multiplayer game feel like zero ping
description: Client-side prediction, reconciliation and snapshot interpolation — the three separate mechanisms behind the netcode of hdgame.me, built on Colyseus, Rapier3D and Three.js.
date: 2026-09-25
category: Engineering
tags: [netcode, multiplayer, colyseus, rapier, three.js, typescript]
cover: /work/web-game.svg
coverAlt: Networked 3D game clients synchronising against an authoritative server.
featured: true
---

The goal of multiplayer netcode is not low latency. You cannot beat the speed of light, and a phone on 4G will always be 60–120ms away from the server. The goal is that **the player never perceives the latency**. Those are different engineering problems.

This post is about how I approached that on [hdgame.me](https://hdgame.me), a platform of three 3D `.io` games I built with Next.js, Three.js, Node and Colyseus, with Rapier3D physics running on *both* the client and the server.

## Three problems that look like one

When a multiplayer game "feels laggy", it is usually one of three different problems, and each needs its own mechanism:

| Symptom | Who it affects | Mechanism |
| --- | --- | --- |
| "My car reacts 80ms after I steer" | the local player | client-side prediction |
| "The server disagrees with my prediction" | the local player | reconciliation + error smoothing |
| "Other cars stutter at 20 packets a second" | remote players | snapshot interpolation |

The rule that matters most: **the local player is never interpolated, and remote players are never predicted.** Mix them and you get ghosting — cars that slide or jitter — which is the most common netcode bug in browser games.

## Rule zero: one physics, both ends

Prediction only works if the client's physics agrees with the server's. If the client thinks a steering input moves the car two metres and the server thinks it moves it 2.1, every correction is a visible rubber-band.

So the repository has a `packages/shared` workspace that both the Next.js client and the Colyseus server import. It holds everything that can change the outcome of a simulation step:

- **One WASM binary.** Both ends depend on the exact same `@dimforge/rapier3d-compat` version, pinned without a `^`. The `-compat` build inlines the WASM, so Node and the browser execute *the same bytes*.
- **A fixed timestep.** The world always steps at `1/30` of a second — never derived from frame time. A variable `dt` is the single biggest source of divergence.
- **One force function.** `stepVehicle()` is the only code that applies forces to a car. The server tick calls it, and the client's replay loop calls it.
- **Quantised input.** Joystick values are quantised *before* the client predicts with them, so the client simulates on exactly the numbers the server will decode.

```ts
// packages/shared — imported by BOTH the browser and the server.
export const FIXED_DT = 1 / 30;

export function stepVehicle(body: RigidBody, input: Input) {
  // Everything is an impulse (F · dt), so replaying a tick
  // reproduces the original tick exactly.
  const forward = forwardVector(body.rotation());
  body.applyImpulse(scale(forward, input.thrust * ENGINE_FORCE * FIXED_DT), true);
  body.applyTorqueImpulse({ x: 0, y: input.steer * STEER_TORQUE * FIXED_DT, z: 0 }, true);
}
```

What this does **not** give you is bit-exact, lockstep determinism across machines — the solver's iteration order depends on the order bodies joined the world. What it gives you is *bounded divergence over a short window*, and the window is short by construction. The leftover error is centimetres, and a smoothing layer hides centimetres.

## Prediction: simulate the input before the server sees it

Every client tick, the input is sent, stored, and simulated locally at once:

```ts
const cmd = { seq: targetTick(), thrust, steer, buttons };
send(encodeInput(cmd));   // wire first — shaves a frame
ring.push(cmd);           // keep it; we may need to replay it
stepVehicle(myBody, cmd); // simulate now: zero perceived input latency
world.step();
```

The car responds on the same frame you press the key. The catch is that you are now *guessing*, and the server gets the final say.

## Reconciliation: rewind, replay, and never snap

Twenty times a second the server sends each player their authoritative state, plus one crucial number: `lastProcessedInput`, the sequence number of the last input the server actually applied. A snapshot without that acknowledgement is useless for prediction, because you cannot tell which of your inputs it already includes.

```ts
function reconcile(snapshot: Snapshot) {
  const before = myBody.translation();          // 1. what we predicted

  myBody.setTranslation(snapshot.position, true);   // 2. rewind to authority
  myBody.setLinvel(snapshot.velocity, true);

  ring.dropThrough(snapshot.lastProcessedInput); // 3. forget acknowledged inputs
  for (const cmd of ring) {                      // 4. replay the rest
    stepVehicle(myBody, cmd);
    world.step();
  }

  const after = myBody.translation();
  visualError = add(visualError, sub(before, after)); // 5. keep the error
}
```

Step four replays the whole world, not just your own car, so a collision you predicted against another car survives reconciliation instead of popping.

Step five is the part most implementations get wrong. **Do not snap the body to the server state, and do not lerp the body towards it either** — lerping corrupts the physics state and makes the next prediction worse. The body is already correct after the replay. The error lives in a purely *visual* offset that decays exponentially at render time:

```ts
// render loop
visualError = scale(visualError, Math.pow(0.001, frameSeconds)); // 99.9% gone in 1s
carMesh.position.copy(add(myBody.translation(), visualError));
```

The error is sorted into three bands. Under 5cm it is ignored (that is the steady state). Between 5cm and 3m it is absorbed invisibly by the offset. Over 3m something genuinely unpredictable happened — an unseen collision — and a clean cut looks better than a five-metre glide.

## Interpolation: draw everyone else 100ms in the past

Remote cars are the opposite problem. You cannot predict another player's inputs, so instead you delay them slightly and interpolate between two real snapshots:

```ts
const renderTime = performance.now() - INTERP_DELAY_MS; // 100ms = two patches
const [older, newer] = buffer.bracket(renderTime);
const u = (renderTime - older.t) / (newer.t - older.t);

mesh.position.lerpVectors(older.pos, newer.pos, u);
mesh.rotation.y = lerpAngle(older.rot, newer.rot, u); // shortest arc, or cars spin at ±π
```

A 100ms delay is two snapshots of cushion, so one lost packet is invisible, and 20Hz on the wire renders as smooth 144fps motion. If the buffer does run dry, the car **holds its last position rather than extrapolating**. Extrapolating a car that is about to be rammed produces a confident, wrong trajectory that then snaps back; a 50ms pause is less visible.

## Clock sync: send inputs for the future

The client stamps each input with the server tick it should *arrive* for, which means estimating round-trip time and jitter. Both use an exponentially weighted moving average, so a single 400ms spike from a mobile radio nudges the estimate instead of redefining it:

```ts
rtt    = ewma(rtt, now - sentAt, 0.2);
jitter = ewma(jitter, Math.abs(sample - lastSample), 0.2);

const lead = rtt / 2 + 2 * jitter + MS_PER_TICK;
const targetTick = serverTick + Math.ceil(lead / MS_PER_TICK);
```

The `2 * jitter` term is the whole trick. Lead too little and the server's input buffer runs empty, repeats your last input, and the car feels sticky. Lead too much and you add input latency for nothing.

## Bandwidth decides the details

A lot of the small choices fall out of one budget. Inputs go up as a binary packet of a few bytes at 30Hz — JSON would be several times larger and allocate a garbage object per player per tick. State comes down as Colyseus schema deltas: a handful of `float32` values and an acknowledgement per moving car. For a full 24-player room that works out to roughly 13 KB/s per client.

That is also why WebSocket `permessage-deflate` is off: the deltas are already close to incompressible, so compression would spend CPU and *add* latency for no gain.

## Takeaways

- **Write the determinism contract first.** Rubber-banding almost always traces back to a second copy of some physics logic. There must be exactly one `stepVehicle`.
- **Keep the three mechanisms separate in code.** Prediction, reconciliation and interpolation are separate functions of `NetClient`, and each one is testable on its own.
- **Check the proxy before blaming the netcode.** "Everything is laggy but the graphs look fine" is the signature of Nginx response buffering, and roughly 40ms of unexplained jitter is Nagle's algorithm. `proxy_buffering off` and `tcp_nodelay on` fix both.

The source is on [GitHub](https://github.com/BakulBd/web-game), and the full write-up of the strategy, maths and failure modes is in `docs/NETCODE.md`.
