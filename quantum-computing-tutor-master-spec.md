# Master build prompt: Graduate Quantum Computing Tutor

## Instructions to Claude Code

Act as a senior full-stack engineer, learning-experience designer, and graduate quantum-information curriculum developer. Build a polished, working MVP of a **Quantum Computing Tutor** for an MSc Physics student whose primary training is Nuclear/Subnuclear Physics. This is an interactive tutor, not a static course-notes website. The product should teach by eliciting reasoning, diagnosing misconceptions, giving hints, asking follow-up questions, and providing immediate, technically sound feedback.

Start by inspecting the existing repository, its framework, conventions, and instructions. Preserve and extend the existing stack where practical. If the repository is empty, choose a simple, maintainable web stack and explain the choice in the README. Implement the product, not just a plan or mockup. Do not claim an external AI service works unless it is actually configured. The app must remain useful without an API key through a clearly identified local/demo tutor mode. Keep content, curriculum metadata, tutor behavior, and UI separate so later courses and modules can be added without redesign.

The learner wants a physics-first route from prerequisites through research readiness, with natural bridges to quantum dynamics, quantum simulation, open systems, quantum information, variational methods, and quantum machine learning. These are possible interests, not a claim that any particular professor, lab, or thesis project will supervise or endorse the app. Describe research alignment as a flexible pathway and invite the learner to validate topics with their eventual supervisor.

## Product goal and learner profile

Build a self-paced, graduate-level course that helps the learner:

1. Translate quantum mechanics into the language of quantum information and computation.
2. Derive and reason about states, gates, measurement, entanglement, circuits, algorithms, noise, and simulation.
3. Connect computational methods to physical systems: spin, Hamiltonian dynamics, nuclear/subnuclear contexts, many-body models, and open quantum systems.
4. Implement small simulations and circuits, interpret results, and understand the limits of classical simulation and current hardware.
5. Progress from guided exercises to reading papers, reproducing a modest result, and scoping a thesis-level question.

Assume prior exposure to undergraduate quantum mechanics, calculus, complex numbers, and introductory programming, but do not assume fluency in linear algebra, probability, or Python scientific tooling. Include short diagnostic checks and optional refreshers rather than blocking the learner. Use SI units where physical quantities occur; state conventions explicitly. Use Dirac notation consistently and explain conventions when they vary.

## Non-goals for the MVP

- Do not build a full institutional LMS, grading backend, user-account system, social network, or instructor admin suite.
- Do not require quantum hardware credentials. All labs must run locally or have a simulator-first path.
- Do not present speculative speedups or quantum advantage as established fact. Explain assumptions, resource costs, sampling, noise, and classical baselines.
- Do not generate a massive, unreviewable corpus. Ship a coherent, high-quality first learning path and make the content schema easy to extend.

## Curriculum architecture

Organize learning into courses → tracks → modules → lessons → learning activities. The MVP ships the core foundations and the first physics/circuit labs; advanced modules can be visible as planned/locked with honest labels. A learner must be able to follow the recommended sequence or browse modules freely. Store prerequisites as a directed acyclic graph and validate there are no cycles. A module can have several prerequisites; the UI should explain which unmet prerequisite is relevant and offer a diagnostic or review lesson.

### Tracks and module map

**Track A — Mathematical and computational bridge**

- A0 Diagnostic: vectors, matrices, complex amplitudes, probability, Python comfort.
- A1 Complex vector spaces and linear algebra: bases, inner products, adjoints, eigenvalues/eigenvectors, unitary and Hermitian operators, spectral decomposition.
- A2 Tensor products and composite systems: basis ordering, Kronecker products, partial trace intuition, subsystem notation.
- A3 Probability, information, and computation: conditional probability, entropy intuition, bits vs qubits, computational complexity vocabulary.
- A4 Python scientific workflow: arrays, plotting, numerical precision, reproducible notebooks/scripts, unit tests for scientific code.

**Track B — Quantum information foundations**

- B1 Qubits and pure states: normalization, global vs relative phase, computational basis, Bloch sphere, geometric interpretation.
- B2 Measurement and quantum postulates: Born rule, projective measurements, conditional states, repeated experiments, measurement in arbitrary bases.
- B3 Single-qubit gates and circuits: X/Y/Z, H, phase and rotation gates, matrix action, circuit diagrams, global phase equivalence.
- B4 Multiple qubits and entanglement: product states, Bell states, Schmidt decomposition, reduced states, correlations, Bell inequalities at an introductory level.
- B5 Density operators: mixed states, ensembles, purity, reduced density matrices, partial trace, von Neumann entropy.
- B6 Quantum channels and noise: Kraus operators, CPTP intuition, bit flip, phase flip, depolarization, amplitude damping, Bloch-sphere effects.
- B7 No-cloning, teleportation, superdense coding, and quantum communication: protocols as state-preparation/measurement stories with resource accounting.

