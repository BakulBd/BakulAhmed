---
title: Live AI exam proctoring with no media server and no backend
description: How GreenGuardian runs webcam proctoring, live monitoring and AI-assisted grading on Firebase's free plan — WebRTC first, a Firestore frame relay as fallback, and security rules as the real authorisation layer.
date: 2026-09-18
category: Product
tags: [webrtc, firebase, tensorflow.js, next.js, ai, architecture]
cover: /work/green-guardian.svg
coverAlt: A proctoring and analytics dashboard with detection overlays.
---

Proctoring, plagiarism detection and OCR are the parts of an exam platform that sound hard. In practice the harder part is the architecture: making live video, evidence capture and grading work **reliably, cheaply, and in a way teachers will trust**.

[GreenGuardian](https://github.com/BakulBd/GreenGuardian) is the platform I built for that — online exams with in-browser AI proctoring, plus classrooms, notices, results and video meetings around them. One constraint shaped every decision: it had to run on **Firebase's free Spark plan**, with no Cloud Functions, no custom backend and no media server.

## No backend is a real design choice

There is no application server. The Next.js app runs almost all of its logic in the browser, and a few Vercel route handlers cover what has to run server-side: OTP email, the Gemini OCR proxy, signing storage URLs and notification fan-out.

That moves the security boundary. With no API layer to check permissions, **authorisation is enforced by Firestore security rules** — the rules file *is* the backend. Role checks look up the requester's own user document:

```js
// firestore.rules (shape, simplified)
function role() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}
function isTeacher() { return request.auth != null && role() == "teacher"; }

match /exams/{examId} {
  allow read: if request.auth != null;
  allow write: if isTeacher() && request.resource.data.teacherId == request.auth.uid;
}
```

Assignment scoping follows the same pattern and **fails closed**: a teacher's notices, exams and classrooms only reach students an admin has assigned to them. An unassigned student sees nothing, instead of seeing everything.

## Proctoring runs on the student's machine

Detection runs entirely in the browser with TensorFlow.js — BlazeFace for faces (missing, or more than one) and COCO-SSD for phones and other devices — alongside tab-switch, fullscreen-exit and gaze-away tracking. No video leaves the device just to be analysed, which is good for privacy and free in terms of server cost.

Each flag lowers a **behaviour score** that starts at 100, with per-type weights and *diminishing returns for repeats*. Glancing away twelve times should not count twelve times as much as glancing away once, and a flaky webcam should not auto-fail a student. A configurable warning ceiling drives auto-submit, and every warning saves a permanent screenshot, so a teacher reviewing a flag sees the evidence, not just a number.

## Live monitoring: three transports, one badge

Teachers want to watch a student's camera live. The usual approach is a media server (an SFU), which is exactly the always-on infrastructure the free plan rules out. GreenGuardian layers three transports instead, and the teacher's view shows whichever one is alive:

| Transport | How | Badge |
| --- | --- | --- |
| WebRTC peer-to-peer | Direct video, signalled through Firestore | `LIVE HD` |
| Firestore JPEG relay | Compressed frames written to a `liveFrames` document | `LIVE` |
| BroadcastChannel | Two tabs in the same browser (local testing) | `LIVE` |

WebRTC is the primary path, and once it is connected it costs **zero** Firestore writes. The relay exists for students behind networks where peer-to-peer fails — roughly 10–20% of students sit behind symmetric NATs, which a TURN server can optionally fix.

## Spending writes only when someone is looking

The free tier has a daily write quota, and a relay that writes frames constantly would use it up in one exam. So the frame rate depends on who is watching:

| Condition | Frame interval |
| --- | --- |
| No teacher watching | no writes at all |
| Watched in a grid tile | 2.5s at 320px |
| Watched fullscreen | 1.0s at 480px |
| WebRTC connected for every viewer | a 15s heartbeat only |

```ts
function frameInterval(viewers: Viewer[]): number | null {
  if (viewers.length === 0) return null;                   // nobody watching: stay silent
  if (viewers.every((v) => v.p2p === "connected")) return 15_000; // heartbeat only
  return viewers.some((v) => v.mode === "fullscreen") ? 1_000 : 2_500;
}
```

The relay costs almost nothing when nobody needs it, and scales up only for the one student a teacher is looking at closely.

## AI-assisted, teacher-decided grading

Gemini Vision reads uploaded PDFs and photos of handwritten answers, flags text that looks AI-generated, and *suggests* marks. The teacher finalises them. Cross-student similarity uses in-repo cosine and n-gram scoring with published thresholds (70% or more is flagged as plagiarised, 30–69% as partial), so a teacher can see why something was flagged rather than trusting a black box.

That is the "workflows people trust" part. Every automated signal comes with the evidence behind it — a screenshot, a similarity score with its thresholds, an OCR confidence — and a person makes the final call.

## What I would change

The honest limitation: **grading currently runs in the browser**, which is a trust boundary — a determined student with dev tools is running the same code. It is documented as a known limitation, and moving final grading behind a server route is the next step.

The broader lesson was about constraints. "No backend, free tier only" sounded like a limitation, but it forced good decisions: authorisation in one auditable rules file, video that only costs money when someone is watching, and ML that runs where the camera is.

The source, architecture diagrams and the full list of known limitations are on [GitHub](https://github.com/BakulBd/GreenGuardian).
