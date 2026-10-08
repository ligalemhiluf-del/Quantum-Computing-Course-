import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, explain, order } from '../helpers';

const L = 'b2-measurement';
export const activities = [
  mcq({ id: 'b2-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['B2.1', 'B2.2'], tags: ['measurement-disturbance', 'born-rule'],
    prompt: md`Checkpoint. A qubit is prepared in $|{+}\rangle$. You measure $Z$ (and throw the result away), then measure $X$. What is the probability that the $X$ measurement returns $+$?`,
    hints: ['After a $Z$ measurement, what is the state?', 'The state is $|0\\rangle$ or $|1\\rangle$. What is $P(+)$ for each?', '$|\\langle+|0\\rangle|^2=|\\langle+|1\\rangle|^2=1/2$.'],
    choices: [
      ['0.5', 'Correct: the $Z$ measurement collapses to $|0\\rangle$ or $|1\\rangle$, each of which gives $+$ with probability $1/2$.', true],
      ['1', 'That would be right if you did *not* measure $Z$ first ($|+\\rangle$ is an $X$ eigenstate). The intermediate measurement disturbed the state.', false, 'ignores-disturbance'],
      ['0.25', 'You multiplied $0.5\\times0.5$ as if the two measurements were independent events; after collapse the state is definite, and the second step gives $0.5$ regardless of the first outcome.', false, 'multiply-probabilities'],
      ['0', 'There is no reason for $X=+$ to be excluded; $|0\\rangle$ has equal overlap with $|\\pm\\rangle$.'],
    ],
    fb: { correct: 'Measuring $Z$ destroyed the information about $X$: the observables do not commute.', incorrect: 'Track the state after each measurement.', solutionSteps: ['$Z$ measurement: outcome 0 with prob $\\tfrac12$ leaves $|0\\rangle$; outcome 1 leaves $|1\\rangle$.', '$P(+\\,|\\,0)=|\\langle+|0\\rangle|^2=\\tfrac12$ and $P(+\\,|\\,1)=\\tfrac12$.', 'Total $P(+)=\\tfrac12\\cdot\\tfrac12+\\tfrac12\\cdot\\tfrac12=\\tfrac12$.'], followUp: 'Which observable pair would let you read both without disturbing either?' } }),
  numeric({ id: 'b2-p1', owner: L, role: 'practice', diff: 2, objs: ['B2.1'], tags: ['born-rule', 'bloch-sphere'], value: 0.933, tol: 0.002,
    prompt: md`The state is $|\psi\rangle=\tfrac{\sqrt3}2|0\rangle+\tfrac12|1\rangle$. You measure in the $X$ basis $\{|{+}\rangle,|{-}\rangle\}$. What is $P(+)$?`,
    hints: ['$P(+)=|\\langle+|\\psi\\rangle|^2$.', '$\\langle+|\\psi\\rangle=\\tfrac1{\\sqrt2}(\\psi_0+\\psi_1)$.', '$\\tfrac12\\big(\\tfrac{\\sqrt3}2+\\tfrac12\\big)^2=\\tfrac{2+\\sqrt3}4$.'],
    wrong: [[0.75, 'That is the $Z$-basis probability $P(0)$. The question asks for the $X$ basis.'], [0.5, 'You may have assumed the state is on the equator; here $\\theta=60^\\circ$ so $\\langle X\\rangle=\\sin\\theta=0.866$.', 0.001]],
    fb: { correct: '$P(+)=(2+\\sqrt3)/4\\approx0.933$. Equivalent check: $P(+)=(1+\\langle X\\rangle)/2$ with $\\langle X\\rangle=\\sin60^\\circ=0.866$.', incorrect: 'Compute the amplitude $\\langle+|\\psi\\rangle$ first.', solutionSteps: ['$\\langle+|\\psi\\rangle=\\tfrac1{\\sqrt2}\\big(\\tfrac{\\sqrt3}2+\\tfrac12\\big)$.', '$|{\\cdot}|^2=\\tfrac12\\cdot\\tfrac{(\\sqrt3+1)^2}4=\\tfrac{4+2\\sqrt3}8=\\tfrac{2+\\sqrt3}4\\approx0.933$.'] } }),
  numeric({ id: 'b2-p2', owner: L, role: 'practice', diff: 1, objs: ['B2.3'], tags: ['expectation-value'], value: 0.6, tol: 1e-6,
    prompt: md`A qubit gives $0$ with probability $0.8$ and $1$ with probability $0.2$ in the $Z$ basis ($Z$ eigenvalues $+1$ for $|0\rangle$, $-1$ for $|1\rangle$). What is $\langle Z\rangle$?`,
    hints: ['Expectation = sum of outcome value times probability.', '$0.8\\cdot(+1)+0.2\\cdot(-1)$.'],
    wrong: [[0.8, 'That is $P(0)$. The expectation weights the eigenvalues $\\pm1$.']],
    fb: { correct: '$\\langle Z\\rangle=P(0)-P(1)=0.6$.', incorrect: 'Use the eigenvalues $\\pm1$ as the outcome values.', solutionSteps: ['$\\langle Z\\rangle=(+1)(0.8)+(-1)(0.2)=0.6$.'] } }),
  numeric({ id: 'b2-p3', owner: L, role: 'practice', diff: 2, objs: ['B2.3'], tags: ['sampling-error', 'expectation-value'], value: 2500, tol: 1, 
    prompt: md`You estimate $p=P(0)$ for a state with true $p=0.5$ from $N$ independent shots. The standard error is $\sqrt{p(1-p)/N}$. How many shots $N$ give a standard error of $0.01$?`,
    hints: ['Set $\\sqrt{p(1-p)/N}=0.01$ and solve for $N$.', '$p(1-p)=1/4$.'],
    wrong: [[10000, 'That is what you get if $p(1-p)=1$. For $p=0.5$, $p(1-p)=0.25$.', 1], [100, 'You used $1/\\sigma$; the dependence on shots is $1/\\sqrt N$, so $N\\propto 1/\\sigma^2$.', 1]],
    fb: { correct: '$N=p(1-p)/\\sigma^2=0.25/10^{-4}=2500$. Halving the error costs $4\\times$ more shots — the origin of measurement-cost worries for variational algorithms (C6).', incorrect: 'Solve $\\sigma^2=p(1-p)/N$ for $N$.', solutionSteps: ['$\\sigma^2=p(1-p)/N\\Rightarrow N=p(1-p)/\\sigma^2$.', '$N=0.25/(0.01)^2=2500$.'] } }),
  mcq({ id: 'b2-p4', owner: L, role: 'practice', diff: 1, objs: ['B2.2'], tags: ['measurement-disturbance'],
    prompt: md`You measure $Z$ on $|{+}\rangle$ and obtain $1$. You immediately measure $Z$ again on the same qubit. What do you get?`,
    hints: ['What state does a projective measurement leave behind?', 'After outcome $1$ the state is the projection onto $|1\\rangle$.'],
    choices: [['$1$ with certainty', 'Correct: the post-measurement state is $|1\\rangle$, and repeating the same measurement is deterministic.', true], ['$0$ or $1$ with probability $1/2$ each', 'That was the *first* measurement\'s statistics. The state has since collapsed.', false, 'forgets-collapse'], ['$0$ with certainty', 'Projective measurement leaves the state in the eigenspace of the outcome obtained.'], ['It depends on the apparatus', 'For an ideal projective measurement the repetition is certain.']],
    fb: { correct: 'Repeatability: ideal projective measurements give the same outcome when immediately repeated.', incorrect: 'Think about the post-measurement state.', solutionSteps: ['First outcome 1 $\\Rightarrow$ post-state $|1\\rangle$.', 'Second $Z$ measurement: $P(1)=|\\langle1|1\\rangle|^2=1$.'] } }),
  order({ id: 'b2-p5', owner: L, role: 'practice', diff: 2, objs: ['B2.1'], tags: ['born-rule'],
    prompt: 'Order the steps for finding an outcome probability and the post-measurement state.',
    items: ['Choose the measurement basis or projectors $P_m$.', md`Compute the amplitude $\langle b_m|\psi\rangle$ (or $P_m|\psi\rangle$).`, md`Outcome probability $p_m=|\langle b_m|\psi\rangle|^2=\langle\psi|P_m|\psi\rangle$.`, md`Post-measurement state $P_m|\psi\rangle/\sqrt{p_m}$ (renormalised).`],
    hints: ['You cannot normalise before you know the probability.', 'Start by deciding what is being measured.'],
    fb: { correct: 'The Born rule plus renormalised collapse is the entire measurement postulate for projective measurements.', incorrect: 'Ask what each step requires as input.', solutionSteps: ['Basis first.', 'Then amplitude.', 'Then probability.', 'Then renormalised post-state.'] } }),
  explain({ id: 'b2-p6', owner: L, role: 'practice', diff: 3, objs: ['B2.2'], tags: ['measurement-disturbance', 'born-rule'],
    prompt: md`A friend claims: "The qubit already had a definite value of $Z$; measurement just reveals it." Using $|{+}\rangle$ and the observables $Z$ and $X$, explain what is problematic about this claim — and be honest about what single-qubit statistics alone can and cannot rule out.`,
    rubric: [md`$|{+}\rangle$ gives random $Z$ outcomes ($50/50$) from identical preparations.`, md`$|{+}\rangle$ gives a *certain* $X$ outcome, but $Z$ and $X$ do not commute, so you cannot also have a definite $Z$ value that survives.`, 'Notes that a simple hidden-variable story for one qubit can be written down, so a sharper argument (Bell inequalities with entangled pairs) is needed.', 'Notes that measurement disturbs: a later measurement of a non-commuting observable is changed by the earlier one.'],
    min: 2, model: md`For $|{+}\rangle$, repeated $Z$ measurements give $0$ or $1$ with probability $1/2$ each, while $X$ gives $+$ with certainty. Since $[X,Z]\ne0$, no quantum state has definite values for both, and measuring $Z$ disturbs a subsequent $X$ measurement. Single-qubit statistics alone, however, can be reproduced by a simple hidden-variable model; the decisive evidence against local pre-existing values comes from correlations of entangled pairs (Bell's theorem, module B4).`,
    patterns: [['already (had|has) a definite', 'Test that against $|{+}\\rangle$: where would the definite $Z$ value come from if identical preparations give different outcomes — and what would it do to the certain $X$ outcome?']],
    hints: ['Compare the $Z$ statistics and the $X$ statistics of $|{+}\\rangle$.', 'Be careful: one qubit alone cannot refute every hidden-variable model.'],
    fb: { correct: 'Self-check recorded. Measurement outcomes are not generally readouts of pre-existing values — but the strongest argument needs entanglement (B4).', incorrect: 'Re-read the model answer and tick what you actually wrote.', solutionSteps: ['$Z$ on $|+\\rangle$: random.', '$X$ on $|+\\rangle$: certain.', 'Non-commuting observables: cannot both be sharp.', 'Honest caveat: the Bell-type argument is the decisive step.'] } }),
  mcq({ id: 'b2-exit', owner: L, role: 'exit', diff: 2, objs: ['B2.1', 'B2.2'], tags: ['born-rule'],
    prompt: md`Exit check. For $|\psi\rangle=\alpha|0\rangle+\beta|1\rangle$, which statement about a projective $Z$ measurement is correct?`,
    hints: ['Probabilities come from squared moduli.', 'What does "projective" imply about the state afterwards?'],
    choices: [[md`$P(0)=|\alpha|^2$ and the state becomes $|0\rangle$ if $0$ is observed.`, 'Correct: Born rule, then collapse onto the observed eigenstate.', true], [md`$P(0)=\alpha$ and the state stays $|\psi\rangle$.`, 'Amplitudes are not probabilities, and the state is not unchanged.', false, 'amplitude-as-probability'], [md`$P(0)=|\alpha|^2$ and the state stays $|\psi\rangle$.`, 'The probability is right, but a projective measurement leaves the state in the observed eigenstate.', false, 'forgets-collapse'], [md`The outcome is deterministic.`, 'Only when $\\alpha$ or $\\beta$ is zero.']],
    fb: { correct: 'Born rule + collapse.', incorrect: 'Recall both parts of the measurement postulate.', solutionSteps: ['$P(0)=|\\langle0|\\psi\\rangle|^2=|\\alpha|^2$.', 'Post-state: $|0\\rangle$.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'B2', kind: 'standard', title: 'Measurement and the Born rule', estimatedMinutes: 45,
  question: 'What does "measure the qubit" mean for a state like $|{+}\\rangle$, and how do repeated experiments reveal the state?',
  objectives: ['B2.1', 'B2.2', 'B2.3'], prerequisiteLessonIds: ['b1-qubits-bloch'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
In a Stern–Gerlach experiment each atom lands in one of two spots, even though the preparation was identical. The state does not *contain* the outcome; it contains probabilities. This lesson makes that precise and shows what you can learn from many repetitions.` },
    { id: 'core', kind: 'explanation', title: 'Projective measurement', body: md`
A measurement in an orthonormal basis $\{|b_m\rangle\}$ has projectors $P_m=|b_m\rangle\langle b_m|$. For a state $|\psi\rangle$:
$$p_m=\langle\psi|P_m|\psi\rangle=|\langle b_m|\psi\rangle|^2,\qquad|\psi\rangle\ \to\ \frac{P_m|\psi\rangle}{\sqrt{p_m}}.$$
An **observable** $A=\sum_ma_mP_m$ has expectation $\langle A\rangle=\sum_ma_mp_m=\langle\psi|A|\psi\rangle$. For a qubit, $\langle Z\rangle=P(0)-P(1)$, and a measurement of any Pauli component has $P(\pm)=(1\pm\langle\sigma\rangle)/2$.

**Repeated experiments.** One shot yields one outcome. To estimate $p$ you need many identically prepared copies; the estimate $\hat p=k/N$ has standard error $\sqrt{p(1-p)/N}$. You can never read the full state from a single copy.` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example: an arbitrary basis', body: md`
Let $|\psi\rangle=\cos\tfrac\pi8|0\rangle+\sin\tfrac\pi8|1\rangle$ and measure in the $X$ basis. Then $\langle+|\psi\rangle=\tfrac1{\sqrt2}(\cos\tfrac\pi8+\sin\tfrac\pi8)$, so
$$P(+)=\tfrac12\Big(1+\sin\tfrac\pi4\Big)=\tfrac12\Big(1+\tfrac1{\sqrt2}\Big)\approx0.854.$$
**Interpretation.** The same state has $P(0)=\cos^2\tfrac\pi8\approx0.854$ too — it lies halfway between $+z$ and $+x$ on the Bloch sphere, so the two probabilities coincide. Sanity check: $P(+)+P(-)=1$.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'Predict, then check.', activityId: 'b2-cp1' },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Measurement just reveals a pre-existing classical bit."** For $|{+}\rangle$, $Z$ outcomes are random yet $X$ is certain. A naive "hidden value" picture needs more care; Bell's theorem (B4) is the sharp tool.
- **"Amplitudes are probabilities."** Probabilities are *squared moduli*; amplitudes can interfere.
- **"Collapse is a unitary process."** Unitary maps are reversible and linear; projection is neither. (How to reconcile them is an interpretational debate; the postulates here are operationally complete.)` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: non-commuting observables', collapsed: true, body: md`
$[X,Z]=XZ-ZX=-2iY\ne0$. Two observables have a common eigenbasis iff they commute, so $X$ and $Z$ cannot both be sharp. The uncertainty relation $\Delta X\,\Delta Z\ge\tfrac12|\langle[X,Z]\rangle|=|\langle Y\rangle|$ quantifies the trade-off.` },
    { id: 'ext', kind: 'extension', title: 'Extension', collapsed: true, body: md`
Positive-operator-valued measures (POVMs) generalise projective measurements: $p_m=\mathrm{tr}(E_m\rho)$ with $E_m\ge0$, $\sum E_m=I$. They arise by coupling to an ancilla and measuring projectively. We return to this when we study noise.` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['born-rule', 'measurement-disturbance', 'expectation-value', 'sampling-error'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (2010), Section 2.2.3.', kind: 'textbook', note: 'Measurement postulate; verify numbering.' },
    { citation: 'Bell, J. S., On the Einstein Podolsky Rosen paradox, Physics 1, 195 (1964).', kind: 'paper', note: 'Pointer for the sharper argument in B4.' },
  ],
};
