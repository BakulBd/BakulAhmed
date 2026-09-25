---
title: Do we actually understand the code the model wrote?
description: Epistemic debt, explanation gates and the SOLO taxonomy — how Epistemic Guard, a VS Code extension, makes learners explain AI-generated code before they can merge it.
date: 2026-09-22
category: AI research
tags: [ai, llm, education, vscode, research, typescript]
cover: /work/epistemic-guard.svg
coverAlt: An editor pane with AI explanations and a code-repair task flow.
---

An AI assistant lets a novice programmer produce working code they do not understand. The code passes, the feature ships, and nobody notices the gap until something breaks and the assistant is not there to fix it.

A 2026 paper by Sreecharan Sankaranarayanan, [*Mitigating "Epistemic Debt" in Generative AI-Scaffolded Novice Programming using Metacognitive Scripts*](https://arxiv.org/abs/2602.20206) (ACM Learning at Scale '26), gives that gap a name and proposes an experiment to measure it. I built **Epistemic Guard**, a research-grade reproduction of the apparatus. This post explains the idea, how the tool enforces it, and why a lot of the engineering went into making it *impossible to cheat* rather than easy to use.

## Epistemic debt, in one line

The paper defines it as the difference between what you can build and what you can fix without help:

```text
Ed(t) = Uf(t) − Cc(t)

  Uf — functional utility:     what you can build (with AI)
  Cc — corrective competence:  what you can repair on your own
```

Unrestricted AI help drives functional utility up quickly. Corrective competence only grows if you actually understand what you merged. The debt is the difference, and it only shows up later, when something breaks.

## The intervention: metacognitive friction

The proposed fix is deliberately small. Before AI-generated code can be merged, the learner has to explain its causal logic in their own words. A second LLM grades that explanation against the **SOLO taxonomy** — a five-level scale from *prestructural* (missing the point) to *extended abstract* — and the merge stays blocked until the explanation reaches **Level 3, Relational**: the learner can say how the parts fit together, not just list them.

```text
AI generates code
      │
integration detected   (2+ lines, or 50+ characters, inserted at once)
      │
      ├── Group A (manual) ─────────▶ no AI at all
      ├── Group B (unrestricted) ───▶ merge immediately
      └── Group C (scaffolded)
               │
         Explanation Gate ── student explains ──▶ LLM judge ──▶ SOLO 1–5
               │                                                   │
               │◀──── Socratic questions, retry ─── score < 3 ─────┤
               └──────────── merge allowed ──────── score ≥ 3 ─────┘
```

The experiment then measures what the friction bought. After the first phase, AI access is revoked, a regression is injected into the participant's *own* code, and they get 30 minutes to fix it unaided. That repair task is the measure of corrective competence.

## Detecting "the AI just wrote this"

VS Code has no event for "the user accepted an AI suggestion". What the extension can see is text changes, so integration is inferred from their shape: an insertion of **two or more lines, or 50 or more characters, in a single atomic change**. Those are the paper's thresholds, and they sit in a config file annotated with where each value came from.

```ts
function isIntegration(change: vscode.TextDocumentContentChangeEvent) {
  const lines = change.text.split("\n").length - 1;
  return lines >= config.gate.minLines || change.text.length >= config.gate.minChars;
}
```

It is a heuristic, and the project says so: a large paste from anywhere looks the same as an AI completion. For the manual group that makes it a signal for the facilitator, not proof.

## A gate that cannot be opened by failure

Most of the engineering effort went into one property: **the gate fails closed.** An LLM judge is a network call to a probabilistic system, and every way that can go wrong has to leave the gate shut.

A timeout, a transport error, malformed JSON, a score outside 1–5 or empty feedback all become a `JudgeFailure` — a result that carries *no score at all*. The state machine has no transition from `ERROR` to `APPLYING`, so there is no code path where a failure turns into a merge:

```ts
type JudgeResult =
  | { kind: "scored"; solo: 1 | 2 | 3 | 4 | 5; feedback: string }
  | { kind: "failure"; reason: "timeout" | "transport" | "malformed" | "out-of-range" | "empty" };

function next(state: GateState, result: JudgeResult): GateState {
  if (result.kind === "failure") return "ERROR";          // retry; never merge
  return result.solo >= 3 ? "APPLYING" : "QUESTIONING";   // Socratic retry below Level 3
}
```

The same thinking applies to bypasses. While a gate is pending, four independent layers — the change listener, the will-save hook, a post-save check and a file-system watcher — all enforce one invariant: *the file's bytes on disk are the content from before the insertion.* Saving, undoing or editing the file from outside the editor cannot sneak the code in. Each of these bypass routes has its own test.

## The judge you run without an API key

A study needs an LLM judge. A test suite that calls a paid API on every run is slow, flaky and expensive. So the judge service sits behind a provider abstraction with two modes:

- **`live`** — a real model with the paper's rubric, at temperature 0.1.
- **`mock`** — a deterministic keyword scorer, so the gate, the extension and around 350 tests run with no network and no cost.

The important part is that mock scores are **never allowed to look like data**. The telemetry, the analysis output and the researcher dashboard all label mock-judged sessions, and the defaults are the safe ones: `JUDGE_MODE=mock`, `EXPERIMENT_MODE=simulation`, `COHORT_MODE=development`. Collecting real data takes a deliberate change to all three.

## Privacy by construction

Telemetry in an education study is sensitive — it is students' writing. The logger strips content-bearing fields with a denylist, digests file paths, and then runs a second guard that throws if any remaining string *looks like* prose or code. The guard sits there in case the denylist ever misses something.

## Honesty is a feature

It would have been easy to present this as "replicating the paper". It does not, and the repository says so:

- **No experimental data has been collected with it.** Running the analysis on a fresh clone prints *"No experimental data collected yet."*
- The paper's reported numbers are stored separately, marked as *source-paper results*, and a test checks that none of them ever appears in an analysis output.
- Every known difference from the original protocol — twenty-one of them, each with its severity — is documented. For example, one research question cannot be replicated at all, because no public API exposes the conversation in the AI sidebar.
- Statistical distributions (F, chi-square, t, studentised range) are implemented in the repo and checked against published tables, so a dependency update can never quietly change a p-value.

## The question worth keeping

The Explanation Gate is a small amount of friction — a paragraph before each merge — but the question behind it applies to any code you did not write yourself, whether it came from a model, a colleague or Stack Overflow: *could I repair this without help?*

If the honest answer is no, the code works but you are carrying debt, and you pay it back later, usually at a bad moment.

The code, protocol and deviation log are on [GitHub](https://github.com/BakulBd/epistemic-guard).
