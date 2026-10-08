import type { Lesson } from '../../domain/curriculum/types';
import { md, mcq, numeric, match } from '../helpers';

const L = 'a2-tensor-products';
export const activities = [
  mcq({ id: 'a2-cp1', owner: L, role: 'checkpoint', diff: 2, objs: ['A2.2'], tags: ['product-vs-entangled'],
    prompt: md`Checkpoint. Is $\tfrac1{\sqrt2}(|00\rangle+|11\rangle)$ a product state $(a|0\rangle+b|1\rangle)\otimes(c|0\rangle+d|1\rangle)$?`,
    hints: ['Expand the product: what amplitude multiplies $|01\\rangle$?', 'The product has amplitudes $ac,\\ ad,\\ bc,\\ bd$ on $|00\\rangle,|01\\rangle,|10\\rangle,|11\\rangle$.', 'We need $ac\\ne0$ and $bd\\ne0$ but $ad=0$ and $bc=0$. Can all four hold?'],
    choices: [
      [md`No: it would need $ac,bd\neq0$ while $ad=bc=0$, which is impossible.`, 'Correct. If $ad=0$ then $a=0$ or $d=0$, which kills $ac$ or $bd$.', true],
      [md`Yes: it is just $|0\rangle|0\rangle$ plus $|1\rangle|1\rangle$.`, 'A *sum* of product states is generally not a product state. Superposition of two product states can be entangled.', false, 'sum-of-products'],
      [md`Yes, because both qubits are in superposition.`, 'Superposition of each qubit separately is fine for product states ($|+\\rangle|+\\rangle$), but this particular joint state has no such factorisation.'],
      [md`It depends on the basis chosen.`, 'Being a product state is basis-independent: it means the vector factorises as $|a\\rangle\\otimes|b\\rangle$ for *some* single-qubit states.'],
    ],
    fb: { correct: 'This is the Bell state $|\\Phi^+\\rangle$ — the standard example of an entangled state.', incorrect: 'Expand the product and compare coefficients.', solutionSteps: ['$(a|0\\rangle+b|1\\rangle)(c|0\\rangle+d|1\\rangle)=ac|00\\rangle+ad|01\\rangle+bc|10\\rangle+bd|11\\rangle$.', 'Matching $\\tfrac1{\\sqrt2}(|00\\rangle+|11\\rangle)$ requires $ad=bc=0$ but $ac=bd=\\tfrac1{\\sqrt2}$.', 'These are incompatible, so no factorisation exists.'], followUp: 'Which single quantity, built from the four amplitudes, tells you immediately whether a two-qubit state is a product?' } }),
  numeric({ id: 'a2-p1', owner: L, role: 'practice', diff: 1, objs: ['A2.1'], tags: ['tensor-product'], value: 32, tol: 1e-6,
    prompt: 'What is the dimension of the state space of 5 qubits?',
    hints: ['Dimensions multiply under tensor products.', 'Each qubit contributes a factor of 2.'],
    wrong: [[10, 'You added dimensions ($2+2+2+2+2$). Tensor products *multiply* dimensions, which is why simulating $n$ qubits is exponentially costly.']],
    fb: { correct: '$2^5=32$. Each extra qubit doubles the vector length.', incorrect: 'Multiply, do not add.', solutionSteps: ['$\\dim(\\mathcal H_1\\otimes\\cdots\\otimes\\mathcal H_5)=2\\cdot2\\cdot2\\cdot2\\cdot2=32$.'] } }),
  mcq({ id: 'a2-p2', owner: L, role: 'practice', diff: 2, objs: ['A2.1'], tags: ['tensor-product', 'gate-action'],
    prompt: md`Compute $(X\otimes Z)\,|01\rangle$ with qubit 0 on the left.`,
    hints: ['$X\\otimes Z$ means $X$ acts on the first qubit and $Z$ on the second.', '$(A\\otimes B)(|u\\rangle\\otimes|v\\rangle)=A|u\\rangle\\otimes B|v\\rangle$.', '$X|0\\rangle=|1\\rangle$ and $Z|1\\rangle=-|1\\rangle$.'],
    choices: [[md`$-|11\rangle$`, 'Correct: $X|0\\rangle\\otimes Z|1\\rangle=|1\\rangle\\otimes(-|1\\rangle)=-|11\\rangle$.', true], [md`$+|11\rangle$`, 'You flipped the first qubit correctly but missed that $Z|1\\rangle=-|1\\rangle$.', false, 'sign-error'], [md`$-|10\rangle$`, 'You applied $X$ to the wrong qubit: $X$ is the first factor, which flips qubit 0.'], [md`$|10\rangle$`, 'Neither the qubit assignment nor the minus sign from $Z|1\\rangle$ is right.']],
    fb: { correct: 'Each factor acts on its own qubit; signs from $Z$ on $|1\\rangle$ matter once phases are used.', incorrect: 'Apply each factor to its own qubit separately.', solutionSteps: ['$|01\\rangle=|0\\rangle\\otimes|1\\rangle$.', '$X|0\\rangle=|1\\rangle$; $Z|1\\rangle=-|1\\rangle$.', 'Result: $-|11\\rangle$.'] } }),
  numeric({ id: 'a2-p3', owner: L, role: 'practice', diff: 2, objs: ['A2.1'], tags: ['basis-ordering'], value: 6, tol: 1e-6,
    prompt: md`In this course qubit 0 is the *leftmost* bit and the most significant. At which 0-based index does $|110\rangle$ sit in the 8-component statevector?`,
    hints: ['Read the bit string as a binary number.', '$110_2$ in decimal.'],
    wrong: [[3, 'That is the index under the opposite (little-endian) convention, where qubit 0 is the *rightmost* bit, as in some software libraries. Always check a library\'s ordering before comparing numbers.']],
    fb: { correct: '$110_2=6$. In our convention, index $=2^{n-1}q_0+\\dots+q_{n-1}$.', incorrect: 'Treat the bit string as a binary number with the leftmost bit most significant.', solutionSteps: ['$110_2=1\\cdot4+1\\cdot2+0\\cdot1=6$.'] } }),
  numeric({ id: 'a2-p4', owner: L, role: 'practice', diff: 3, objs: ['A2.2', 'A2.3'], tags: ['partial-trace', 'product-vs-entangled'], value: 0.5, tol: 1e-3,
    prompt: md`Let $|\psi\rangle=\tfrac12(|00\rangle+|01\rangle+|10\rangle-|11\rangle)$. Compute the purity $\mathrm{tr}(\rho_A^2)$ of the reduced state of qubit 0. (Hint: arrange the amplitudes in a $2\times2$ matrix $C$ with $C_{ij}$ the coefficient of $|ij\rangle$; then $\rho_A=CC^\dagger$.)`,
    hints: ['Write $C=\\tfrac12\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$ and compute $CC^\\dagger$.', 'The rows are orthogonal with equal norm, so $CC^\\dagger$ is proportional to the identity.', '$\\rho_A=I/2$, so $\\mathrm{tr}\\rho_A^2=2\\cdot\\tfrac14$.'],
    wrong: [[1, 'Purity 1 means a pure reduced state, i.e. a product state. Check $ad-bc$ for the coefficient matrix: $\\tfrac14(-1-1)\\ne0$, so this state is entangled.']],
    fb: { correct: '$\\rho_A=I/2$: maximally mixed, purity $1/2$. This state equals $\\mathrm{CZ}|{+}{+}\\rangle$ — a maximally entangled state in disguise.', incorrect: 'Compute $\\rho_A=CC^\\dagger$ and then $\\mathrm{tr}\\rho_A^2$.', solutionSteps: ['$C=\\tfrac12\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}$.', '$CC^\\dagger=\\tfrac14\\begin{pmatrix}2&0\\\\0&2\\end{pmatrix}=\\tfrac12 I$.', '$\\mathrm{tr}\\rho_A^2=\\tfrac14+\\tfrac14=\\tfrac12$.'] } }),
  match({ id: 'a2-p5', owner: L, role: 'practice', diff: 1, objs: ['A2.1', 'A2.3'], tags: ['tensor-product', 'partial-trace'],
    prompt: 'Match each expression to its meaning.',
    pairs: [[md`$A\otimes I$`, 'acts only on qubit 0'], [md`$I\otimes B$`, 'acts only on qubit 1'], [md`$|a\rangle\otimes|b\rangle$`, 'a product (unentangled) state'], [md`$\mathrm{tr}_B\,\rho_{AB}$`, 'state of subsystem A alone'], [md`$\dim(\mathbb C^2)^{\otimes n}$`, md`$2^n$`]],
    hints: ['The identity factor marks the qubit that is left untouched.', 'Tracing out B throws away everything except A.'],
    fb: { correct: 'These five notational moves cover almost everything about composite systems.', incorrect: 'Re-read the notation list.', solutionSteps: ['$A\\otimes I$: first factor acted on.', '$I\\otimes B$: second factor acted on.', 'Product vector: no entanglement.', 'Partial trace: reduced state.', 'Dimension: $2^n$.'] } }),
  mcq({ id: 'a2-exit', owner: L, role: 'exit', diff: 2, objs: ['A2.2'], tags: ['product-vs-entangled'],
    prompt: md`Exit check. For $|\psi\rangle=a|00\rangle+b|01\rangle+c|10\rangle+d|11\rangle$, which condition holds exactly when $|\psi\rangle$ is a product state?`,
    hints: ['Compare with the product amplitudes $pr, ps, qr, qs$.', 'Which combination of products is symmetric under swapping the roles?'],
    choices: [[md`$ad=bc$`, 'Correct: $(pr)(qs)=(ps)(qr)$. Equivalently the coefficient matrix has determinant zero (rank 1).', true], [md`$ab=cd$`, 'Not the right criterion: the Bell state $|\\Phi^+\\rangle$ has $ab=0=cd$ yet is entangled.', false, 'wrong-criterion'], [md`$a=d$ and $b=c$`, 'Bell states $|\\Phi^+\\rangle$ ($a=d$, $b=c=0$) satisfy this but are entangled.', false, 'wrong-criterion'], [md`All four amplitudes are non-zero.`, 'The Bell state $|\\Phi^+\\rangle$ has two zero amplitudes and is entangled, while $|+\\rangle|+\\rangle$ has four non-zero amplitudes and is a product. Non-zero count does not decide.']],
    fb: { correct: 'Rank-one coefficient matrix $\\Leftrightarrow$ product state: the first hint of the Schmidt decomposition.', incorrect: 'Derive the condition from the product ansatz.', solutionSteps: ['Product amplitudes: $a=pr,\\ b=ps,\\ c=qr,\\ d=qs$.', '$ad=pqrs=bc$.', 'Conversely $ad=bc$ means the coefficient matrix has rank 1, i.e. factorises.'] } }),
];