**Track C — Circuits and algorithms**

- C1 Circuit model and universality: reversibility, controlled operations, universal gate sets, circuit cost and depth.
- C2 Phase kickback and quantum Fourier transform: derivation, circuit construction, interpretation.
- C3 Grover search: oracle model, amplitude amplification geometry, iteration count, assumptions and limits.
- C4 Quantum phase estimation: eigenphase encoding, controlled powers, inverse QFT, precision and resource scaling.
- C5 Shor algorithm overview: factoring reduction, order finding, QPE connection, resource caveats; no claim that an MVP simulator factors cryptographic sizes.
- C6 Variational quantum algorithms: parameterized circuits, expectation values, optimization loops, barren plateaus and measurement cost.
- C7 Complexity and advantage: BQP vocabulary, oracle vs practical settings, verification, classical baselines, sampling and scaling.

**Track D — Physics-first quantum computing**

- D1 Hamiltonians as computational objects: Pauli decompositions, expectation values, spectra and time evolution.
- D2 Spin systems and qubit encodings: spin-1/2, Pauli operators, Ising and Heisenberg models, basis conventions.
- D3 Quantum dynamics and simulation: Trotterization intuition, product formulas, errors, circuit depth, exact diagonalization baseline.
- D4 Many-body states and correlations: observables, correlation functions, entanglement measures, finite-size caveats.
- D5 Open quantum systems: density-matrix dynamics, Lindblad master equation concept, channels, decoherence and noise modeling.
- D6 Quantum control and state transfer: controllability concepts, simple pulse/circuit analogies, transfer fidelity and constraints.
- D7 Nuclear/subnuclear applications bridge: explain how quantum algorithms may encode simplified lattice or effective Hamiltonians, scattering/bound-state toy models, and what additional domain knowledge is needed. Use carefully labeled toy examples; do not imply near-term solutions to full nuclear problems.

**Track E — Research extensions (extensible; advanced/preview in MVP)**

- E1 Error correction and fault tolerance: stabilizer codes, syndrome extraction, surface-code concepts, overhead.
- E2 Error mitigation and hardware-aware methods: readout mitigation, zero-noise extrapolation, calibration caveats.
- E3 Quantum machine learning: feature maps, quantum kernels, variational classifiers, data encoding and fair classical comparisons.
- E4 Quantum reservoir computing: reservoir concept, dynamical systems connection, readout training, memory/capacity and baselines.
- E5 Research reading and reproducibility: paper anatomy, claim/evidence audit, reproduction plans, notebooks, citation hygiene.
- E6 MSc research transition: question selection, literature map, feasibility matrix, supervisor discussion, 8–12 week mini-project proposal.

### Learning objectives and lesson requirements

Every module and lesson must have measurable outcomes using verbs such as derive, calculate, explain, implement, compare, or critique. A lesson includes:

- concise prerequisite list and estimated time;
- a motivating physical/computational question;
- a short explanation with notation definitions, equations, worked example, and interpretation;
- at least one interactive tutor checkpoint before revealing the complete solution;
- misconception callouts tied to the concept (e.g., global phase as observable; measurement as merely revealing a pre-existing classical bit; entanglement as faster-than-light signaling; quantum parallelism as direct access to all answers);
- 3–6 practice items with graduated difficulty and solutions hidden until requested;
- one short exit check mapped to the learning objectives;
- optional extension and references/reading suggestions, with source metadata when known.

Use progressive disclosure: give the learner a useful first explanation, then reveal derivations or optional depth. Never overload a lesson with a wall of text. Keep mathematical rigor, but narrate what each equation means physically.

### Recommended sequence and prerequisite graph

Recommended order: A0 → A1/A2/A3/A4 (some can run in parallel) → B1 → B2 → B3 → B4 → B5 → B6 → B7 → C1 → C2/C3/C4 → C5/C6/C7; D1 can begin after A1–A2 and B3; D2 follows B3–B5; D3 follows D1–D2 and C1; D4–D6 follow relevant D modules; D7 follows D1–D3; E modules follow stated prerequisites. Represent dependencies explicitly in data, not hard-coded UI logic. Permit review and exploration where safe, while clearly flagging missing prerequisites.

## Tutoring behavior

Create a tutor panel available within each lesson and as a course-wide “Ask the tutor” view. The tutor should:

