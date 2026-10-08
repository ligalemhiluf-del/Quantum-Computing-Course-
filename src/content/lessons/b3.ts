import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, match, circuit, code } from '../helpers';

const L = 'b3-gates';
const r = Math.SQRT1_2;
export const activities = [
  mcq({ id: 'b3-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['B3.1', 'B3.2'], tags: ['gate-action', 'gate-order'],
    prompt: md`Checkpoint. The circuit $H\to Z\to H$ (left to right) acts on $|0\rangle$. What does a computational-basis measurement give?`,
    hints: ['Track the state after each gate.', '$H|0\\rangle=|+\\rangle$. What does $Z$ do to $|+\\rangle$?', '$Z|+\\rangle=|-\\rangle$ and $H|-\\rangle=|1\\rangle$.'],
    choices: [
      [md`$1$ with certainty ($HZH=X$).`, 'Correct: $H|0\\rangle=|+\\rangle$, $Z|+\\rangle=|-\\rangle$, $H|-\\rangle=|1\\rangle$. Equivalently $HZH=X$.', true],
      [md`$0$ with certainty, since $Z$ only adds a phase to $|0\rangle$.`, '$Z$ does not act on $|0\\rangle$ here — it acts on $|+\\rangle$, where its sign on $|1\\rangle$ is a relative phase.', false, 'phase-is-harmless'],
      [md`$0$ or $1$ with probability $1/2$ each.`, 'The three gates compose to a deterministic bit flip.'],
      [md`The state $|{+}\rangle$ again.`, '$Z$ maps $|+\\rangle$ to $|-\\rangle$, orthogonal to $|+\\rangle$.'],
    ],
    fb: { correct: 'A phase gate sandwiched between Hadamards turns phase information into population: $HZH=X$.', incorrect: 'Apply the gates one at a time.', solutionSteps: ['$H|0\\rangle=\\tfrac1{\\sqrt2}(|0\\rangle+|1\\rangle)$.', '$Z$ flips the sign of $|1\\rangle$: $\\tfrac1{\\sqrt2}(|0\\rangle-|1\\rangle)$.', '$H$ maps this to $|1\\rangle$.'], followUp: 'What would the same circuit do to $|1\\rangle$?' } }),
  numeric({ id: 'b3-p1', owner: L, role: 'practice', diff: 1, objs: ['B3.1'], tags: ['gate-action'], value: 0.25, tol: 1e-4,
    prompt: md`Apply $R_y(\pi/3)$ to $|0\rangle$, where $R_y(\alpha)=\begin{pmatrix}\cos\frac\alpha2&-\sin\frac\alpha2\\ \sin\frac\alpha2&\cos\frac\alpha2\end{pmatrix}$. What is the probability of measuring $1$?`,
    hints: ['$R_y(\\alpha)|0\\rangle$ is the first column of the matrix.', '$P(1)=\\sin^2(\\alpha/2)$.', '$\\sin^2(\\pi/6)=(1/2)^2$.'],
    wrong: [[0.75, 'That is $\\cos^2(\\pi/6)=P(0)$, the other outcome. Check which column entry you squared.']],
    fb: { correct: '$P(1)=\\sin^2(\\pi/6)=1/4$. A rotation by $\\alpha$ about $y$ moves the Bloch vector by polar angle $\\alpha$, giving $P(1)=\\sin^2(\\alpha/2)$.', incorrect: 'Read the state off the first column of $R_y$.', solutionSteps: ['$R_y(\\pi/3)|0\\rangle=\\cos\\tfrac\\pi6|0\\rangle+\\sin\\tfrac\\pi6|1\\rangle$.', '$P(1)=\\sin^2(\\pi/6)=(1/2)^2=1/4$.'] } }),
  mcq({ id: 'b3-p2', owner: L, role: 'practice', diff: 2, objs: ['B3.2'], tags: ['global-phase-equivalence', 'gate-action'],
    prompt: md`Which gate equals the Pauli $X$ **up to a global phase**?`,
    hints: ['$R_n(\\alpha)=\\exp(-i\\alpha\\,\\hat n\\cdot\\vec\\sigma/2)$.', 'Set $\\alpha=\\pi$ and $\\hat n=\\hat x$: $\\cos\\tfrac\\pi2I-i\\sin\\tfrac\\pi2X$.'],
    choices: [[md`$R_x(\pi)$`, 'Correct: $R_x(\\pi)=-iX$, which differs from $X$ by the global phase $-i$.', true], [md`$R_z(\pi)$`, '$R_z(\\pi)=-iZ$: a rotation about $z$, not $x$.', false, 'axis-confusion'], [md`$R_y(\pi/2)$`, 'A $\\pi/2$ rotation is not a bit flip.'], [md`$S$`, '$S=\\mathrm{diag}(1,i)$ is a $z$-axis phase gate.']],
    fb: { correct: 'Gates that differ by a global phase act identically on states. (Care: when *controlled*, the phase becomes physical.)', incorrect: 'Evaluate the rotation at $\\alpha=\\pi$.', solutionSteps: ['$R_x(\\pi)=\\cos\\tfrac\\pi2I-i\\sin\\tfrac\\pi2X=-iX$.', 'Overall factor $-i$ is a global phase.'] } }),
  circuit({ id: 'b3-p3', owner: L, role: 'practice', diff: 2, objs: ['B3.3'], tags: ['gate-action', 'bloch-sphere'], n: 1, gates: ['H', 'S', 'Sdg', 'X', 'Z', 'T'], max: 3,
    target: [[r, 0], [0, r]], label: '|+i⟩ = (|0⟩ + i|1⟩)/√2', solution: [{ gate: 'H', targets: [0] }, { gate: 'S', targets: [0] }],
    prompt: md`Build a circuit (at most 3 gates, applied left to right starting from $|0\rangle$) that prepares $|{+i}\rangle=\tfrac1{\sqrt2}(|0\rangle+i|1\rangle)$. Global phase does not matter.`,
    hints: ['First create an equal superposition.', 'Which gate multiplies only the $|1\\rangle$ amplitude by $i$?', '$H$ then $S$.'],
    fb: { correct: '$H|0\\rangle=|+\\rangle$, then $S$ turns the relative phase from $1$ into $i$ — a $90^\\circ$ rotation about $z$.', incorrect: 'Track the Bloch vector: you want to end at $+y$.', solutionSteps: ['$H|0\\rangle=|+\\rangle$ (at $+x$).', '$S=\\mathrm{diag}(1,i)$ rotates by $90^\\circ$ about $z$: $+x\\to+y$.'] } }),
  circuit({ id: 'b3-p4', owner: L, role: 'practice', diff: 2, objs: ['B3.3', 'B3.2'], tags: ['gate-action', 'gate-order'], n: 1, gates: ['H', 'S', 'Sdg', 'X', 'Z', 'T'], max: 2,
    target: [[r, 0], [0, -r]], label: '|−i⟩ = (|0⟩ − i|1⟩)/√2', solution: [{ gate: 'H', targets: [0] }, { gate: 'Sdg', targets: [0] }],
    prompt: md`Prepare $|{-i}\rangle=\tfrac1{\sqrt2}(|0\rangle-i|1\rangle)$ with at most 2 gates.`,
    hints: ['Same idea as the previous item, but the relative phase is $-i$.', 'You can use $S^\\dagger$ (written Sdg).', 'Alternatively: $H,S,Z$ also works but uses 3 gates.'],
    fb: { correct: '$S^\\dagger$ gives relative phase $-i$.', incorrect: 'You need relative phase $e^{-i\\pi/2}$.', solutionSteps: ['$H|0\\rangle=|+\\rangle$.', '$S^\\dagger=\\mathrm{diag}(1,-i)$ maps $|+\\rangle$ to $|{-i}\\rangle$.'] } }),
  match({ id: 'b3-p5', owner: L, role: 'practice', diff: 2, objs: ['B3.1', 'B3.2'], tags: ['gate-action', 'bloch-sphere'],
    prompt: 'Match each gate to its action on the Bloch sphere (up to global phase).',
    pairs: [['X', md`$\pi$ rotation about $x$`], ['Z', md`$\pi$ rotation about $z$`], ['S', md`$\pi/2$ rotation about $z$`], ['T', md`$\pi/4$ rotation about $z$`], ['H', md`$\pi$ rotation about $(\hat x+\hat z)/\sqrt2$ (swaps $x$ and $z$)`]],
    hints: ['$S^2=Z$ and $T^2=S$.', 'Hadamard exchanges the $Z$ and $X$ bases.'],
    fb: { correct: 'Knowing the Bloch action lets you read circuits geometrically.', incorrect: 'Use $T^2=S$, $S^2=Z$ to order the $z$-rotations.', solutionSteps: ['$T\\to\\pi/4$, $S\\to\\pi/2$, $Z\\to\\pi$ about $z$.', '$X\\to\\pi$ about $x$.', '$H$ swaps the $x$ and $z$ axes.'] } }),
  code({ id: 'b3-p6', owner: L, role: 'practice', diff: 2, objs: ['B3.1'], tags: ['gate-action', 'numpy'],
    prompt: md`Code cell. Implement ⟦solve(theta)⟧ so that it returns the probability of measuring $1$ after applying $R_y(\theta)$ to $|0\rangle$ (use the ⟦Q⟧ helper library). Run the tests.`,
    api: 'Q.ket("0"), Q.ry(theta), Q.apply(matrix, vector), Q.probabilities(vector)',
    starter: `// Return P(1) after applying RY(theta) to |0>.\n// Library: Q.ket("0"), Q.ry(theta), Q.apply(matrix, vector), Q.probabilities(vector)\nfunction solve(theta) {\n  const psi = Q.ket("0");\n  // TODO: apply Q.ry(theta) to psi with Q.apply\n  // TODO: return the probability of outcome 1\n  return 0;\n}\n`,
    solution: `function solve(theta) {\n  const out = Q.apply(Q.ry(theta), Q.ket("0"));\n  return Q.probabilities(out)[1];\n}`,
    tests: [{ label: 'theta = 0 gives 0', args: [0], expected: 0 }, { label: 'theta = pi gives 1', args: [Math.PI], expected: 1 }, { label: 'theta = pi/2 gives 0.5', args: [Math.PI / 2], expected: 0.5 }, { label: 'theta = pi/3 gives 0.25', args: [Math.PI / 3], expected: 0.25 }],
    hints: ['Apply the matrix to the vector with Q.apply(matrix, vector).', 'Q.probabilities(psi) returns [P(0), P(1)].', 'Return Q.probabilities(Q.apply(Q.ry(theta), Q.ket("0")))[1].'],
    fb: { correct: 'All tests pass: your code matches the analytic $\\sin^2(\\theta/2)$.', incorrect: 'Compare with the analytic result $P(1)=\\sin^2(\\theta/2)$ to find the failing case.', solutionSteps: ['Create $|0\\rangle$ with Q.ket.', 'Apply Q.ry(theta) via Q.apply.', 'Index 1 of Q.probabilities is $P(1)$.'] } }),
  mcq({ id: 'b3-exit', owner: L, role: 'exit', diff: 2, objs: ['B3.1', 'B3.3'], tags: ['gate-order'],
    prompt: md`Exit check. A circuit diagram applies $H$, then $S$, then $X$ (left to right). Which operator product does it represent?`,
    hints: ['The first gate in time is applied to the state first, so it sits next to the ket.', 'Operators act to the right on the ket.'],
    choices: [[md`$XSH$`, 'Correct: $|\\text{out}\\rangle=X\\,S\\,H\\,|\\text{in}\\rangle$ — time runs left to right in the diagram but right to left in the product.', true], [md`$HSX$`, 'That reverses the order: it would apply $X$ first.', false, 'order-reversed'], [md`$SHX$`, 'Neither order is right: $H$ is first in time, so it is the rightmost factor.'], [md`Any order gives the same result.`, 'Gates generally do not commute (e.g. $HX\\ne XH$).']],
    fb: { correct: 'Diagram order = time order = reversed operator-product order.', incorrect: 'Write the state after each gate.', solutionSteps: ['After $H$: $H|\\psi\\rangle$.', 'After $S$: $SH|\\psi\\rangle$.', 'After $X$: $XSH|\\psi\\rangle$.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'B3', kind: 'standard', title: 'Single-qubit gates and circuits', estimatedMinutes: 45,
  question: 'Which transformations of a qubit are physically allowed, and how do we read a sequence of them as a circuit?',
  objectives: ['B3.1', 'B3.2', 'B3.3'], prerequisiteLessonIds: ['b2-measurement'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
Closed-system evolution is $|\psi\rangle\mapsto U|\psi\rangle$ with $U$ unitary. In a spin system a resonant radio-frequency pulse of length $t$ implements a rotation by an angle proportional to $t$. A **gate** is a named unitary; a **circuit** is their time-ordered product.` },
    { id: 'core', kind: 'explanation', title: 'The standard single-qubit gates', body: md`
$$X=\begin{pmatrix}0&1\\1&0\end{pmatrix},\ Y=\begin{pmatrix}0&-i\\ i&0\end{pmatrix},\ Z=\begin{pmatrix}1&0\\0&-1\end{pmatrix},\ H=\tfrac1{\sqrt2}\begin{pmatrix}1&1\\1&-1\end{pmatrix},$$
$$S=\begin{pmatrix}1&0\\0&i\end{pmatrix},\quad T=\begin{pmatrix}1&0\\0&e^{i\pi/4}\end{pmatrix},\quad R_{\hat n}(\alpha)=e^{-i\alpha\,\hat n\cdot\vec\sigma/2}.$$
$R_{\hat n}(\alpha)$ rotates the Bloch vector by angle $\alpha$ about $\hat n$. Useful relations: $H=(X+Z)/\sqrt2$, $S^2=Z$, $T^2=S$, $HXH=Z$, $HZH=X$. Every single-qubit unitary equals $e^{i\gamma}R_z(a)R_y(b)R_z(c)$ for some angles.

**Reading diagrams.** Time runs left to right; the operator product is written right to left.` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example: H, S, H on |0⟩', body: md`
$H|0\rangle=|+\rangle$; $S|+\rangle=\tfrac1{\sqrt2}(|0\rangle+i|1\rangle)=|{+i}\rangle$; $H|{+i}\rangle=\tfrac12\big((1+i)|0\rangle+(1-i)|1\rangle\big)$. Probabilities: $|1+i|^2/4=\tfrac12$ each.

**Interpretation.** With $\alpha=\tfrac{1+i}2$ and $\beta=\tfrac{1-i}2$ we get $\bar\alpha\beta=-\tfrac i2$, so $\langle X\rangle=2\,\mathrm{Re}(\bar\alpha\beta)=0$ and $\langle Y\rangle=2\,\mathrm{Im}(\bar\alpha\beta)=-1$: the state sits at $-y$. Equal $Z$ probabilities hide a perfectly definite $Y$ value.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'A phase gate between two Hadamards.', activityId: 'b3-cp1' },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Z does nothing because it only changes a sign."** The sign on $|1\rangle$ is a relative phase whenever the state has both components. $HZH=X$ is the proof.
- **"Gate order in the product matches diagram order."** It is reversed.
- **"Global phase never matters."** For a single un-controlled gate it does not; for a *controlled* gate the same factor becomes a relative phase between the control branches (phase kickback, C2).` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: R_x(π) = −iX', collapsed: true, body: md`
Since $(\hat n\cdot\vec\sigma)^2=I$, $e^{-i\alpha\hat n\cdot\vec\sigma/2}=\cos\tfrac\alpha2I-i\sin\tfrac\alpha2\,\hat n\cdot\vec\sigma$. At $\alpha=\pi$: $-i\,\hat n\cdot\vec\sigma$. So the rotation by $\pi$ about $x$ equals $-iX$, i.e. $X$ up to global phase $-i$.` },
    { id: 'ext', kind: 'extension', title: 'Extension: universality of single-qubit rotations', collapsed: true, body: md`
Any single-qubit unitary can be written as $R_z R_y R_z$ up to phase; with only $H$ and $T$ you can approximate any single-qubit unitary to arbitrary precision (Solovay–Kitaev gives efficient approximations). Nielsen & Chuang, Section 4.5, is the standard reference.` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['gate-action', 'gate-order', 'global-phase-equivalence', 'bloch-sphere'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (2010), Sections 1.3 and 4.2.', kind: 'textbook', note: 'Single-qubit gates and Bloch-sphere rotations; verify numbering.' },
    { citation: 'Mermin, N. D., Quantum Computer Science: An Introduction, Cambridge University Press (2007).', kind: 'textbook', note: 'A physicist-friendly alternative treatment.' },
  ],
};
