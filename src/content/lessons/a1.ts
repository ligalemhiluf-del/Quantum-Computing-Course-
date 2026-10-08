import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, match, order, explain } from '../helpers';

const L = 'a1-linear-algebra';
export const activities = [
  mcq({ id: 'a1-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['A1.2'], tags: ['hermitian', 'adjoint'],
    prompt: md`Checkpoint. Is $Y=\begin{pmatrix}0&-i\\ i&0\end{pmatrix}$ Hermitian? Pick the correct reasoning.`,
    hints: ['Hermitian means $A=A^\\dagger$, where $\\dagger$ is *transpose and complex-conjugate*.', 'Transposing swaps the $-i$ and $i$; the conjugation then changes both signs.', 'Do both steps: $Y^T=\\begin{pmatrix}0&i\\\\-i&0\\end{pmatrix}$, then conjugate every entry.'],
    choices: [
      [md`Yes: $Y^\dagger=Y$ — transposing swaps $\pm i$ and conjugating swaps them back.`, 'Correct. Complex entries are perfectly compatible with Hermiticity; the combination of transpose and conjugate is what matters.', true],
      [md`No: it has imaginary entries, and Hermitian matrices must be real.`, 'Hermitian matrices need not be real; they have *real eigenvalues*. Real symmetric matrices are just a special case.', false, 'hermitian-means-real'],
      [md`No: $Y^T=-Y$, so it is anti-symmetric.`, 'You transposed but forgot to conjugate. $\\dagger$ = transpose *and* conjugate.', false, 'missing-conjugate'],
      [md`Only in a different basis.`, 'Hermiticity ($A=A^\\dagger$) holds in every orthonormal basis if it holds in one.'],
    ],
    fb: { correct: 'Yes — $Y=Y^\\dagger$ so $Y$ is Hermitian (it is the Pauli-$Y$ observable, with eigenvalues $\\pm1$).', incorrect: 'Compute $Y^\\dagger$ explicitly: transpose, then conjugate each entry.', solutionSteps: ['$Y^T=\\begin{pmatrix}0&i\\\\-i&0\\end{pmatrix}$.', 'Conjugating each entry: $(Y^T)^*=\\begin{pmatrix}0&-i\\\\ i&0\\end{pmatrix}=Y$.', 'So $Y^\\dagger=Y$: Hermitian.'], followUp: 'What are the eigenvalues of $Y$, and why must they be real?' } }),
  numeric({ id: 'a1-p1', owner: L, role: 'practice', diff: 1, objs: ['A1.1'], tags: ['inner-product', 'adjoint'], value: 0, tol: 1e-6,
    prompt: md`Let $|\phi\rangle=\tfrac1{\sqrt2}(1,\, i)^T$ and $|\psi\rangle=\tfrac1{\sqrt2}(1,\,-i)^T$. Compute $|\langle\phi|\psi\rangle|$.`,
    hints: ['The bra $\\langle\\phi|$ is the conjugate-transpose of $|\\phi\\rangle$.', '$\\langle\\phi| = \\tfrac1{\\sqrt2}(1,\\,-i)$. Multiply component-wise with $|\\psi\\rangle$ and add.', '$\\tfrac12\\big(1\\cdot1+(-i)(-i)\\big)=\\tfrac12(1+i^2)$.'],
    wrong: [[1, 'You did not conjugate the bra: $\\tfrac12(1\\cdot1 + i\\cdot(-i)) = 1$ is $\\langle\\phi^*|\\psi\\rangle$, not an inner product. $\\langle\\phi|$ conjugates entries.'], [2, 'Dropping both the conjugate and the $1/2$ normalisation gives 2.']],
    fb: { correct: 'These are $|{+i}\\rangle$ and $|{-i}\\rangle$, the eigenstates of $Y$ — orthogonal, as eigenvectors of a Hermitian operator with different eigenvalues must be.', incorrect: 'Make sure you conjugate the first vector before multiplying.', solutionSteps: ['$\\langle\\phi|=\\tfrac1{\\sqrt2}(1^*,\\ i^*)=\\tfrac1{\\sqrt2}(1,\\,-i)$.', '$\\langle\\phi|\\psi\\rangle=\\tfrac12\\big(1\\cdot1+(-i)(-i)\\big)=\\tfrac12(1+i^2)=0$.'] } }),
  numeric({ id: 'a1-p2', owner: L, role: 'practice', diff: 2, objs: ['A1.3'], tags: ['eigen', 'hermitian'], value: 4, tol: 1e-6,
    prompt: md`The Hermitian matrix $A=\begin{pmatrix}2&1-i\\1+i&3\end{pmatrix}$ has two real eigenvalues. What is the larger one?`,
    hints: ['Use the characteristic equation $\\det(A-\\lambda I)=0$.', 'For a $2\\times2$ matrix: $\\lambda^2-({\\rm tr}\\,A)\\lambda+\\det A=0$.', '${\\rm tr}A=5$, $\\det A = 6-(1-i)(1+i)=6-2=4$.'],
    wrong: [[5, 'That is the trace, the *sum* of the eigenvalues.'], [3, 'That is just a diagonal entry; eigenvalues are not diagonal entries unless the matrix is diagonal.']],
    fb: { correct: '$\\lambda^2-5\\lambda+4=0\\Rightarrow\\lambda=1,4$. The sum equals the trace (5) and the product equals the determinant (4) — a quick sanity check.', incorrect: 'Compute trace and determinant, then solve the quadratic.', solutionSteps: ['${\\rm tr}A=5$.', '$\\det A=2\\cdot3-(1-i)(1+i)=6-(1+1)=4$.', '$\\lambda^2-5\\lambda+4=(\\lambda-1)(\\lambda-4)=0$, so $\\lambda\\in\\{1,4\\}$.'] } }),
  match({ id: 'a1-p3', owner: L, role: 'practice', diff: 1, objs: ['A1.2', 'A1.1'], tags: ['hermitian', 'unitary'],
    prompt: 'Match each term with its defining expression.',
    pairs: [['Hermitian operator', md`$A^\dagger=A$`], ['Unitary operator', md`$U^\dagger U=I$`], ['Orthogonal projector', md`$P^2=P=P^\dagger$`], ['Normalised state', md`$\langle\psi|\psi\rangle=1$`], ['Spectral decomposition', md`$A=\sum_k\lambda_k|k\rangle\langle k|$`]],
    hints: ['Think about which property keeps lengths fixed, and which guarantees real eigenvalues.', 'Projectors are idempotent: applying them twice changes nothing.'],
    fb: { correct: 'These five definitions are the working vocabulary for the entire course.', incorrect: 'Check each pairing against the definition you would write on the board.', solutionSteps: ['Hermitian ↔ equals its adjoint.', 'Unitary ↔ adjoint is the inverse.', 'Projector ↔ idempotent and Hermitian.', 'Normalised ↔ unit norm.', 'Spectral decomposition ↔ sum of eigenvalues times projectors.'] } }),
  order({ id: 'a1-p4', owner: L, role: 'practice', diff: 2, objs: ['A1.3'], tags: ['spectral', 'eigen'],
    prompt: md`Put the steps for writing the spectral decomposition of $X=\begin{pmatrix}0&1\\1&0\end{pmatrix}$ in order.`,
    items: [md`Solve $\det(X-\lambda I)=0$ to get $\lambda=\pm1$.`, md`For each $\lambda$, solve $(X-\lambda I)v=0$ to get $v\propto(1,\pm1)^T$.`, md`Normalise: $|\pm\rangle=\tfrac1{\sqrt2}(1,\pm1)^T$.`, md`Assemble $X=(+1)|{+}\rangle\langle{+}|+(-1)|{-}\rangle\langle{-}|$.`],
    hints: ['You need eigenvalues before you can find eigenvectors.', 'Normalise before building projectors $|k\\rangle\\langle k|$.'],
    fb: { correct: 'That is the generic recipe for any Hermitian operator.', incorrect: 'Ask what each step needs as input.', solutionSteps: ['Eigenvalues first.', 'Then eigenvectors.', 'Then normalisation.', 'Then the sum of weighted projectors.'] } }),
  explain({ id: 'a1-p5', owner: L, role: 'practice', diff: 3, objs: ['A1.2'], tags: ['hermitian', 'eigen'],
    prompt: md`In 3–4 sentences, explain why the eigenvalues of a Hermitian operator are real and why this matters for measurement.`,
    rubric: [md`Uses $A|k\rangle=\lambda|k\rangle$ and $\langle k|A|k\rangle=\lambda\langle k|k\rangle$.`, md`Uses $A=A^\dagger$ to show $\langle k|A|k\rangle$ equals its own complex conjugate, hence is real.`, 'Concludes that the eigenvalues are real numbers.', 'Connects this to measurement outcomes being real numbers (observables).'],
    min: 3, model: md`If $A|k\rangle=\lambda|k\rangle$ then $\langle k|A|k\rangle=\lambda\langle k|k\rangle$. Taking the complex conjugate and using $A=A^\dagger$ gives $\langle k|A|k\rangle^*=\langle k|A^\dagger|k\rangle=\langle k|A|k\rangle$, so the expression is real; dividing by $\langle k|k\rangle>0$ shows $\lambda$ is real. Measured values of physical observables are real numbers, so observables are represented by Hermitian operators.`,
    patterns: [['all (hermitian )?matrices have real entries|hermitian.*(must|are) real matri', 'Hermitian matrices can have complex entries; it is the *eigenvalues* that are guaranteed real.']],
    hints: ['Start from the eigenvalue equation and take an inner product with $\\langle k|$.', 'What does taking the complex conjugate of $\\langle k|A|k\\rangle$ do if $A=A^\\dagger$?'],
    fb: { correct: 'Self-check recorded. Compare with the model answer; the key step is $\\langle k|A|k\\rangle^*=\\langle k|A|k\\rangle$.', incorrect: 'Re-read the model answer and tick only what your explanation really contained.', solutionSteps: ['Project onto $\\langle k|$: $\\langle k|A|k\\rangle=\\lambda\\langle k|k\\rangle$.', 'Conjugate: $\\langle k|A|k\\rangle^*=\\langle k|A^\\dagger|k\\rangle=\\langle k|A|k\\rangle$.', 'So the left side is real and $\\langle k|k\\rangle>0$, hence $\\lambda\\in\\mathbb R$.'] } }),
  mcq({ id: 'a1-exit', owner: L, role: 'exit', diff: 2, objs: ['A1.2', 'A1.1'], tags: ['unitary'],
    prompt: 'Exit check. Which statement about a unitary operator $U$ is correct?',
    hints: ['What does $U^\\dagger U=I$ say about inner products?', 'Compute $\\langle U\\phi|U\\psi\\rangle$.'],
    choices: [
      [md`$\langle U\phi|U\psi\rangle=\langle\phi|\psi\rangle$, so norms (total probability) are preserved.`, 'Correct: $\\langle U\\phi|U\\psi\\rangle=\\langle\\phi|U^\\dagger U|\\psi\\rangle=\\langle\\phi|\\psi\\rangle$.', true],
      [md`$U$ must have real eigenvalues.`, 'Eigenvalues of a unitary have modulus one ($e^{i\\theta}$), not necessarily real.', false, 'unitary-vs-hermitian'],
      [md`$U$ is always Hermitian.`, 'Some unitaries are Hermitian ($X,Y,Z,H$) but generically $U\\ne U^\\dagger$ (e.g. the phase gate $S$).', false, 'unitary-vs-hermitian'],
      [md`$U$ can map a normalised state to a shorter vector to model decay.`, 'That would violate $\\sum_k p_k=1$. Decay needs open-system dynamics (Track B6, D5).'],
    ],
    fb: { correct: 'Unitary = reversible, probability-preserving evolution; Hermitian = observable. Keep the two roles distinct.', incorrect: 'Re-derive from $U^\\dagger U=I$.', solutionSteps: ['$\\langle U\\phi|U\\psi\\rangle=\\langle\\phi|U^\\dagger U|\\psi\\rangle=\\langle\\phi|\\psi\\rangle$.', 'So lengths and angles are preserved.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'A1', kind: 'standard', title: 'Complex vectors, adjoints and operators', estimatedMinutes: 45,
  question: 'Why do we use complex vectors, and which matrices are allowed to describe measurements and dynamics?',
  objectives: ['A1.1', 'A1.2', 'A1.3'], prerequisiteLessonIds: ['a0-diagnostic'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
A spin-1/2 nucleus in a magnetic field has two energy levels. Its state lives in a two-dimensional **complex** vector space, its energy is an operator with real eigenvalues, and its time evolution preserves total probability. Three physical requirements — *real measurement outcomes*, *probability conservation*, *superposition* — pick out exactly the matrix types we study here.` },
    { id: 'conv', kind: 'conventions', title: 'Notation and conventions', body: md`
- A **ket** $|\psi\rangle$ is a column vector; the **bra** $\langle\psi|=|\psi\rangle^\dagger$ is its conjugate-transpose (a row).
- Inner product: $\langle\phi|\psi\rangle=\sum_k\phi_k^*\psi_k$. Norm: $\|\psi\|=\sqrt{\langle\psi|\psi\rangle}$.
- Adjoint of a matrix: $A^\dagger=(A^*)^T$, so $\langle\phi|A\psi\rangle=\langle A^\dagger\phi|\psi\rangle$.
- Computational basis: $|0\rangle=(1,0)^T$, $|1\rangle=(0,1)^T$.
- Units: $\hbar=1$ unless stated; when physical units appear we convert to SI explicitly.` },
    { id: 'core', kind: 'explanation', title: 'The two operator families', body: md`
**Hermitian** operators satisfy $A^\dagger=A$. They have real eigenvalues and orthogonal eigenvectors for distinct eigenvalues, and represent *observables*.

**Unitary** operators satisfy $U^\dagger U=UU^\dagger=I$. They preserve inner products, so they represent *reversible evolution*.

Every Hermitian $A$ has a **spectral decomposition**
$$A=\sum_k\lambda_k\,|k\rangle\langle k|,$$
with real $\lambda_k$ and orthonormal eigenvectors $|k\rangle$. Each $|k\rangle\langle k|$ is a projector: it keeps the component along $|k\rangle$ and discards the rest. Functions of $A$ follow by applying the function to the eigenvalues.` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example: the Pauli X operator', body: md`
$X=\begin{pmatrix}0&1\\1&0\end{pmatrix}$. Its characteristic polynomial is $\lambda^2-1$, so $\lambda=\pm1$. Solving $(X-\lambda I)v=0$ gives $v\propto(1,\pm1)^T$. Normalising,
$$|\pm\rangle=\tfrac1{\sqrt2}(|0\rangle\pm|1\rangle),\qquad X=|{+}\rangle\langle{+}|-|{-}\rangle\langle{-}|.$$
**Interpretation.** Measuring the observable $X$ can only return $+1$ or $-1$. The eigenvectors $|\pm\rangle$ are the states for which the answer is certain; $|0\rangle$ is *not* one of them, which is why measuring $X$ on $|0\rangle$ gives random results.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'Before reading on, commit to an answer. The tutor can give a cue first.', activityId: 'a1-cp1' },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Hermitian means real."** No: $Y$ has complex entries and is Hermitian. What is real is the *spectrum*.
- **"A bra is just a transposed ket."** The conjugate matters: without it, $\langle\psi|\psi\rangle$ would not be a non-negative norm.
- **"Unitary and Hermitian are the same thing."** Different roles: unitary operators evolve states; Hermitian operators are measured. Some matrices (the Paulis, $H$) happen to be both.` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: eigenvalues of Hermitian operators are real', collapsed: true, body: md`
Let $A|k\rangle=\lambda|k\rangle$ with $\langle k|k\rangle>0$. Then $\langle k|A|k\rangle=\lambda\langle k|k\rangle$. Taking complex conjugates, $\langle k|A|k\rangle^*=\langle k|A^\dagger|k\rangle=\langle k|A|k\rangle$, so the left side is real, hence $\lambda$ is real. For $A|k\rangle=\lambda|k\rangle$, $A|l\rangle=\mu|l\rangle$ with $\lambda\ne\mu$: $\lambda\langle l|k\rangle=\langle l|A|k\rangle=\langle A l|k\rangle=\mu\langle l|k\rangle$, so $\langle l|k\rangle=0$.` },
    { id: 'ext', kind: 'extension', title: 'Extension: the same computation in Python', collapsed: true, body: md`
In NumPy, ⟦np.linalg.eigh⟧ is designed for Hermitian matrices and returns real eigenvalues in ascending order, whereas ⟦np.linalg.eig⟧ makes no such promise. Prefer ⟦eigh⟧ for observables. Always test ⟦np.allclose(A, A.conj().T)⟧ before trusting it. (Python is not executed in this app's MVP; the JavaScript code cells use the same ideas.)` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['inner-product', 'adjoint', 'hermitian', 'unitary', 'eigen', 'spectral'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (10th anniversary edition, 2010), Chapter 2.1.', kind: 'textbook', note: 'Linear algebra for quantum mechanics. Check edition numbering.' },
    { citation: 'Preskill, J., Lecture Notes for Physics 219: Quantum Information and Computation, Caltech.', kind: 'lecture-notes', url: 'http://theory.caltech.edu/~preskill/ph229/', note: 'Chapter 2 covers states and operators; confirm the current URL.' },
  ],
};
