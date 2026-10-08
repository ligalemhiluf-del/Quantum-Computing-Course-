import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, match, code } from '../helpers';

const L = 'b6-noise';
export const activities = [
  mcq({ id: 'b6-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['B6.2'], tags: ['bloch-channels', 'dephasing'],
    prompt: md`Checkpoint. Which noise channel leaves the whole $z$ axis of the Bloch ball unchanged but shrinks the equator?`,
    hints: ['Which Kraus operator is diagonal and commutes with $Z$?', 'Channels built from $I$ and $Z$ cannot change populations.', 'The phase-flip channel.'],
    choices: [
      ['Phase flip (dephasing)', 'Correct: $K_0\\propto I$, $K_1\\propto Z$ commute with $Z$, so populations (the $z$ coordinate) are unchanged while $x,y\\to(1-2p)(x,y)$.', true],
      ['Bit flip', 'Bit flip uses $X$: it shrinks $y$ and $z$ and leaves $x$ alone.', false, 'axis-confusion'],
      ['Amplitude damping', 'It also shrinks the equator, but it changes populations: $z\\to(1-\\gamma)z+\\gamma$.', false, 'damping-is-symmetric'],
      ['Depolarizing', 'It shrinks the whole ball uniformly, including the $z$ axis.'],
    ],
    fb: { correct: 'Dephasing destroys coherence without changing populations.', incorrect: 'Ask which Pauli the Kraus operators contain.', solutionSteps: ['Phase flip: $K_0=\\sqrt{1-p}I$, $K_1=\\sqrt pZ$.', '$Z\\rho Z$ flips the sign of off-diagonal terms only.', 'So $x,y\\to(1-2p)x,(1-2p)y$; $z$ fixed.'], followUp: 'Which physical process in a nuclear-spin ensemble does this resemble?' } }),
  numeric({ id: 'b6-p1', owner: L, role: 'practice', diff: 1, objs: ['B6.2'], tags: ['bloch-channels'], value: 0.6, tol: 1e-6,
    prompt: md`Apply the bit-flip channel with $p=0.2$ to $|0\rangle$. What is the Bloch $z$-coordinate afterwards?`,
    hints: ['The output is a mixture of $|0\\rangle$ (prob $1-p$) and $|1\\rangle$ (prob $p$).', '$z=P(0)-P(1)$.'],
    wrong: [[0.8, 'That is $P(0)$. The $z$ coordinate is $P(0)-P(1)=1-2p$.']],
    fb: { correct: '$z=1-2p=0.6$.', incorrect: 'Use $z=P(0)-P(1)$.', solutionSteps: ['$\\rho=0.8|0\\rangle\\langle0|+0.2|1\\rangle\\langle1|$.', '$z=0.8-0.2=0.6$.'] } }),
  numeric({ id: 'b6-p2', owner: L, role: 'practice', diff: 2, objs: ['B6.2', 'B6.3'], tags: ['amplitude-damping'], value: 0.8, tol: 1e-4,
    prompt: md`Amplitude damping with $\gamma=0.36$ acts on $|{+}\rangle$. What is the Bloch $x$-coordinate afterwards?`,
    hints: ['Coherences scale by $\\sqrt{1-\\gamma}$.', '$\\sqrt{0.64}=0.8$.'],
    wrong: [[0.64, 'That is $1-\\gamma$, the factor for populations. Coherences decay by the *square root*.']],
    fb: { correct: '$x\\to\\sqrt{1-\\gamma}\\,x=0.8$, while $z\\to(1-\\gamma)z+\\gamma=0.36$: the state also drifts toward $|0\\rangle$.', incorrect: 'Recall how off-diagonal elements transform under $K_0=\\mathrm{diag}(1,\\sqrt{1-\\gamma})$.', solutionSteps: ['$\\rho_{01}\\to\\sqrt{1-\\gamma}\\,\\rho_{01}$.', '$x=2\\mathrm{Re}\\rho_{01}$ scales by the same factor: $0.8$.'] } }),
  numeric({ id: 'b6-p3', owner: L, role: 'practice', diff: 2, objs: ['B6.1'], tags: ['kraus'], value: 1.2, tol: 1e-6,
    prompt: md`A student proposes $K_0=\sqrt{0.6}\,I$ and $K_1=\sqrt{0.6}\,X$. Compute the $(0,0)$ entry of $\sum_kK_k^\dagger K_k$. A valid trace-preserving channel needs this to be $1$.`,
    hints: ['$K_k^\\dagger K_k=0.6\\,I$ for both operators.', 'Add them.'],
    wrong: [[0.6, 'That is one operator\'s contribution. Sum over *both* Kraus operators.']],
    fb: { correct: 'The sum is $1.2I\\neq I$, so the map would increase total probability: not a valid channel. Fix by choosing $p_0+p_1=1$, e.g. $\\sqrt{0.6},\\sqrt{0.4}$.', incorrect: 'Compute $K_0^\\dagger K_0+K_1^\\dagger K_1$.', solutionSteps: ['$K_0^\\dagger K_0=0.6I$.', '$K_1^\\dagger K_1=0.6X^\\dagger X=0.6I$.', 'Sum $=1.2I$, entry $1.2$.'] } }),
  numeric({ id: 'b6-p4', owner: L, role: 'practice', diff: 2, objs: ['B6.2'], tags: ['bloch-channels', 'purity'], value: 0.745, tol: 1e-3,
    prompt: md`Depolarizing noise $\rho\to(1-p)\rho+pI/2$ with $p=0.3$ acts on $|0\rangle$. Compute the purity afterwards.`,
    hints: ['The Bloch vector shrinks by $(1-p)$.', '$|\\vec r|=0.7$.', 'Purity $=(1+|\\vec r|^2)/2$.'],
    wrong: [[0.7, 'That is $|\\vec r|$. Purity is $(1+|\\vec r|^2)/2$.'], [0.49, 'That is $|\\vec r|^2$; add 1 and halve to get the purity.']],
    fb: { correct: 'Purity $=(1+0.49)/2=0.745$.', incorrect: 'Use $\\mathrm{tr}\\rho^2=(1+|\\vec r|^2)/2$.', solutionSteps: ['$|\\vec r|=1-p=0.7$.', 'Purity $=(1+0.49)/2=0.745$.'] } }),
  match({ id: 'b6-p5', owner: L, role: 'practice', diff: 2, objs: ['B6.2'], tags: ['bloch-channels'],
    prompt: 'Match each channel with its effect on the Bloch ball.',
    pairs: [['Bit flip', md`shrinks $y$ and $z$, keeps $x$`], ['Phase flip', md`shrinks $x$ and $y$, keeps $z$`], ['Depolarizing', 'shrinks the ball uniformly'], ['Amplitude damping', md`contracts the ball toward $|0\rangle$ (non-unital)`]],
    hints: ['Which Pauli appears in the Kraus operators, and which axes does it leave unchanged?', 'Only one of these channels has a fixed point that is not the centre.'],
    fb: { correct: 'Channel = affine map of the Bloch ball.', incorrect: 'Look for which axis each Pauli preserves.', solutionSteps: ['$X$ errors preserve the $x$ axis.', '$Z$ errors preserve the $z$ axis.', 'Depolarizing: all axes shrink.', 'Amplitude damping: fixed point $|0\\rangle$.'] } }),
  code({ id: 'b6-p6', owner: L, role: 'practice', diff: 2, objs: ['B6.1', 'B6.3'], tags: ['kraus', 'dephasing', 'purity'],
    prompt: md`Code cell. Implement ⟦solve(p)⟧ returning the purity of $|{+}\rangle\langle{+}|$ after a phase-flip channel with probability $p$. Use ⟦Q.applyChannel⟧.`,
    api: 'Q.densityFromKet(ket), Q.ketPlus(), Q.phaseFlip(p), Q.applyChannel(rho, kraus), Q.purity(rho)',
    starter: `// Purity of |+><+| after a phase-flip channel with probability p.\n// Library: Q.densityFromKet, Q.ketPlus, Q.phaseFlip(p), Q.applyChannel(rho, kraus), Q.purity(rho)\nfunction solve(p) {\n  const rho = Q.densityFromKet(Q.ketPlus());\n  // TODO: apply the channel and return the purity\n  return 0;\n}\n`,
    solution: `function solve(p) {\n  const rho = Q.densityFromKet(Q.ketPlus());\n  return Q.purity(Q.applyChannel(rho, Q.phaseFlip(p)));\n}`,
    tests: [{ label: 'p = 0 keeps purity 1', args: [0], expected: 1 }, { label: 'p = 0.5 gives 0.5', args: [0.5], expected: 0.5 }, { label: 'p = 0.1 gives 0.82', args: [0.1], expected: 0.82 }, { label: 'p = 1 gives 1 again (deterministic Z)', args: [1], expected: 1 }],
    hints: ['Apply Q.applyChannel(rho, Q.phaseFlip(p)).', 'Pass the result to Q.purity.', 'Analytic check: purity $=(1+(1-2p)^2)/2$.'],
    fb: { correct: 'All tests pass. Note $p=1$ restores purity: a *known* $Z$ is just a unitary.', incorrect: 'Compare with the analytic purity $(1+(1-2p)^2)/2$.', solutionSteps: ['rho = |+><+|.', 'Apply the phase-flip channel.', 'Return Q.purity.'] } }),
  mcq({ id: 'b6-exit', owner: L, role: 'exit', diff: 2, objs: ['B6.2', 'B6.3'], tags: ['amplitude-damping'],
    prompt: md`Exit check. Which process drives **any** initial qubit state toward the fixed pole $|0\rangle$?`,
    hints: ['Which channel is not unital (does not fix $I/2$)?', 'Energy relaxation toward the ground state.'],
    choices: [['Amplitude damping (energy relaxation, $T_1$-type)', 'Correct: for $\\gamma=1$ every state maps to $|0\\rangle$. It models spontaneous decay of the excited level.', true], ['Phase flip', 'It leaves populations alone.', false, 'axis-confusion'], ['Bit flip', 'It symmetrises populations toward $1/2$, not toward $|0\\rangle$.'], ['Depolarizing', 'Its fixed point is the maximally mixed state $I/2$, not $|0\\rangle$.']],
    fb: { correct: 'Relaxation changes populations and coherences; pure dephasing changes only coherences. In NMR language: $T_1$ vs $T_2$.', incorrect: 'Look for the channel with a non-central fixed point.', solutionSteps: ['Amplitude damping: $z\\to(1-\\gamma)z+\\gamma$.', 'Fixed point $z=1$, i.e. $|0\\rangle$.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'B6', kind: 'standard', title: 'Quantum channels and noise', estimatedMinutes: 50,
  question: 'How do we model a qubit that leaks information into an environment, and what does each kind of noise do to the Bloch ball?',
  objectives: ['B6.1', 'B6.2', 'B6.3'], prerequisiteLessonIds: ['b5-density'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
In NMR the longitudinal relaxation time $T_1$ and the transverse time $T_2$ describe how a nuclear spin ensemble returns to equilibrium and loses phase coherence. In quantum computing the same physics limits gate depth. Both are examples of a **quantum channel**: a physical, probability-preserving map on density operators.` },
    { id: 'core', kind: 'explanation', title: 'Kraus operators and the standard channels', body: md`
A channel in operator-sum form is $\mathcal E(\rho)=\sum_kK_k\rho K_k^\dagger$ with $\sum_kK_k^\dagger K_k=I$ (trace preservation). Complete positivity is automatic for this form. The representation is not unique.

| Channel | Kraus operators | Effect on $(x,y,z)$ |
| --- | --- | --- |
| Bit flip $p$ | $\sqrt{1-p}\,I,\ \sqrt p\,X$ | $(x,\ (1-2p)y,\ (1-2p)z)$ |
| Phase flip $p$ | $\sqrt{1-p}\,I,\ \sqrt p\,Z$ | $((1-2p)x,\ (1-2p)y,\ z)$ |
| Depolarizing $p$ | $\sqrt{1-\tfrac{3p}4}I,\ \sqrt{\tfrac p4}\{X,Y,Z\}$ | $(1-p)(x,y,z)$ |
| Amplitude damping $\gamma$ | $\begin{pmatrix}1&0\\0&\sqrt{1-\gamma}\end{pmatrix},\ \begin{pmatrix}0&\sqrt\gamma\\0&0\end{pmatrix}$ | $(\sqrt{1-\gamma}\,x,\ \sqrt{1-\gamma}\,y,\ (1-\gamma)z+\gamma)$ |

With $\gamma=1-e^{-t/T_1}$ amplitude damping models energy relaxation, and pure dephasing adds extra coherence decay; overall $T_2\le2T_1$.` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example', body: md`
$|{+}\rangle$ ($\vec r=(1,0,0)$) under phase flip $p=0.1$ becomes $\vec r=(0.8,0,0)$. Purity $=(1+0.64)/2=0.82$.

**Interpretation.** The qubit is now a classical mixture of $|{+}\rangle$ (90%) and $|{-}\rangle$ (10%). Applying $H$ then would map this to an ordinary biased bit — the reason dephasing in the $Z$ basis destroys superposition-based algorithms.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'Which axis survives?', activityId: 'b6-cp1' },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Noise is a small error in the state vector."** Noise generally produces *mixed* states; a state vector cannot represent it.
- **"All noise is symmetric."** Amplitude damping is non-unital: it has a preferred fixed point.
- **"Decoherence means the probabilities stop adding to 1."** Trace is preserved. What is lost is coherence between basis states.` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: amplitude damping on the Bloch vector', collapsed: true, body: md`
$\rho=\begin{pmatrix}\rho_{00}&\rho_{01}\\\rho_{10}&\rho_{11}\end{pmatrix}$. Then $K_0\rho K_0^\dagger=\begin{pmatrix}\rho_{00}&\sqrt{1-\gamma}\rho_{01}\\\cdot&(1-\gamma)\rho_{11}\end{pmatrix}$ and $K_1\rho K_1^\dagger=\gamma\rho_{11}|0\rangle\langle0|$. So $\rho_{11}\to(1-\gamma)\rho_{11}$, $\rho_{00}\to\rho_{00}+\gamma\rho_{11}$, $\rho_{01}\to\sqrt{1-\gamma}\rho_{01}$, giving $z\to(1-\gamma)z+\gamma$.` },
    { id: 'ext', kind: 'extension', title: 'Extension', collapsed: true, body: md`
Run the **Noise lab**, fit the purity curve of a phase-flip channel to $(1+(1-2p)^2)/2$, and then compare with a continuous-time model with rate $1/T_\varphi$ (D5).` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['kraus', 'bloch-channels', 'amplitude-damping', 'dephasing', 'purity'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (2010), Chapter 8.', kind: 'textbook', note: 'Quantum noise and quantum operations; verify numbering.' },
    { citation: 'Preskill, J., Lecture Notes for Physics 219, Chapter 3.', kind: 'lecture-notes', url: 'http://theory.caltech.edu/~preskill/ph229/' },
  ],
};
