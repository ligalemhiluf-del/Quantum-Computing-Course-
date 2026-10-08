import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, explain, circuit } from '../helpers';

const L = 'b4-entanglement';
const r = Math.SQRT1_2;
export const activities = [
  mcq({ id: 'b4-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['B4.3'], tags: ['no-signalling', 'bell-state'],
    prompt: md`Checkpoint. Alice and Bob share $|\Phi^+\rangle=\tfrac1{\sqrt2}(|00\rangle+|11\rangle)$. Alice measures her qubit in the $Z$ basis; Bob has **not** been told her result. What is the probability distribution of Bob's own $Z$ measurement?`,
    hints: ['What is Bob\'s reduced state?', 'Compute $\\rho_B=\\mathrm{tr}_A|\\Phi^+\\rangle\\langle\\Phi^+|$ — it does not depend on what Alice does.', '$\\rho_B=I/2$.'],
    choices: [
      ['50/50 for 0 and 1 — whether or not Alice measured', 'Correct: Bob\'s marginal is $\\rho_B=I/2$ regardless of what Alice does, so Alice cannot send a message this way.', true],
      ['Always equal to Alice\'s result, so Bob gets a message from her', 'The outcomes are perfectly *correlated*, but Bob only sees that correlation after comparing records over an ordinary channel. By himself he sees fair coin flips.', false, 'correlation-as-signalling'],
      ['Deterministic as soon as Alice measures', 'Bob\'s statistics are the same before and after Alice\'s measurement; only the joint statistics show correlation.', false, 'correlation-as-signalling'],
      ['Bob\'s qubit stays in the entangled state $|\\Phi^+\\rangle$', 'An entangled state belongs to the *pair*; Bob\'s qubit alone is described by the mixed state $I/2$.'],
    ],
    fb: { correct: 'No-signalling: local operations on one half cannot change the reduced state of the other half.', incorrect: 'Compute Bob\'s reduced state.', solutionSteps: ['$|\\Phi^+\\rangle\\langle\\Phi^+|=\\tfrac12\\sum_{ij\\in\\{0,1\\}}|ii\\rangle\\langle jj|$.', 'Trace out A: $\\rho_B=\\tfrac12(|0\\rangle\\langle0|+|1\\rangle\\langle1|)=I/2$.', 'Alice\'s measurement (unread) maps the joint state to a mixture that still has $\\rho_B=I/2$.'], followUp: 'What extra information would Bob need to see the correlations?' } }),
  circuit({ id: 'b4-p1', owner: L, role: 'practice', diff: 2, objs: ['B4.1'], tags: ['bell-state'], n: 2, gates: ['H', 'X', 'Z', 'CNOT'], max: 2,
    target: [[r, 0], [0, 0], [0, 0], [r, 0]], label: '|Φ+⟩ = (|00⟩ + |11⟩)/√2', solution: [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }],
    prompt: md`Starting from $|00\rangle$, prepare $|\Phi^+\rangle=\tfrac1{\sqrt2}(|00\rangle+|11\rangle)$ with at most 2 gates. (CNOT: control first, target second.)`,
    hints: ['You need superposition first, then correlation.', 'Put qubit 0 into $|+\\rangle$, then conditionally flip qubit 1.', 'H on qubit 0, then CNOT with control 0 and target 1.'],
    fb: { correct: '$H$ makes $\\tfrac1{\\sqrt2}(|0\\rangle+|1\\rangle)|0\\rangle$; CNOT copies the computational value into qubit 1 *coherently*, producing the Bell state.', incorrect: 'Track the two-qubit state after each gate.', solutionSteps: ['$H_0|00\\rangle=\\tfrac1{\\sqrt2}(|00\\rangle+|10\\rangle)$.', 'CNOT$_{0\\to1}$: $|10\\rangle\\to|11\\rangle$, giving $\\tfrac1{\\sqrt2}(|00\\rangle+|11\\rangle)$.'] } }),
  circuit({ id: 'b4-p2', owner: L, role: 'practice', diff: 3, objs: ['B4.1'], tags: ['bell-state', 'relative-phase'], n: 2, gates: ['H', 'X', 'Z', 'CNOT'], max: 4,
    target: [[0, 0], [r, 0], [-r, 0], [0, 0]], label: '|Ψ−⟩ = (|01⟩ − |10⟩)/√2', solution: [{ gate: 'X', targets: [0] }, { gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }, { gate: 'X', targets: [1] }],
    prompt: md`Prepare the singlet $|\Psi^-\rangle=\tfrac1{\sqrt2}(|01\rangle-|10\rangle)$ from $|00\rangle$ using at most 4 gates.`,
    hints: ['Start from a circuit that produces a Bell state with a minus sign.', 'Putting qubit 0 into $|-\\rangle$ ($X$ then $H$) gives the minus sign; then CNOT.', 'X on qubit 0, H on qubit 0, CNOT(0→1), X on qubit 1.'],
    fb: { correct: 'The singlet is the spin-0 combination of two spin-1/2 particles — rotation-invariant, which is why it appears throughout atomic and nuclear physics.', incorrect: 'Check both the amplitudes and the relative sign.', solutionSteps: ['$X_0|00\\rangle=|10\\rangle$.', '$H_0|10\\rangle=\\tfrac1{\\sqrt2}(|00\\rangle-|10\\rangle)$.', 'CNOT$_{0\\to1}$: $\\tfrac1{\\sqrt2}(|00\\rangle-|11\\rangle)$.', '$X_1$: $\\tfrac1{\\sqrt2}(|01\\rangle-|10\\rangle)$.'] } }),
  numeric({ id: 'b4-p3', owner: L, role: 'practice', diff: 2, objs: ['B4.2'], tags: ['entanglement-entropy', 'schmidt'], value: 0.811, tol: 0.002,
    prompt: md`Compute the entanglement entropy (in bits) of $|\psi\rangle=\tfrac{\sqrt3}2|00\rangle+\tfrac12|11\rangle$ across the cut qubit 0 | qubit 1.`,
    hints: ['This state is already in Schmidt form: the Schmidt coefficients are $\\sqrt3/2$ and $1/2$.', 'The entropy uses their *squares*: $p_1=3/4$, $p_2=1/4$.', '$S=-p_1\\log_2p_1-p_2\\log_2p_2$.'],
    wrong: [[1, 'That is the maximum for a Bell state ($p=1/2,1/2$). Here the weights are $3/4$ and $1/4$.'], [0.75, 'That is the larger weight $p_1$, not the entropy.']],
    fb: { correct: '$S=-\\tfrac34\\log_2\\tfrac34-\\tfrac14\\log_2\\tfrac14\\approx0.311+0.5=0.811$ bits.', incorrect: 'Use the squared Schmidt coefficients as probabilities.', solutionSteps: ['Schmidt probabilities: $3/4$ and $1/4$.', '$S=0.75\\times0.415+0.25\\times2=0.311+0.5=0.811$ bits.'] } }),
  numeric({ id: 'b4-p4', owner: L, role: 'practice', diff: 2, objs: ['B4.4'], tags: ['chsh', 'bell-state'], value: 2.828, tol: 0.005,
    prompt: md`The CHSH quantity $S=\langle a_0b_0\rangle+\langle a_0b_1\rangle+\langle a_1b_0\rangle-\langle a_1b_1\rangle$ obeys $|S|\le2$ for any local hidden-variable model. What is the maximum $|S|$ that quantum mechanics allows (Tsirelson's bound)?`,
    hints: ['It is larger than 2 but well below the algebraic maximum 4.', 'It involves $\\sqrt2$.', '$2\\sqrt2$.'],
    wrong: [[2, 'That is the *classical* local-hidden-variable bound. Quantum mechanics exceeds it.'], [4, 'That is the algebraic maximum (all four correlators $\\pm1$ simultaneously), not achievable even by quantum mechanics.']],
    fb: { correct: '$2\\sqrt2\\approx2.828$. Experiments report values above 2, ruling out local hidden-variable models (with loophole-closing details beyond this course).', incorrect: 'Recall the quantum bound.', solutionSteps: ['Classical bound: $|S|\\le2$.', 'Quantum bound (Tsirelson): $|S|\\le2\\sqrt2$.', 'Reached by $|\\Phi^+\\rangle$ with $a_0=Z$, $a_1=X$, $b_{0,1}=(Z\\pm X)/\\sqrt2$.'] } }),
  mcq({ id: 'b4-p5', owner: L, role: 'practice', diff: 3, objs: ['B4.2'], tags: ['product-vs-entangled', 'schmidt'],
    prompt: md`Which of these two-qubit states is **entangled**? (Use $ad-bc$ for amplitudes $a,b,c,d$ of $|00\rangle,|01\rangle,|10\rangle,|11\rangle$.)`,
    hints: ['Compute $ad-bc$ for each option.', 'A product state has $ad-bc=0$.'],
    choices: [[md`$\tfrac12(|00\rangle+i|01\rangle+|10\rangle+i|11\rangle)$`, 'Here $a=\\tfrac12,b=\\tfrac i2,c=\\tfrac12,d=\\tfrac i2$: $ad-bc=\\tfrac i4-\\tfrac i4=0$. It equals $|{+}\\rangle\\otimes|{+i}\\rangle$ — a product.', false, 'checks-nothing'], [md`$\tfrac12(|00\rangle+|01\rangle+|10\rangle-|11\rangle)$`, 'Correct: $ad-bc=\\tfrac14(-1-1)=-\\tfrac12\\ne0$. This is entangled (it equals $\\mathrm{CZ}|{+}{+}\\rangle$).', true], [md`$\tfrac12(|00\rangle-|01\rangle-|10\rangle+|11\rangle)$`, '$a=d=\\tfrac12,b=c=-\\tfrac12$: $ad-bc=\\tfrac14-\\tfrac14=0$. It equals $|{-}\\rangle\\otimes|{-}\\rangle$ — a product.', false, 'checks-nothing'], [md`$|10\rangle$`, 'A computational basis state is a product state.']],
    fb: { correct: 'Determinant of the coefficient matrix detects entanglement for two-qubit pure states.', incorrect: 'Compute $ad-bc$ for each candidate.', solutionSteps: ['Option A: $ad-bc=0$ (product).', 'Option B: $ad-bc=-\\tfrac12$ (entangled).', 'Option C: $ad-bc=0$ (product).', 'Option D: product.'] } }),
  explain({ id: 'b4-p6', owner: L, role: 'practice', diff: 3, objs: ['B4.3'], tags: ['no-signalling'],
    prompt: 'Explain why Alice cannot use a shared Bell pair to send Bob a message faster than light, even though her measurement result is perfectly correlated with his.',
    rubric: [md`Bob's reduced state is $\rho_B=I/2$ (his outcomes are 50/50) independent of Alice's choice of measurement or whether she measures.`, 'The correlation only shows up when the two records are compared, which needs an ordinary (light-speed-limited) channel.', 'Alice cannot choose her *outcome* — only her measurement setting — so she cannot encode a bit into Bob\'s statistics.'],
    min: 2, model: md`Tracing out Alice's qubit gives $\rho_B=I/2$ whatever local operation Alice performs, so Bob's statistics are identical in every case and carry no message. The perfect correlation between outcomes is only visible after both parties compare records through a classical channel. Moreover Alice's outcome is random: she picks the setting, not the result.`,
    patterns: [['(entangle|bell).{0,60}(send|transmit|communicat|signal).{0,40}(faster|instant|superluminal)', 'Be careful: that is exactly what *cannot* be done. Rephrase your answer in terms of what Bob can observe locally (his reduced state).']],
    hints: ['What does Bob see if he never hears from Alice?', 'Compute $\\rho_B$ before and after Alice acts.'],
    fb: { correct: 'Correct reasoning pattern: always ask what is invariant for the receiving party.', incorrect: 'Focus on Bob\'s local description.', solutionSteps: ['$\\rho_B=\\mathrm{tr}_A\\rho_{AB}$ is unchanged by any operation on A alone.', 'Bob\'s statistics are therefore independent of Alice\'s action.', 'Correlations are visible only in the *joint* record.'] } }),
  mcq({ id: 'b4-exit', owner: L, role: 'exit', diff: 2, objs: ['B4.2', 'B4.3'], tags: ['bell-state', 'entanglement-entropy'],
    prompt: md`Exit check. For the Bell state $|\Phi^+\rangle$, which description of qubit A alone is correct?`,
    hints: ['Compute $\\rho_A$ by partial trace.', 'Is $\\rho_A$ pure or mixed?'],
    choices: [[md`Maximally mixed: $\rho_A=I/2$, entropy $1$ bit.`, 'Correct. The joint state is pure, yet each half is maximally mixed — all information is in the correlations.', true], [md`A pure state, either $|0\rangle$ or $|1\rangle$, we just don't know which.`, 'That ignorance story cannot reproduce the $X$-basis correlations $\\langle XX\\rangle=1$ of the pair.', false, 'ignorance-interpretation'], [md`The pure state $|{+}\rangle$.`, 'A pure state would make the pair a product state.'], [md`Qubit A has no state at all.`, 'It has a perfectly good one — a density operator.']],
    fb: { correct: 'Pure whole, mixed parts: the signature of entanglement.', incorrect: 'Trace out qubit B.', solutionSteps: ['$\\rho_A=\\mathrm{tr}_B|\\Phi^+\\rangle\\langle\\Phi^+|=I/2$.', 'Eigenvalues $\\tfrac12,\\tfrac12$: entropy $1$ bit.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'B4', kind: 'standard', title: 'Entanglement, Bell states and correlations', estimatedMinutes: 50,
  question: 'How can two qubits be in a perfectly definite joint state while neither has a definite state alone — and why does that not allow signalling?',
  objectives: ['B4.1', 'B4.2', 'B4.3', 'B4.4'], prerequisiteLessonIds: ['b3-gates', 'a2-tensor-products'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
When a spin-0 system decays into two spin-1/2 particles, conservation of angular momentum forces the pair into the spin **singlet** $\tfrac1{\sqrt2}(|{\uparrow\downarrow}\rangle-|{\downarrow\uparrow}\rangle)$. Measuring either spin alone gives random outcomes, yet joint outcomes along any common axis are perfectly anticorrelated. This is entanglement in its original physical setting.` },
    { id: 'core', kind: 'explanation', title: 'Bell states and the circuit that makes them', body: md`
$$|\Phi^\pm\rangle=\tfrac{|00\rangle\pm|11\rangle}{\sqrt2},\qquad|\Psi^\pm\rangle=\tfrac{|01\rangle\pm|10\rangle}{\sqrt2}.$$
The circuit $H$ on qubit 0 followed by CNOT (control 0, target 1) maps $|00\rangle\mapsto|\Phi^+\rangle$. For $|\Phi^+\rangle$: $\langle ZZ\rangle=\langle XX\rangle=+1$, $\langle YY\rangle=-1$, but every single-qubit expectation $\langle Z\otimes I\rangle=\langle X\otimes I\rangle=\langle Y\otimes I\rangle=0$.

**Schmidt decomposition.** Any bipartite pure state can be written $|\psi\rangle=\sum_is_i|a_i\rangle|b_i\rangle$ with $s_i\ge0$, $\sum s_i^2=1$. The number of non-zero $s_i$ is the Schmidt rank: rank 1 $\Leftrightarrow$ product. The reduced state is $\rho_A=\sum_is_i^2|a_i\rangle\langle a_i|$ and the **entanglement entropy** is $S=-\sum_is_i^2\log_2s_i^2$ (0 for product, 1 bit for a Bell pair).` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example: why the local outcomes are random', body: md`
Write $\rho=|\Phi^+\rangle\langle\Phi^+|=\tfrac12(|00\rangle\langle00|+|00\rangle\langle11|+|11\rangle\langle00|+|11\rangle\langle11|)$. Tracing out qubit B keeps only terms where B's bra and ket agree: $\rho_A=\tfrac12(|0\rangle\langle0|+|1\rangle\langle1|)=I/2$.

**Interpretation.** A's marginal is a fair coin for *any* measurement basis, because $I/2$ is basis-independent. The correlations live in the off-diagonal terms $|00\rangle\langle11|$ that the partial trace discarded.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'Test your understanding of what Bob sees.', activityId: 'b4-cp1' },
    { id: 'bell', kind: 'interpretation', title: 'Introductory Bell / CHSH', body: md`
Take four settings: Alice measures $a_0=Z$ or $a_1=X$; Bob measures $b_0=(Z+X)/\sqrt2$ or $b_1=(Z-X)/\sqrt2$. For $|\Phi^+\rangle$ each of $\langle a_0b_0\rangle,\langle a_0b_1\rangle,\langle a_1b_0\rangle$ equals $+1/\sqrt2$ and $\langle a_1b_1\rangle=-1/\sqrt2$, so
$$S=\langle a_0b_0\rangle+\langle a_0b_1\rangle+\langle a_1b_0\rangle-\langle a_1b_1\rangle=2\sqrt2\approx2.83.$$
Any local hidden-variable model satisfies $|S|\le2$ (Clauser, Horne, Shimony, Holt 1969). The Bell lab computes $S$ for the state you build. This is a statement about *correlations in the data*, not about faster-than-light influence; Bell tests also depend on experimental loopholes that this course does not cover.` },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Entanglement allows faster-than-light signalling."** No: Bob's marginal never changes.
- **"Entanglement is just a shared classical secret."** A shared coin cannot produce $\langle XX\rangle=+1$ together with $\langle ZZ\rangle=+1$ and violate CHSH.
- **"Quantum parallelism gives access to all branches."** Entanglement is a resource for correlations, not a way to read out exponentially many answers.` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: why the Schmidt decomposition exists', collapsed: true, body: md`
Write $|\psi\rangle=\sum_{ij}C_{ij}|i\rangle|j\rangle$ and take the singular value decomposition $C=U\Sigma V^\dagger$. Then $|a_k\rangle=\sum_iU_{ik}|i\rangle$, $|b_k\rangle=\sum_j V^*_{jk}|j\rangle$ and $s_k=\Sigma_{kk}$. Hence the Schmidt coefficients are the singular values of the coefficient matrix.` },
    { id: 'ext', kind: 'extension', title: 'Extension', collapsed: true, body: md`
Compute the entropy of entanglement across the middle cut of a 4-spin ground state later in D4, and compare it with the area-law behaviour expected for gapped one-dimensional systems.` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['bell-state', 'schmidt', 'entanglement-entropy', 'no-signalling', 'chsh', 'product-vs-entangled'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (2010), Sections 1.3.6, 2.2.8 and 2.5.', kind: 'textbook', note: 'Bell states, EPR and Bell inequality, Schmidt decomposition; verify numbering.' },
    { citation: 'Bell, J. S., On the Einstein Podolsky Rosen paradox, Physics 1, 195 (1964).', kind: 'paper' },
    { citation: 'Clauser, J. F., Horne, M. A., Shimony, A. & Holt, R. A., Proposed experiment to test local hidden-variable theories, Phys. Rev. Lett. 23, 880 (1969).', kind: 'paper', note: 'Original CHSH inequality; verify details before citing.' },
  ],
};
