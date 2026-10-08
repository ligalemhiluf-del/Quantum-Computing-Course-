import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric } from '../helpers';

const L = 'a0-diagnostic';
export const activities = [
  numeric({ id: 'a0-q1', owner: L, role: 'practice', diff: 1, objs: ['A0.1'], tags: ['complex-numbers'], value: 2, tol: 1e-6,
    prompt: md`Let $z = 1 + i$. Compute $|z|^2 = z^* z$.`,
    hints: ['The modulus squared of $a+bi$ is built from the real and imaginary parts separately.', 'Use $|z|^2 = a^2 + b^2$, not $(a+bi)^2$.'],
    wrong: [[0, 'You computed $1^2 + i^2 = 0$. The modulus uses $|{\\rm Im}\\, z|^2$, i.e. $1^2$, not $i^2$.'], [Math.SQRT2, 'That is $|z| = \\sqrt{2}$. The question asks for the square, $|z|^2$.', 0.001]],
    fb: { correct: 'Yes: $|1+i|^2 = 1^2 + 1^2 = 2$. Squared moduli of amplitudes are probabilities, so this operation appears constantly.', incorrect: 'Not quite. Write $z^* = 1 - i$ and multiply $z^* z$.', solutionSteps: ['$z^* = 1 - i$.', '$z^* z = (1-i)(1+i) = 1 + i - i - i^2 = 1 + 1 = 2$.'] } }),
  mcq({ id: 'a0-q2', owner: L, role: 'practice', diff: 1, objs: ['A0.2'], tags: ['matrix-vector'],
    prompt: md`Which column vector results from $X\begin{pmatrix}1\\0\end{pmatrix}$, where $X=\begin{pmatrix}0&1\\1&0\end{pmatrix}$?`,
    hints: ['Each output entry is a row of the matrix dotted with the vector.', 'Row 1 is $(0, 1)$, row 2 is $(1, 0)$.'],
    choices: [[md`$(1,0)^T$`, 'That would be the identity matrix acting on the vector. Check each row against the vector.', false, 'matrix-rows'], [md`$(0,1)^T$`, 'Correct: row 1 gives $0\\cdot 1+1\\cdot 0=0$, row 2 gives $1\\cdot1+0\\cdot0=1$. $X$ flips $|0\\rangle \\to |1\\rangle$.', true], [md`$(0,0)^T$`, 'The zero vector would mean the matrix annihilates the state; $X$ is invertible.'], [md`$(1,1)^T$`, 'You added the columns instead of selecting by the vector entries.']],
    fb: { correct: 'Matrix-vector products are the basic move for applying gates.', incorrect: 'Compute row-by-row: (row · vector).', solutionSteps: ['Row 1: $0\\cdot1 + 1\\cdot0 = 0$.', 'Row 2: $1\\cdot1 + 0\\cdot0 = 1$.', 'Result $(0,1)^T$.'] } }),
  numeric({ id: 'a0-q3', owner: L, role: 'practice', diff: 2, objs: ['A0.2', 'A0.3'], tags: ['inner-product', 'complex-numbers'], value: 0.5, tol: 1e-3,
    prompt: md`Let $|\phi\rangle = (1, 0)^T$ and $|\psi\rangle = \tfrac{1}{\sqrt2}(1, i)^T$. Compute $|\langle\phi|\psi\rangle|^2$.`,
    hints: ['$\\langle\\phi|\\psi\\rangle = \\sum_k \\phi_k^* \\psi_k$.', 'Only the first component of $\\phi$ is non-zero.', '$\\langle\\phi|\\psi\\rangle = 1/\\sqrt2$; now take the modulus squared.'],
    wrong: [[0.7071, 'That is the amplitude $\\langle\\phi|\\psi\\rangle=1/\\sqrt2$. A probability is its modulus squared.', 0.001]],
    fb: { correct: 'Right: the overlap is $1/\\sqrt2$ and the squared modulus is $1/2$ — the probability of finding $\\psi$ in state $\\phi$.', incorrect: 'Compute the inner product first, then square its modulus.', solutionSteps: ['$\\langle\\phi|\\psi\\rangle = 1\\cdot\\frac{1}{\\sqrt2} + 0\\cdot\\frac{i}{\\sqrt2}=\\frac1{\\sqrt2}$.', '$|1/\\sqrt2|^2 = 1/2$.'] } }),
  numeric({ id: 'a0-q4', owner: L, role: 'practice', diff: 1, objs: ['A0.3'], tags: ['complex-numbers'], value: 0.25, tol: 1e-6,
    prompt: 'Two fair coins are flipped independently. What is the probability that both land heads?',
    hints: ['"Independent" tells you how to combine the probabilities.', 'Multiply, do not add.'],
    wrong: [[0.5, 'That is the probability for a single coin. Both coins must land heads, so the two probabilities multiply.'], [1, 'Joint probabilities of independent events multiply, so the result is smaller than either factor.']],
    fb: { correct: '$P = \\tfrac12\\cdot\\tfrac12 = \\tfrac14$. Later, composite-system amplitudes multiply the same way: $|a\\rangle\\otimes|b\\rangle$.', incorrect: 'Independent events: P(A and B) = P(A)P(B).', solutionSteps: ['$P(\\text{H}_1\\text{ and }\\text{H}_2)=P(\\text{H}_1)P(\\text{H}_2)=\\tfrac12\\cdot\\tfrac12=\\tfrac14$.'] } }),
  mcq({ id: 'a0-q5', owner: L, role: 'practice', diff: 2, objs: ['A0.4'], tags: ['numpy', 'tensor-product'],
    prompt: md`What is the shape of ⟦np.kron(np.eye(2), np.array([[0, 1], [1, 0]]))⟧?`,
    hints: ['The Kronecker product multiplies dimensions.', 'A $2\\times2$ block structure with $2\\times 2$ blocks.'],
    choices: [['(2, 2)', 'The Kronecker product enlarges the matrix: shapes multiply.', false, 'kron-dims'], ['(4, 4)', 'Correct: $(2\\cdot2)\\times(2\\cdot2)$. This is the 4×4 matrix $I\\otimes X$ acting on two qubits.', true], ['(4,)', 'The result is a matrix, not a vector.'], ['(8, 8)', 'You added an extra factor of 2; dimensions multiply once per factor ($2\\times2$).']],
    fb: { correct: 'Good NumPy reading. Shapes multiply under Kronecker products — the root of the $2^n$ growth of state spaces.', incorrect: 'Think about what ⟦kron⟧ does to the two shapes.', solutionSteps: ['⟦np.eye(2)⟧ is $2\\times2$ and the second argument is $2\\times2$.', 'Kronecker shape $= (2\\cdot 2)\\times(2\\cdot 2) = 4\\times4$.'] } }),
  mcq({ id: 'a0-q6', owner: L, role: 'practice', diff: 2, objs: ['A0.4', 'A0.2'], tags: ['numpy', 'inner-product'],
    prompt: md`With ⟦v = np.array([1, 1j]) / np.sqrt(2)⟧, what does ⟦np.vdot(v, v)⟧ return?`,
    hints: ['⟦np.vdot⟧ conjugates its first argument.', 'So it computes $\\sum v_k^* v_k$.'],
    choices: [['0', 'That would be $\\sum v_k v_k$ without conjugation: $\\tfrac12(1 + i^2)=0$. ⟦vdot⟧ conjugates the first argument.', false, 'missing-conjugate'], ['1 (approximately, as a complex number with zero imaginary part)', 'Correct: $\\langle v|v\\rangle = \\tfrac12(1 + 1) = 1$, so the vector is normalised.', true], ['1j', 'The inner product of a vector with itself is real and non-negative.'], ['2', 'You forgot the $1/\\sqrt2$ normalisation: each component has modulus$^2$ equal to $1/2$.']],
    fb: { correct: 'Correct. ⟦np.vdot⟧ is the Dirac inner product ⟨v|v⟩, unlike ⟦np.dot⟧.', incorrect: 'Remember the first argument is conjugated.', solutionSteps: ['$v^* = (1, -i)/\\sqrt2$.', '$\\langle v|v\\rangle = \\tfrac12(1\\cdot 1 + (-i)(i)) = \\tfrac12(1 + 1) = 1$.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'A0', kind: 'diagnostic', title: 'Start here: a six-question diagnostic', estimatedMinutes: 20,
  question: 'Which refreshers will help you most before the quantum content begins?',
  objectives: ['A0.1', 'A0.2', 'A0.3', 'A0.4'], prerequisiteLessonIds: [],
  sections: [
    { id: 'purpose', kind: 'motivation', title: 'Why a diagnostic?', body: md`
This is a **low-stakes** check. Nothing here blocks you from any module — it just records which basics you needed hints for, so the dashboard can recommend review.

- Answer from memory first; hints are there to use, and using them is recorded honestly but never penalised.
- A wrong answer is information, not a grade. Each one tells you which refresher in **A1** or **A2** to look at.
- If you already know all of this, you can skip straight to **A1** or **B1** from the curriculum map.` },
    { id: 'how', kind: 'explanation', title: 'How feedback works', body: md`
Every item explains *why* an answer is right or wrong and ties it to a concept tag. The tutor panel can give a **cue**, then a **specific hint**, then a **scaffolded solution**. You decide how much help you want.

Conventions used from here on: kets are column vectors, $\langle\phi|\psi\rangle=\sum_k\phi_k^*\psi_k$, and for several qubits the **leftmost** label is qubit 0 (the most significant bit).` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['complex-numbers', 'matrix-vector', 'inner-product', 'numpy', 'tensor-product'],
  references: [{ citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (10th anniversary edition, 2010), Chapter 2 (linear algebra review).', kind: 'textbook', note: 'Verify edition and section numbering against your copy.' }],
};