1. Ask what the learner tried or what part is unclear when the question lacks context.
2. Prefer Socratic assistance: first a conceptual cue, then a more specific hint, then a scaffolded derivation, and only then a complete solution if requested or if the learner remains stuck.
3. Adapt explanation depth to the learner’s answer and selected mode: “Tutor me” (default), “Check my reasoning,” “Explain directly,” or “Exam practice.”
4. Diagnose the reasoning, not just the final numeric answer. Point out the exact step that fails and give a next action.
5. Ask one focused question at a time. Do not pretend to know the learner’s intent or award mastery based only on opening a page.
6. For math, define symbols, preserve normalization and dimensions, show intermediate steps, and sanity-check probabilities, Hermiticity, unitarity, and limiting cases when relevant.
7. For code, explain errors and debugging strategy; never silently replace the learner’s work. Keep generated code small and executable.
8. Be explicit about assumptions, simulator limitations, and uncertainty. If asked about current hardware or literature, identify the information as needing verification rather than inventing details.
9. Encourage retrieval practice and spaced review using previously missed concepts, without shaming or punitive language.
10. Never claim a tutor response came from an LLM if it came from a local scripted rule.

Implement tutor-provider abstraction. MVP must include a deterministic local tutor with authored responses for key lesson checkpoints, hint ladders, common misconceptions, and answer validation. If an LLM provider is later configured, route through a server-side adapter; never expose API secrets in browser code. Provide a visible provider/mode indicator. Validate model output against a safe response schema and fall back gracefully. Tutor context should include only the current lesson, relevant prerequisite mastery, learner’s current answer, and user-selected mode; allow the learner to clear the conversation. Do not send personal data or code to a remote service without an explicit configured provider and clear disclosure.

Suggested tutor response shape: `{ message, responseType, hintLevel?, diagnosis?, nextQuestion?, solutionSteps?, conceptTags[], confidence?, sourceRefs[] }`. Validate fields and render math accessibly.

## Exercises, quizzes, and labs

Build a reusable activity engine with item types:

- multiple choice with plausible misconception-based distractors;
- numeric answer with tolerance and units where applicable;
- symbolic/text explanation with rubric-based self-check for local mode;
- order-the-steps / match concept to expression;
- circuit construction or gate-sequence prediction;
- code cell/editor activity with starter code and expected output/invariants;
- reflection / research critique prompt.

Feedback must explain why an answer is right or wrong, connect to a concept tag, and offer a hint. Keep attempts and hints distinct: using hints can affect confidence/mastery evidence but should never block completion. Include quiz mode with a short diagnostic and unit review, but no high-stakes grading.

MVP labs (simulator-first):

1. State vector and Bloch sphere: construct single-qubit states, vary phase, compare measurement probabilities.
2. Bell-state lab: build a circuit, compute statevector, reduced density matrix, correlations, and explain why local outcomes remain random.
3. Noise lab: apply bit flip, phase flip, and amplitude damping; plot a simple quantity such as purity or Bloch coordinates as noise changes.
4. Physics lab: define a one- or two-spin Hamiltonian from Pauli terms, calculate its spectrum and time evolution, compare exact evolution with a simple product-formula approximation, and inspect error vs step size.

Prefer a small transparent simulator implemented in Python service only if the repository supports it; otherwise use a tested, documented JavaScript linear-algebra core for the MVP. Keep algorithms modular, deterministic where possible, and include small-system limits. No network quantum backend is required. Make code outputs reproducible and show inputs, units, and method assumptions.

## Assessment and progress model

Persist progress locally (browser storage or existing app database) with a versioned schema. Track:

- lesson status: not started / in progress / completed;
- objective-level evidence from checkpoints and exercises;
- attempts, hint levels used, last practiced time, and confidence/self-rating;
- module mastery estimate and prerequisites satisfied;
- lab completion and saved artifacts/notes;
- learner-selected weekly study target (optional).

Use transparent mastery rules. Example: an objective is “developing” after an attempted checkpoint, “practiced” after at least two correct attempts on distinct items, and “secure” after correct retrieval on a later review; do not infer mastery from time spent. Display the evidence and allow reset/export. A course dashboard should show current recommendation, progress by track, due review, completed labs, and a “resume learning” action. Provide JSON export/import with schema version and validation; allow full local reset.

## UI/UX requirements

Design a calm, readable, high-contrast academic interface that works on desktop and mobile. Use responsive layout and accessible semantic controls. Provide:

