import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, match } from '../helpers';

const L = 'b5-density';
export const activities = [
  mcq({ id: 'b5-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['B5.1'], tags: ['mixed-vs-superposition', 'purity'],
    prompt: md`Checkpoint. Compare $\rho_1=\tfrac12(|0\rangle\langle0|+|1\rangle\langle1|)$ with $\rho_2=|{+}\rangle\langle{+}|$. Which statement is correct?`,
    hints: ['Compute $\\mathrm{tr}\\rho^2$ for each.', 'Compare the predictions for a $Z$ measurement and for an $X$ measurement.', '$\\rho_1=I/2$ gives $50/50$ for every basis; $\\rho_2$ gives a certain $X=+$.'],
    choices: [
      [md`$\rho_1$ is mixed ($\mathrm{tr}\rho_1^2=\tfrac12$), $\rho_2$ is pure; both give $50/50$ for $Z$ but differ for $X$.`, 'Correct. The superposition $|+\\rangle$ keeps coherence (off-diagonal terms); the mixture does not.', true],
      [md`They are the same state because both give $50/50$ for $Z$.`, '$Z$ statistics do not fix the state. Measure $X$: $\\rho_2$ gives $+$ with certainty, $\\rho_1$ is $50/50$.', false, 'superposition-is-mixture'],
      [md`$\rho_2$ is mixed because it is a superposition.`, 'A superposition of basis states can be perfectly pure; mixedness means *classical uncertainty* about which pure state was prepared (or entanglement with something else).', false, 'superposition-is-mixture'],
      [md`$\rho_1$ is pure because it is diagonal.`, 'Diagonal does not mean pure: $\\mathrm{tr}\\rho_1^2=\\tfrac14+\\tfrac14=\\tfrac12<1$.'],
    ],
    fb: { correct: 'Pure superposition and statistical mixture are different physical situations with different predictions.', incorrect: 'Compute purity and compare the $X$-basis predictions.', solutionSteps: ['$\\mathrm{tr}\\rho_1^2=(\\tfrac12)^2+(\\tfrac12)^2=\\tfrac12$; $\\mathrm{tr}\\rho_2^2=1$.', '$X$ measurement: $\\rho_2\\to$ certain $+$; $\\rho_1\\to50/50$.'], followUp: 'Can you find two different ensembles that give the *same* $\\rho_1$?' } }),
  numeric({ id: 'b5-p1', owner: L, role: 'practice', diff: 1, objs: ['B5.1'], tags: ['purity'], value: 0.82, tol: 1e-4,
    prompt: md`A qubit is in the mixed state $\rho=\mathrm{diag}(0.9,\,0.1)$. Compute the purity $\mathrm{tr}\rho^2$.`,
    hints: ['Square the matrix and take the trace.', 'For a diagonal matrix, sum the squared diagonal entries.'],
    wrong: [[1, 'Purity 1 means a pure state; here two outcomes have non-zero probability.'], [0.9, 'That is the largest eigenvalue, not $\\sum\\lambda_k^2$.']],
    fb: { correct: '$0.81+0.01=0.82$. Purity ranges from $1/d=0.5$ (maximally mixed) to $1$ (pure).', incorrect: 'Compute $\\sum_k\\lambda_k^2$.', solutionSteps: ['$\\mathrm{tr}\\rho^2=0.9^2+0.1^2=0.81+0.01=0.82$.'] } }),
  numeric({ id: 'b5-p2', owner: L, role: 'practice', diff: 2, objs: ['B5.1'], tags: ['density-operator', 'bloch-sphere'], value: 0.7071, tol: 0.002,
    prompt: md`For $\rho=\begin{pmatrix}3/4&1/4\\1/4&1/4\end{pmatrix}=\tfrac12(I+\vec r\cdot\vec\sigma)$, find the length $|\vec r|$ of the Bloch vector.`,
    hints: ['$\\rho_{00}-\\rho_{11}=r_z$ and $2\\mathrm{Re}\\,\\rho_{01}=r_x$, $-2\\mathrm{Im}\\,\\rho_{01}=r_y$.', '$r_z=1/2$, $r_x=1/2$, $r_y=0$.', '$|\\vec r|=\\sqrt{1/4+1/4}$.'],
    wrong: [[0.5, 'That is $r_z$ or $r_x$ alone; you need the full length.'], [1, 'Length 1 would mean a pure state, but $\\mathrm{tr}\\rho^2=3/4<1$.']],
    fb: { correct: '$|\\vec r|=1/\\sqrt2\\approx0.707<1$: inside the ball, mixed. Purity $=(1+|\\vec r|^2)/2=3/4$.', incorrect: 'Extract $r_x,r_y,r_z$ from the matrix entries.', solutionSteps: ['$r_z=\\rho_{00}-\\rho_{11}=\\tfrac12$.', '$r_x=2\\mathrm{Re}\\rho_{01}=\\tfrac12$, $r_y=-2\\mathrm{Im}\\rho_{01}=0$.', '$|\\vec r|=\\sqrt{\\tfrac14+\\tfrac14}=0.7071$.'] } }),
  numeric({ id: 'b5-p3', owner: L, role: 'practice', diff: 2, objs: ['B5.3'], tags: ['von-neumann-entropy'], value: 1.75, tol: 0.001,
    prompt: md`A two-qubit register is prepared in one of four orthogonal states with probabilities $\tfrac12,\tfrac14,\tfrac18,\tfrac18$. Compute the von Neumann entropy $S(\rho)$ in bits.`,
    hints: ['The eigenvalues of $\\rho$ are the probabilities.', '$S=-\\sum\\lambda\\log_2\\lambda$.', '$\\tfrac12\\cdot1+\\tfrac14\\cdot2+\\tfrac18\\cdot3+\\tfrac18\\cdot3$.'],
    wrong: [[2, 'That is $\\log_2 4$, the maximum entropy for four equally likely states. Our distribution is not uniform.'], [1.5, 'Check the $\\tfrac18\\log_2\\tfrac18=\\tfrac38$ terms: there are two of them.']],
    fb: { correct: '$S=0.5+0.5+0.375+0.375=1.75$ bits, equal to the Shannon entropy of the distribution because $\\rho$ is diagonal in the orthogonal basis.', incorrect: 'Evaluate $-\\sum\\lambda\\log_2\\lambda$ term by term.', solutionSteps: ['$-\\tfrac12\\log_2\\tfrac12=0.5$.', '$-\\tfrac14\\log_2\\tfrac14=0.5$.', '$-\\tfrac18\\log_2\\tfrac18=0.375$ (twice).', 'Sum $=1.75$ bits.'] } }),
  numeric({ id: 'b5-p4', owner: L, role: 'practice', diff: 2, objs: ['B5.2'], tags: ['partial-trace', 'purity'], value: 0.625, tol: 1e-3,
    prompt: md`For $|\psi\rangle=\tfrac{\sqrt3}2|00\rangle+\tfrac12|11\rangle$, compute the purity of the reduced state of qubit 0.`,
    hints: ['Trace out qubit 1: only terms with equal qubit-1 labels survive.', '$\\rho_A=\\tfrac34|0\\rangle\\langle0|+\\tfrac14|1\\rangle\\langle1|$.'],
    wrong: [[1, 'Purity 1 would mean no entanglement. This state has Schmidt rank 2.'], [0.75, 'You took the largest weight; purity is the sum of *squared* weights: $\\tfrac9{16}+\\tfrac1{16}$.']],
    fb: { correct: '$\\mathrm{tr}\\rho_A^2=\\tfrac9{16}+\\tfrac1{16}=\\tfrac58=0.625$.', incorrect: 'First find $\\rho_A$, then square and trace.', solutionSteps: ['$\\rho_A=\\tfrac34|0\\rangle\\langle0|+\\tfrac14|1\\rangle\\langle1|$.', '$\\mathrm{tr}\\rho_A^2=\\tfrac9{16}+\\tfrac1{16}=\\tfrac58$.'] } }),
  match({ id: 'b5-p5', owner: L, role: 'practice', diff: 1, objs: ['B5.1', 'B5.2'], tags: ['density-operator', 'purity'],
    prompt: 'Match each concept with its expression.',
    pairs: [['Pure state', md`$\mathrm{tr}\,\rho^2=1$`], ['Maximally mixed qubit', md`$\rho=I/2$`], ['Expectation value of $A$', md`$\langle A\rangle=\mathrm{tr}(A\rho)$`], ['Valid density operator', md`$\rho\ge0,\ \mathrm{tr}\rho=1$`], ['Reduced state of A', md`$\rho_A=\mathrm{tr}_B\,\rho_{AB}$`]],
    hints: ['A pure state has a single non-zero eigenvalue.', 'Trace the whole expression for the expectation value.'],
    fb: { correct: 'Those five expressions are the toolkit for the rest of Track B.', incorrect: 'Re-read the definitions.', solutionSteps: ['Pure: purity 1.', 'Maximally mixed qubit: $I/2$.', 'Expectation: trace with $A$.', 'Valid $\\rho$: positive, unit trace.', 'Reduced state: partial trace.'] } }),
  mcq({ id: 'b5-p6', owner: L, role: 'practice', diff: 2, objs: ['B5.1'], tags: ['density-operator', 'mixed-vs-superposition'],
    prompt: md`Are $\tfrac12\big(|0\rangle\langle0|+|1\rangle\langle1|\big)$ and $\tfrac12\big(|{+}\rangle\langle{+}|+|{-}\rangle\langle{-}|\big)$ the same density operator?`,
    hints: ['Add up the matrices explicitly.', '$|+\\rangle\\langle+|+|-\\rangle\\langle-|=I$.'],
    choices: [['Yes: both equal $I/2$', 'Correct. Different *ensembles* can give the same density operator; only $\\rho$ is physically meaningful.', true], ['No: they are built from different states', 'The preparation recipes differ but all predictions depend only on $\\rho$, which is identical.', false, 'ensemble-unique'], ['No: one has $Z$ eigenstates, the other $X$ eigenstates', 'That is the recipe, not the operator. Both give $50/50$ in every basis.', false, 'ensemble-unique'], ['Only for $Z$ measurements', 'They also agree for every other measurement.']],
    fb: { correct: 'No experiment can tell which ensemble was used — a useful fact in the no-signalling argument.', incorrect: 'Compute both matrices.', solutionSteps: ['$|0\\rangle\\langle0|+|1\\rangle\\langle1|=I$.', '$|+\\rangle\\langle+|+|-\\rangle\\langle-|=I$.', 'Both $\\Rightarrow\\rho=I/2$.'] } }),
  mcq({ id: 'b5-exit', owner: L, role: 'exit', diff: 2, objs: ['B5.2', 'B5.3'], tags: ['partial-trace', 'von-neumann-entropy'],
    prompt: md`Exit check. Qubit A is one half of $|\Phi^+\rangle$, so $\rho_A=I/2$ with entropy $1$ bit. What does this mixedness reflect?`,
    hints: ['The joint state is pure. Where is the missing information?', 'Entropy of a subsystem of a pure state measures entanglement.'],
    choices: [['Entanglement with B: the joint state is pure and the information is in correlations', 'Correct: for a pure joint state, $S(\\rho_A)=S(\\rho_B)$ measures entanglement.', true], ['Classical ignorance of how A was prepared', 'The preparation was perfectly known and pure; the mixedness arises from tracing out B.', false, 'ignorance-interpretation'], ['Noise in the lab', 'The calculation assumed an ideal pure joint state with no noise.'], ['A bug in the partial trace', 'The result is correct.']],
    fb: { correct: 'Mixedness can come from classical uncertainty or from entanglement with an inaccessible system.', incorrect: 'Think about what the whole system\'s state is.', solutionSteps: ['Whole state: pure, $S=0$.', 'Subsystem: $S(\\rho_A)=1$ bit.', 'The difference is stored in A–B correlations.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'B5', kind: 'standard', title: 'Density operators and mixed states', estimatedMinutes: 50,
  question: 'How do we describe a qubit when we have classical uncertainty about its preparation — or when it is entangled with something we cannot access?',
  objectives: ['B5.1', 'B5.2', 'B5.3'], prerequisiteLessonIds: ['b4-entanglement'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
A polarised nuclear target is never perfectly polarised; a detector sees only part of an entangled system. State vectors cannot represent either situation. Density operators can: they are the language of statistical ensembles *and* of subsystems.` },
    { id: 'core', kind: 'explanation', title: 'Density operators', body: md`
An ensemble that is $|\psi_i\rangle$ with probability $p_i$ has
$$\rho=\sum_ip_i|\psi_i\rangle\langle\psi_i|,\qquad\rho=\rho^\dagger,\ \rho\ge0,\ \mathrm{tr}\rho=1.$$
Expectation values: $\langle A\rangle=\mathrm{tr}(A\rho)$. Purity: $\mathrm{tr}\rho^2\in[1/d,1]$, equal to $1$ iff pure. For a qubit $\rho=\tfrac12(I+\vec r\cdot\vec\sigma)$ with $|\vec r|\le1$ and $\mathrm{tr}\rho^2=(1+|\vec r|^2)/2$; mixed states are *inside* the Bloch ball. The **von Neumann entropy** is $S(\rho)=-\mathrm{tr}\rho\log_2\rho=-\sum_k\lambda_k\log_2\lambda_k$ bits.

Different ensembles can give the same $\rho$ (for example $I/2$), so only $\rho$ is physical. The **reduced state** of a subsystem is $\rho_A=\mathrm{tr}_B\rho_{AB}$.` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example', body: md`
Prepare $|0\rangle$ with probability $\tfrac12$ and $|{+}\rangle$ with probability $\tfrac12$: $\rho=\tfrac12|0\rangle\langle0|+\tfrac12|{+}\rangle\langle{+}|=\begin{pmatrix}3/4&1/4\\1/4&1/4\end{pmatrix}$. Then $\vec r=(\tfrac12,0,\tfrac12)$, $|\vec r|=1/\sqrt2$, purity $3/4$, eigenvalues $\tfrac12(1\pm1/\sqrt2)\approx0.854,\,0.146$ and $S\approx0.60$ bits.

**Interpretation.** The two preparations are not orthogonal, so the entropy is *less* than the 1 bit of the classical coin flip: non-orthogonal states are partly indistinguishable, so the mixture is less uncertain than the ensemble's label.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'Mixture or superposition?', activityId: 'b5-cp1' },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Superposition and mixture are the same."** They differ in the off-diagonal terms (coherence).
- **"A mixed state means the qubit secretly is in one pure state."** For ensembles prepared classically, that is a fair description; for a *subsystem of an entangled state* it is not.
- **"The ensemble is part of the state."** Only $\rho$ matters.` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: purification', collapsed: true, body: md`
Every mixed state $\rho_A=\sum_k\lambda_k|k\rangle\langle k|$ is the reduced state of a pure state $|\Psi\rangle_{AB}=\sum_k\sqrt{\lambda_k}|k\rangle|k\rangle$. Mixedness can always be viewed as entanglement with an unobserved system — this is the bridge to quantum channels in B6.` },
    { id: 'ext', kind: 'extension', title: 'Extension', collapsed: true, body: md`
Show that $S(\rho_A)=S(\rho_B)$ for any pure $|\Psi\rangle_{AB}$ (the two reduced states share non-zero eigenvalues, from the Schmidt decomposition).` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['density-operator', 'purity', 'mixed-vs-superposition', 'partial-trace', 'von-neumann-entropy'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (2010), Sections 2.4 and 11.3.', kind: 'textbook', note: 'Density operator and von Neumann entropy; verify numbering.' },
    { citation: 'Preskill, J., Lecture Notes for Physics 219, Chapter 2.', kind: 'lecture-notes', url: 'http://theory.caltech.edu/~preskill/ph229/' },
  ],
};
