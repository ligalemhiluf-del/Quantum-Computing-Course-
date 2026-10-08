# Quantum Computing Tutor

A physics-first, graduate-level, self-paced quantum computing course for an MSc Physics student (nuclear / subnuclear background). It is an **interactive tutor**, not a notes site: lessons contain checkpoints, hint ladders, misconception diagnosis, practice, exit checks, simulator labs and spaced review.

Research topics are flexible learning pathways, not claims of affiliation with or endorsement by any university, professor or group. Validate topic choices with your eventual supervisor.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + tests + production build
npm run build && npm run preview   # serve the production build (port 4173)
```

Stack: Vite + React 19 + TypeScript (strict) + React Router (hash routing, so it works from any static host) + KaTeX (math, with MathML for screen readers) + Vitest. No other runtime dependencies; no backend.

## What is complete, and what is preview

| Area | Status |
|---|---|
| All 5 tracks / 32 modules (A0–A4, B1–B7, C1–C7, D1–D7, E1–E6) with objectives, levels, effort, prerequisite DAG | Complete metadata |
| Full lessons: **A0** diagnostic, **A1**, **A2**, **B1**, **B2**, **B3**, **B4**, **B5**, **B6** (8 standard lessons + diagnostic) | **Complete** |
| Labs: Bloch sphere (B1), Bell state (B4), Noise (B6), Physics/Trotter (D1/D3) | **Complete** |
| A3, A4, B7, all of C, D (except the lab), E | **Preview only**: objectives and prerequisites, flagged "Preview — planned"; no lesson content is pretended |
| Tutor | Local scripted tutor works fully; remote model is an **unverified adapter seam** |

Each standard lesson has a motivating question, notation, explanation, worked example, inline checkpoint, misconception callout, optional derivation/extension (collapsed), 3–6 practice items of graduated difficulty, one exit check, and references. Activity types: multiple choice (misconception distractors), numeric (tolerance, safe expression parser), explain/reflection (rubric self-check), order, match, circuit construction, JavaScript code cell (runs in a Web Worker with timeout).

## Architecture

```
src/domain/quantum      complex, matrices, states, gates, circuits, channels, Hamiltonians, Trotter (pure, tested)
src/domain/curriculum   schema types, DAG/cycle checks, content validation
src/domain/activities   grading, safe numeric parser, code runner (+ worker)
src/domain/progress     versioned schema + migration + validation, mastery rules, store, selectors (recommendation, review queue)
src/domain/tutor        response schema/validator, local scripted provider, remote adapter
src/domain/text         Markdown-lite parser (no HTML passthrough)
src/content             course/module map, lessons/*.ts (lesson + its activities), labs, tutor knowledge
src/ui                  pages, components, labs (presentation only)
tests/                  quantum, content, progress, tutor, route-render tests
scripts/smoke.mjs       optional Playwright browser smoke test
```

Content, curriculum metadata, tutor behaviour and UI are separate. Module `lessonIds`, `labIds`, availability and objective→activity links are **derived** from authored files in `src/content/index.ts`.

## Conventions
Dirac notation; kets are columns; **qubit 0 is the leftmost bit and most significant** (some libraries, e.g. Qiskit, differ); Bloch angles `|ψ⟩=cos(θ/2)|0⟩+e^{iφ}sin(θ/2)|1⟩`; entropies in bits; Hamiltonians are H/ħ in rad/μs with time in μs and explicit SI conversions. See the in-app *Notation and conventions* page.

## Progress and mastery (transparent rules)
Stored in `localStorage` key `qtutor.progress.v1`, schema version 1, validated on load/import, with a migration path (v0 → v1 tested). Per objective:
- **developing**: any attempt on a mapped activity;
- **practiced**: independent correct answers on ≥2 distinct activities ("independent" = full solution/scaffold, hint level 3, not used);
- **secure**: practiced, plus a later correct auto-graded retrieval in *review* mode ≥20 h after becoming practiced.

Self-assessed answers can reach practiced but never secure. Opening pages or time spent never counts. Hints never block completion. Review is scheduled after 1 day for misses, then 1/3/7/21/60 days. A module's mastery estimate is the mean of objective weights (0/0.3/0.7/1); a prerequisite is "met" at ≥50%; unmet prerequisites are flagged with a concrete review lesson, never enforced. Settings provides JSON export, validated import (malformed files are rejected without changes), and reset.

## Tutor providers
- **Local scripted tutor (default)**: deterministic; authored hint ladders (cue → specific → scaffold → solution), misconception patterns, per-concept explanations, four modes (Tutor me / Check my reasoning / Explain directly / Exam practice). It is labelled "not an AI model" everywhere, cannot verify free-form derivations, and says so.
- **Remote adapter (off by default)**: `createRemoteTutor` POSTs a minimal payload (see Settings for the exact example) to *your server-side* endpoint, validates the reply against the response schema `{message, responseType, hintLevel?, diagnosis?, nextQuestion?, solutionSteps?, conceptTags[], confidence?, sourceRefs[]}`, and falls back to local on any failure. Requires explicit enable + consent + https (or localhost) endpoint. **No server ships with this repo and it is untested against any real model.** API keys must live on your server, never in the browser.

## Authoring content
1. Add or edit module seeds in `src/content/modules.ts` (prerequisites are data; cycles fail tests).
2. Create `src/content/lessons/<id>.ts` exporting `lesson` and `activities` (use helpers in `helpers.ts`; write ⟦ for a backtick; use the `md` tag for LaTeX), then register it in `src/content/index.ts`.
3. Add tutor concepts/misconception patterns in `tutorKnowledge.ts` for each new concept tag.
4. `npm test` validates structure, that every answer key grades correct and every authored wrong answer grades incorrect, that code starters fail and solutions pass, and that **every LaTeX snippet compiles in KaTeX**.

## Verification performed
`npm run check` → typecheck clean, **221 tests passing**, production build OK. `scripts/smoke.mjs` (headless Chromium) passed 63/63 checks: every route, persistence across reload, hint ladder and tutor flow, circuit and Web-Worker code activities (including infinite-loop timeout), labs, export/reset/import and malformed-import rejection, 375 px mobile layouts without horizontal scroll, no console errors.

Manual checklist: complete the diagnostic and see the dashboard recommendation change; open B4 and answer the checkpoint wrongly then use hints; build Φ+ in the circuit item; run each lab, save a run, complete a lab; export, reset, import; switch text size/theme in Settings; tab through a lesson with the keyboard.

## Limitations
- Simulators are idealised statevector/density-matrix models (≤10 qubits; physics lab ≤2 spins). No hardware noise calibration or advantage claims.
- Code cells are JavaScript, not Python (Python is only mentioned in text; module A4 is preview).
- Free-text answers are self-assessed; the local tutor matches authored patterns only.
- Citations are given from memory of well-known sources: verify before citing. Section numbers may differ by edition.
- Bundle is a single ~860 kB chunk (no code splitting yet). No ESLint configured; `tsc --strict` is the static check.
- Accessibility was built in (landmarks, skip link, focus management, live regions, MathML, non-colour cues, reduced motion) and checked by automated/keyboard smoke tests, but not audited with a screen reader.

## Next extensions
Author A3/A4/B7 and Track C, then D1–D7; Python/Pyodide code cells; spaced-review tuning; code-splitting; a real server adapter for an LLM with evaluation of its output.