- course home/dashboard with learner goal, recommended next step, progress, and curriculum map;
- curriculum explorer with module cards, prerequisites, status, estimated effort, and track filters;
- focused lesson view with content/activity column and tutor panel (collapsible on small screens);
- interactive lab workspace with instructions, controls, output/plots, and reset;
- review/quiz view with progress indicator and feedback;
- research transition page with paper-reading checklist, reproducibility checklist, idea notebook, and project-scope worksheet;
- settings for tutor mode/provider disclosure, text size, reduced motion, data export/import/reset.

Support keyboard navigation, visible focus, meaningful labels, screen-reader announcements for feedback, reduced motion, sufficient contrast, and math that remains understandable via accessible text/alt descriptions. Avoid relying on color alone. Handle empty, loading, error, and not-yet-available states. Keep navigation labels plain and consistent. Do not use fake charts or fabricated learner metrics.

## Content/data model

Use typed schemas (TypeScript types and runtime validation if available) similar to:

```ts
type Course = { id: string; title: string; description: string; audience: string; version: number; trackIds: string[] };
type Track = { id: string; title: string; description: string; moduleIds: string[]; order: number };
type Module = { id: string; trackId: string; title: string; summary: string; objectives: Objective[]; prerequisiteModuleIds: string[]; lessonIds: string[]; estimatedMinutes: number; level: "foundation"|"core"|"advanced"; availability: "available"|"preview" };
type Lesson = { id: string; moduleId: string; title: string; objectives: string[]; prerequisiteLessonIds: string[]; estimatedMinutes: number; sections: LessonSection[]; activityIds: string[]; conceptTags: string[] };
type Objective = { id: string; text: string; assessmentActivityIds: string[] };
type Activity = { id: string; lessonId: string; type: ActivityType; prompt: string; conceptTags: string[]; difficulty: 1|2|3; hints: Hint[]; answerSpec: AnswerSpec; feedback: FeedbackSpec; objectiveIds: string[] };
type ProgressRecord = { schemaVersion: number; learnerId: "local"; updatedAt: string; lessons: Record<string, LessonProgress>; objectives: Record<string, ObjectiveProgress>; activities: Record<string, ActivityProgress>; notes: Note[]; preferences: Preferences };
```

Define real schemas in the project, including validation and migrations. Content should be stored as structured local files (JSON/TS/MDX, according to the project stack), not embedded in sprawling components. IDs must be stable. Include sample content for every MVP module and complete authored lessons for the first 6–8 lessons, the four labs, and their activities. For remaining planned modules, provide accurate summaries, objectives, prerequisites, and status without pretending full lesson content exists.

## Technical implementation requirements

- Follow repository conventions and existing toolchain; use strict typing where supported.
- Componentize course navigation, lesson renderer, tutor, activity renderer, progress display, and lab renderer.
- Separate domain logic (quantum states/gates/channels/Hamiltonians) from presentation.
- Include unit tests for core mathematical operations and prerequisite/progress logic if the repo already has a test setup; do not invent needless infrastructure. Add a small manual verification checklist to README.
- Handle numerical edge cases and validate dimensions, normalization, allowed probabilities, and matrix shapes.
- Keep dependencies lean; document any added package and why.
- Add a README with setup, run, configuration, architecture, content authoring, local data behavior, tutor provider configuration, limitations, and next extensions.
- Provide `.env.example` only if needed and never commit secrets.
- Ensure the application starts successfully and that core routes render without runtime errors. Run the available build/lint/test commands when present, then fix issues caused by the implementation.

## MVP acceptance criteria

The MVP is complete when:

1. A learner can start from a dashboard and enter a coherent recommended learning path.
2. They can inspect the prerequisite graph, enter a lesson, read a clear explanation, answer an activity, receive staged tutor feedback, and see progress update.
3. At least six complete foundation lessons are authored and usable; all listed tracks/modules have structured metadata.
4. The four simulator-first labs work with reproducible outputs and explain their physics/computational meaning.
5. Progress persists across refresh, can be exported/imported, and can be reset.
6. Tutor local mode is honest, useful, and functional without an API key; remote model support is an adapter seam, not a hard dependency.
7. The interface is responsive and keyboard-usable, with visible error/empty states.
8. The README accurately describes what is complete, what is preview-only, and how to extend the curriculum.

## Build approach and final report

Work in small, coherent steps: inspect repo; identify stack; map screens/data; implement the content model and graph; build navigation and lesson interactions; add local tutor and activities; implement progress; build labs; refine responsive/accessibility behavior; verify. Make sensible decisions without asking me to choose routine implementation details. If a requirement conflicts with the existing repository, preserve working project conventions and document the adaptation.

At completion, report: what was built; the key files/architecture; the lessons and labs that are complete; commands run and their results; any limitations or preview-only areas; and the exact command to start the app. Do not claim completion for any acceptance criterion that was not actually verified.
