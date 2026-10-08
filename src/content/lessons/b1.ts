import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, explain } from '../helpers';

const L = 'b1-qubits-bloch';
export const activities = [
  mcq({ id: 'b1-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['B1.1'], tags: ['global-phase', 'relative-phase'],
    prompt: md`Checkpoint. Which pair of states differ only by a **global** phase, and so are physically identical?`,
    hints: ['A global phase multiplies *every* amplitude by the same $e^{i\\gamma}$.', 'Compare the ratio of the two amplitudes in each pair: a global phase leaves that ratio unchanged.', 'For $|+\\rangle=(1,1)/\\sqrt2$ the ratio $\\beta/\\alpha$ is $1$. Which pair keeps the ratio?'],
    choices: [
      [md`$|{+}\rangle$ and $-|{+}\rangle$`, 'Correct: $-|+\\rangle=e^{i\\pi}|+\\rangle$ multiplies both amplitudes by $-1$; all probabilities, in every basis, are unchanged.', true],
      [md`$|{+}\rangle$ and $|{-}\rangle$`, 'Here only the *second* amplitude changes sign: that is a relative phase. Measuring in the $X$ basis distinguishes them with certainty.', false, 'relative-as-global'],
      [md`$|0\rangle$ and $|1\rangle$`, 'Different basis states are orthogonal — completely distinguishable, not equivalent.'],
      [md`$|{+}\rangle$ and $|{+i}\rangle=(|0\rangle+i|1\rangle)/\sqrt2$`, 'The ratio $\\beta/\\alpha$ changes from $1$ to $i$ — a relative phase of $90^\\circ$, visible in a $Y$-basis measurement.', false, 'relative-as-global'],
    ],
    fb: { correct: 'Global phase = overall factor $e^{i\\gamma}$; unobservable. Relative phase = phase *between* amplitudes; observable via interference.', incorrect: 'Look at the ratio of the two amplitudes.', solutionSteps: ['A global phase multiplies the whole vector: $(\\alpha,\\beta)\\to e^{i\\gamma}(\\alpha,\\beta)$.', 'So $\\beta/\\alpha$ is unchanged.', '$-|+\\rangle$ has the same ratio as $|+\\rangle$; $|-\\rangle$ and $|{+i}\\rangle$ do not.'], followUp: 'How would you build an experiment that distinguishes $|+\\rangle$ from $|-\\rangle$?' } }),
  numeric({ id: 'b1-p1', owner: L, role: 'practice', diff: 1, objs: ['B1.3'], tags: ['born-rule', 'normalization'], value: 0.75, tol: 1e-6,
    prompt: md`A qubit is in $|\psi\rangle=\tfrac{\sqrt3}{2}|0\rangle+\tfrac12|1\rangle$. What is the probability of measuring $0$ in the computational basis?`,
    hints: ['Probabilities are squared moduli of amplitudes.', '$P(0)=|\\alpha|^2$.'],
    wrong: [[0.866, 'That is the amplitude $\\sqrt3/2$. Squaring gives the probability.', 0.002], [0.25, 'That is $P(1)=|1/2|^2$, the other outcome.']],
    fb: { correct: '$P(0)=3/4$ and $P(1)=1/4$ — they sum to 1, as normalisation demands.', incorrect: 'Square the modulus of the amplitude of $|0\\rangle$.', solutionSteps: ['$P(0)=|\\sqrt3/2|^2=3/4$.', 'Check: $3/4+1/4=1$.'] } }),
  numeric({ id: 'b1-p2', owner: L, role: 'practice', diff: 1, objs: ['B1.1'], tags: ['normalization'], value: 0.4472, tol: 0.001,
    prompt: md`Normalise $|\psi\rangle=A\big(|0\rangle+2i\,|1\rangle\big)$. Find the positive real constant $A$.`,
    hints: ['The squared moduli must sum to one.', '$|A|^2(1+4)=1$.'],
    wrong: [[0.2, 'That is $1/5$. You need the square root: $A=1/\\sqrt5$.', 0.001], [0.3333, 'Adding moduli $1+2=3$ is not the rule; add the *squares*: $1+4=5$.', 0.001]],
    fb: { correct: '$A=1/\\sqrt5\\approx0.4472$; then $P(0)=1/5$, $P(1)=4/5$. The factor $i$ does not change the modulus of the $|1\\rangle$ amplitude.', incorrect: 'Impose $\\langle\\psi|\\psi\\rangle=1$.', solutionSteps: ['$\\langle\\psi|\\psi\\rangle=A^2(1+|2i|^2)=5A^2$.', '$A=1/\\sqrt5\\approx0.4472$.'] } }),
  numeric({ id: 'b1-p3', owner: L, role: 'practice', diff: 2, objs: ['B1.2'], tags: ['bloch-sphere'], value: 120, tol: 0.05,
    prompt: md`A state has $P(0)=1/4$. Using $|\psi\rangle=\cos\tfrac\theta2|0\rangle+e^{i\varphi}\sin\tfrac\theta2|1\rangle$, what is the polar angle $\theta$ in **degrees**? (Enter the number.)`,
    hints: ['$P(0)=\\cos^2(\\theta/2)$.', '$\\cos(\\theta/2)=1/2$, so $\\theta/2$ is a familiar angle.', '$\\theta/2=60^\\circ$.'],
    wrong: [[60, 'That is $\\theta/2$. The Bloch polar angle is twice the half-angle in the state vector.'], [75.52, 'You solved $\\cos\\theta=1/4$. The probability is $\\cos^2(\\theta/2)$, not $\\cos\\theta$.', 0.1]],
    fb: { correct: '$\\theta=120^\\circ$. Check: the Bloch $z$-coordinate is $\\cos\\theta=-1/2=P(0)-P(1)=1/4-3/4$.', incorrect: 'Use $P(0)=\\cos^2(\\theta/2)$.', solutionSteps: ['$\\cos^2(\\theta/2)=1/4\\Rightarrow\\cos(\\theta/2)=1/2$.', '$\\theta/2=60^\\circ\\Rightarrow\\theta=120^\\circ$.', 'Cross-check: $z=\\cos120^\\circ=-1/2=P(0)-P(1)$.'] } }),
  mcq({ id: 'b1-p4', owner: L, role: 'practice', diff: 2, objs: ['B1.2'], tags: ['bloch-sphere', 'relative-phase'],
    prompt: md`Which state sits at the $+y$ point of the Bloch sphere?`,
    hints: ['$+y$ has $\\theta=\\pi/2$ (equator) and $\\varphi=\\pi/2$.', 'With $\\varphi=\\pi/2$: $e^{i\\varphi}=i$.'],
    choices: [[md`$\tfrac1{\sqrt2}(|0\rangle+i|1\rangle)$`, 'Correct: $\\theta=\\pi/2$, $\\varphi=\\pi/2$ gives $\\tfrac1{\\sqrt2}(|0\\rangle+i|1\\rangle)$, the $+1$ eigenstate of $Y$.', true], [md`$\tfrac1{\sqrt2}(|0\rangle-i|1\rangle)$`, 'That has $\\varphi=-\\pi/2$: the $-y$ point.', false, 'phase-sign'], [md`$\tfrac1{\sqrt2}(|0\rangle+|1\rangle)$`, '$\\varphi=0$ puts the state at $+x$.'], [md`$\tfrac1{\sqrt2}(|0\rangle-|1\rangle)$`, '$\\varphi=\\pi$ puts the state at $-x$.']],
    fb: { correct: 'The azimuth $\\varphi$ is the relative phase between the amplitudes.', incorrect: 'Identify $\\theta$ and $\\varphi$ for $+y$.', solutionSteps: ['$+y$: $\\theta=\\pi/2$, $\\varphi=\\pi/2$.', '$|\\psi\\rangle=\\cos\\tfrac\\pi4|0\\rangle+e^{i\\pi/2}\\sin\\tfrac\\pi4|1\\rangle=\\tfrac1{\\sqrt2}(|0\\rangle+i|1\\rangle)$.'] } }),
  explain({ id: 'b1-p5', owner: L, role: 'practice', diff: 3, objs: ['B1.1'], tags: ['global-phase', 'relative-phase'],
    prompt: md`Explain why $|\psi\rangle$ and $e^{i\gamma}|\psi\rangle$ are physically indistinguishable, yet $|{+}\rangle$ and $|{-}\rangle$ — which differ by a sign on one amplitude — can be perfectly distinguished.`,
    rubric: ['States that every outcome probability $|\\langle m|\\psi\\rangle|^2$ is unchanged by an overall phase, in any measurement basis.', 'Identifies the sign in $|-\\rangle$ as a *relative* phase between amplitudes.', md`Says an $X$-basis measurement gives $+$ for $|{+}\rangle$ and $-$ for $|{-}\rangle$ with certainty (interference).`],
    min: 2, model: md`Probabilities come from $|\langle m|\psi\rangle|^2$ and a global factor $e^{i\gamma}$ has modulus 1, so it drops out for every possible measurement. In $|{-}\rangle=(|0\rangle-|1\rangle)/\sqrt2$ the minus sign is *between* the amplitudes, so the amplitudes interfere differently: measuring in the $X$ basis returns $+$ with certainty for $|{+}\rangle$ and $-$ with certainty for $|{-}\rangle$.`,
    patterns: [['global phase (is|are|can be) (directly )?(measurable|observable|detectable)', 'Check the claim about global phase: it is *unobservable* because it cancels in every $|\\langle m|\\psi\\rangle|^2$. Relative phase is what is observable.']],
    hints: ['Think about what a measurement outcome probability depends on.', 'Compute $|\\langle m|e^{i\\gamma}\\psi\\rangle|^2$.'],
    fb: { correct: 'Self-check recorded. The distinction between overall and relative phase is the single most reused idea in this course (it returns as phase kickback in C2).', incorrect: 'Compare your answer with the model answer and tick only what you actually wrote.', solutionSteps: ['$|\\langle m|e^{i\\gamma}\\psi\\rangle|^2=|e^{i\\gamma}|^2|\\langle m|\\psi\\rangle|^2=|\\langle m|\\psi\\rangle|^2$.', 'In $|-\\rangle$ the sign sits between $|0\\rangle$ and $|1\\rangle$ amplitudes.', 'Measure in the $X$ basis: $|\\langle +|-\\rangle|^2=0$, $|\\langle -|-\\rangle|^2=1$.'] } }),
  mcq({ id: 'b1-exit', owner: L, role: 'exit', diff: 2, objs: ['B1.1', 'B1.2'], tags: ['bloch-sphere'],
    prompt: md`Exit check. Two single-qubit states are orthogonal ($\langle\psi|\psi'\rangle=0$). Where are their Bloch vectors?`,
    hints: ['$|0\\rangle$ and $|1\\rangle$ are orthogonal — where are they on the Bloch sphere?', 'The Bloch angle is twice the Hilbert-space angle.'],
    choices: [[md`Antipodal: $\vec n'=-\vec n$ (opposite points).`, 'Correct: orthogonal states are $180^\\circ$ apart on the Bloch sphere. In general $|\\langle\\psi|\\psi\'\\rangle|^2=(1+\\vec n\\cdot\\vec n\')/2$.', true], [md`Perpendicular ($90^\circ$ apart).`, 'This is the tempting picture from ordinary vectors. But $|0\\rangle\\perp|1\\rangle$ in Hilbert space, and they sit at the north and south poles ($180^\\circ$).', false, 'bloch-angle'], [md`At the same point.`, 'Identical Bloch vectors mean identical states (up to global phase), with overlap 1.'], [md`Anywhere, as long as they have equal length.`, 'Overlap fixes the angle: $\\vec n\\cdot\\vec n\'=-1$ for orthogonal pure states.']],
    fb: { correct: 'Bloch-sphere angles are doubled relative to Hilbert-space angles because states are rays of a spin-1/2 representation of rotations.', incorrect: 'Use the overlap formula $|\\langle\\psi|\\psi\'\\rangle|^2=(1+\\vec n\\cdot\\vec n\')/2$.', solutionSteps: ['Orthogonal means overlap 0.', '$(1+\\vec n\\cdot\\vec n\')/2=0\\Rightarrow\\vec n\\cdot\\vec n\'=-1$.', 'Unit vectors with dot product $-1$ are antipodal.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'B1', kind: 'standard', title: 'Qubits, phase and the Bloch sphere', estimatedMinutes: 45,
  question: 'A qubit has only two basis states, yet a continuum of pure states. What do the amplitudes mean, and what does the Bloch sphere show?',
  objectives: ['B1.1', 'B1.2', 'B1.3'], prerequisiteLessonIds: ['a1-linear-algebra'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
A proton in a magnetic field, a photon polarisation, or a superconducting circuit can each be treated as a two-level system. Their pure states are unit vectors in $\mathbb C^2$ — but two complex numbers constrained by normalisation and an irrelevant overall phase leave only **two real parameters**. Those are the angles on the Bloch sphere.` },
    { id: 'core', kind: 'explanation', title: 'States, normalisation and phase', body: md`
A pure qubit state is $|\psi\rangle=\alpha|0\rangle+\beta|1\rangle$ with $|\alpha|^2+|\beta|^2=1$. Measuring in the computational basis gives $0$ with probability $|\alpha|^2$ and $1$ with probability $|\beta|^2$.

- **Global phase:** $|\psi\rangle\sim e^{i\gamma}|\psi\rangle$. No measurement can distinguish them.
- **Relative phase:** the phase of $\beta/\alpha$ *is* observable, via interference.

Fixing the global phase so that $\alpha\ge0$ gives the Bloch parametrisation
$$|\psi\rangle=\cos\tfrac\theta2\,|0\rangle+e^{i\varphi}\sin\tfrac\theta2\,|1\rangle,\qquad\theta\in[0,\pi],\ \varphi\in[0,2\pi).$$` },
    { id: 'bloch', kind: 'interpretation', title: 'The Bloch sphere', body: md`
The vector $\vec n=(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)=(\langle X\rangle,\langle Y\rangle,\langle Z\rangle)$ points to the state on the unit sphere.

| Point | State |
| --- | --- |
| $+z$ / $-z$ | $\lvert0\rangle$ / $\lvert1\rangle$ |
| $+x$ / $-x$ | $\lvert{+}\rangle$ / $\lvert{-}\rangle$ |
| $+y$ / $-y$ | $\lvert{+i}\rangle$ / $\lvert{-i}\rangle$ |

For a spin-1/2 particle the Bloch vector is literally the direction in space along which the spin component is $+\hbar/2$ with certainty. Gates become rotations of the sphere (module B3). The lab **State vector and Bloch sphere** lets you vary $\theta$ and $\varphi$ and watch probabilities in three bases.` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example', body: md`
Take $|\psi\rangle=\tfrac1{\sqrt2}(|0\rangle+i|1\rangle)$. Then $|\alpha|=|\beta|=1/\sqrt2$, so $\theta=\pi/2$ (equator); the ratio $\beta/\alpha=i$ gives $\varphi=\pi/2$. The Bloch vector is $(0,1,0)$, i.e. $+y$.

**Check:** $P(0)=P(1)=\tfrac12$ in the $Z$ basis, but $\langle Y\rangle=+1$, so a $Y$-basis measurement is certain. Same $Z$ statistics as $|{+}\rangle$, yet physically different — the difference is relative phase.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'Decide which differences matter.', activityId: 'b1-cp1' },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Global phase is observable."** It cancels in every probability. (It becomes a *relative* phase only when the state is used as a control — see C2.)
- **"Orthogonal states are $90^\circ$ apart on the sphere."** They are $180^\circ$ apart (antipodal).
- **"The Bloch sphere describes multi-qubit states."** It describes one qubit. Entangled qubits have no individual pure Bloch vector (B4–B5).` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: why half-angles?', collapsed: true, body: md`
The overlap of two pure states with Bloch vectors $\vec n,\vec n'$ is $|\langle\psi|\psi'\rangle|^2=\tfrac12(1+\vec n\cdot\vec n')$. Put $\vec n'=-\vec n$ and the overlap vanishes: antipodal points are orthogonal states. A rotation by $2\pi$ of the sphere multiplies the state by $-1$ — the same sign you meet for spin-1/2 rotations in ordinary quantum mechanics.` },
    { id: 'ext', kind: 'extension', title: 'Extension', collapsed: true, body: md`
Find a state of a spin-1/2 nucleus pointing along an arbitrary direction $(\theta,\varphi)$ and write the Larmor precession $H=\tfrac12\omega Z$ as a rotation of $\varphi$ at angular frequency $\omega$. (This is the content of the physics lab in Track D.)` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['normalization', 'global-phase', 'relative-phase', 'bloch-sphere', 'born-rule'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (2010), Sections 1.2 and 4.2.', kind: 'textbook', note: 'Qubits and the Bloch sphere; verify section numbers.' },
    { citation: 'Sakurai, J. J. & Napolitano, J., Modern Quantum Mechanics, 3rd ed., Cambridge University Press (2020), Chapter 1.', kind: 'textbook', note: 'Spin-1/2 and the polarisation analogy.' },
  ],
};