export const lesson: Lesson = {
  id: L, moduleId: 'A2', kind: 'standard', title: 'Tensor products and composite systems', estimatedMinutes: 45,
  question: 'How do we describe two qubits — and how do we recover a description of one of them when we only look at part of the system?',
  objectives: ['A2.1', 'A2.2', 'A2.3'], prerequisiteLessonIds: ['a1-linear-algebra'],
  sections: [
    { id: 'motivation', kind: 'motivation', title: 'The question', body: md`
Describing $n$ *independent* spin-1/2 nuclei takes about $2n$ complex numbers (one qubit state each). A general joint state of $n$ spins needs $2^n$ amplitudes. The gap between the two is the room taken up by correlations — it is both why classical simulation of quantum systems is hard and where entanglement lives.` },
    { id: 'conv', kind: 'conventions', title: 'Basis ordering (read this carefully)', body: md`
For several qubits we write $|q_0q_1\cdots q_{n-1}\rangle=|q_0\rangle\otimes|q_1\rangle\otimes\cdots$ with **qubit 0 leftmost and most significant**. The statevector index is $2^{n-1}q_0+\dots+q_{n-1}$, so $|01\rangle$ is index 1 and $|10\rangle$ is index 2. The Kronecker product ⟦kron(A, B)⟧ puts $A$ on qubit 0. Some libraries (for example Qiskit) use the *opposite* ordering for printed bit strings and statevectors — always check before comparing numbers.` },
    { id: 'core', kind: 'explanation', title: 'Tensor products', body: md`
For vectors, $(\alpha|0\rangle+\beta|1\rangle)\otimes(\gamma|0\rangle+\delta|1\rangle)=\alpha\gamma|00\rangle+\alpha\delta|01\rangle+\beta\gamma|10\rangle+\beta\delta|11\rangle$. For operators, $(A\otimes B)(|u\rangle\otimes|v\rangle)=A|u\rangle\otimes B|v\rangle$. A gate on one qubit of a register is $A\otimes I$ or $I\otimes B$.

A state of two qubits is a vector in $\mathbb C^4$ — **most** such vectors do not factorise. Those that do are **product states**; those that do not are **entangled**. For two qubits, with coefficient matrix $C_{ij}$ (the amplitude of $|ij\rangle$), the state is a product iff $\det C=0$.` },
    { id: 'worked', kind: 'worked-example', title: 'Worked example', body: md`
Compute $(X\otimes I)|00\rangle$ and $(I\otimes H)|00\rangle$. The first flips qubit 0: $|10\rangle$. The second leaves qubit 0 alone and puts qubit 1 in $|+\rangle$: $|0\rangle\otimes\tfrac1{\sqrt2}(|0\rangle+|1\rangle)=\tfrac1{\sqrt2}(|00\rangle+|01\rangle)$.

**Interpretation.** Operations on separate qubits commute, and they never create entanglement from a product state. Entanglement needs a gate that couples the qubits; module B4 introduces CNOT for exactly that.` },
    { id: 'cp', kind: 'checkpoint', title: 'Checkpoint', body: 'Try this before reading the next section.', activityId: 'a2-cp1' },
    { id: 'pt', kind: 'interpretation', title: 'Partial trace: the state of a subsystem', body: md`
If you can only access qubit A of a joint state $\rho_{AB}$, every statistic you can ever measure is reproduced by the **reduced density operator**
$$\rho_A=\mathrm{tr}_B\,\rho_{AB}=\sum_j(I\otimes\langle j|)\,\rho_{AB}\,(I\otimes|j\rangle).$$
For a pure state with coefficient matrix $C$, $\rho_A=CC^\dagger$. If $|\psi\rangle$ is a product, $\rho_A$ is pure; if it is entangled, $\rho_A$ is **mixed**. We develop mixed states properly in B5; for now treat $\mathrm{tr}\rho_A^2<1$ as a signature of entanglement for pure joint states.` },
    { id: 'misc', kind: 'misconception', title: 'Common misconceptions', body: md`
- **"Two-qubit state = two one-qubit states."** Only product states factorise.
- **"Dimensions add."** They multiply: $\dim = 2^n$.
- **"Quantum parallelism gives you all $2^n$ answers."** A register can hold $2^n$ amplitudes, but a measurement returns only $n$ bits. Useful algorithms must arrange interference so the desired answer has large probability.` },
    { id: 'deriv', kind: 'derivation', title: 'Optional depth: why $\\rho_A=CC^\\dagger$', collapsed: true, body: md`
Write $|\psi\rangle=\sum_{ij}C_{ij}|i\rangle|j\rangle$. Then $\rho_{AB}=\sum C_{ij}C^*_{kl}\,|i\rangle\langle k|\otimes|j\rangle\langle l|$. Tracing out B sets $j=l$: $\rho_A=\sum_{ik}\big(\sum_jC_{ij}C^*_{kj}\big)|i\rangle\langle k|=CC^\dagger$.` },
    { id: 'ext', kind: 'extension', title: 'Extension: counting resources', collapsed: true, body: md`
A 30-qubit statevector in double-precision complex numbers needs $2^{30}\times16$ bytes $\approx17$ GB — which is why this app's simulator limits registers to 10 qubits and why exact diagonalisation baselines in Track D stop at small spin chains.` },
  ],
  activityIds: activities.map((a) => a.id), conceptTags: ['tensor-product', 'basis-ordering', 'product-vs-entangled', 'partial-trace'],
  references: [
    { citation: 'Nielsen, M. A. & Chuang, I. L., Quantum Computation and Quantum Information, Cambridge University Press (2010), Sections 2.1.7 and 2.4.3.', kind: 'textbook', note: 'Tensor products; reduced density operators. Verify section numbers in your edition.' },
    { citation: 'Preskill, J., Lecture Notes for Physics 219, Chapter 2.', kind: 'lecture-notes', url: 'http://theory.caltech.edu/~preskill/ph229/' },
  ],
};
