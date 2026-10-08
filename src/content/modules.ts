import { seed } from './helpers';
import type { Course, Track } from '../domain/curriculum/types';

export const course: Course = {
  id: 'qct-msc-physics',
  title: 'Quantum Computing for Physicists',
  description: 'A physics-first, self-paced graduate course that translates quantum mechanics into the language of quantum information and computation, then builds toward simulation, open systems and research readiness.',
  audience: 'MSc Physics students (nuclear / subnuclear background) with undergraduate quantum mechanics, calculus, complex numbers and introductory programming.',
  version: 1,
  trackIds: ['A', 'B', 'C', 'D', 'E'],
  recommendedOrder: ['A0', 'A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'],
};

export const trackSeeds: Omit<Track, 'moduleIds'>[] = [
  { id: 'A', order: 1, title: 'Mathematical and computational bridge', description: 'Linear algebra, tensor products, probability and a reproducible scientific-Python workflow — with a short diagnostic and optional refreshers rather than gates.' },
  { id: 'B', order: 2, title: 'Quantum information foundations', description: 'Qubits, measurement, gates, entanglement, density operators, noisy channels and the communication protocols built from them.' },
  { id: 'C', order: 3, title: 'Circuits and algorithms', description: 'The circuit model, phase kickback, QFT, Grover, phase estimation, Shor, variational methods and honest accounting of quantum advantage.' },
  { id: 'D', order: 4, title: 'Physics-first quantum computing', description: 'Hamiltonians, spin models, quantum simulation, many-body correlations, open systems, control, and a careful bridge to nuclear / subnuclear toy models.' },
  { id: 'E', order: 5, title: 'Research extensions', description: 'Error correction, error mitigation, quantum machine learning, reservoir computing, paper reading and the transition to an MSc research project. Preview only in this MVP.' },
];

/** Module metadata for the whole map. lessonIds / labIds / availability are derived from authored lessons and labs in content/index.ts. */
export const moduleSeeds = [
  // ---------------- Track A ----------------
  seed('A0', 'A', 'Diagnostic: vectors, matrices, probability, Python', 'foundation', 20, [], 'A short, low-stakes check of complex numbers, matrices, probability and NumPy reading. It never blocks you; it tells you which refreshers to prioritise.', [
    'Calculate moduli and products of complex amplitudes.', 'Calculate matrix-vector products and inner products.', 'Calculate probabilities of independent events and compare them with squared amplitudes.', 'Interpret short NumPy expressions and predict their results.']),
  seed('A1', 'A', 'Complex vector spaces and linear algebra', 'foundation', 45, ['A0'], 'Bases, inner products, adjoints, Hermitian and unitary operators, eigenvalues and the spectral decomposition — in Dirac notation.', [
    'Calculate inner products, norms and adjoints of complex vectors and matrices.', 'Identify Hermitian and unitary operators from their defining properties and explain their physical roles.', 'Calculate eigenvalues and eigenvectors of Hermitian operators and write their spectral decomposition.']),
  seed('A2', 'A', 'Tensor products and composite systems', 'foundation', 45, ['A1'], 'Basis ordering, Kronecker products, product versus entangled vectors, and partial trace as "the state of a subsystem".', [
    'Calculate Kronecker products of vectors and operators using a stated basis ordering.', 'Distinguish product states from non-product states of two qubits.', 'Compute a partial trace of a two-qubit state and interpret it as the state of a subsystem.']),
  seed('A3', 'A', 'Probability, information and computation', 'foundation', 60, ['A0'], 'Conditional probability, entropy intuition, bits versus qubits, and the complexity vocabulary (P, BPP, BQP) used later.', [
    'Calculate conditional probabilities and Shannon entropy for simple distributions.', 'Compare the information content of bits and qubits without overclaiming.', 'Explain the meaning of asymptotic cost and the classes P, BPP and BQP at a vocabulary level.']),
  seed('A4', 'A', 'Python scientific workflow', 'foundation', 60, ['A0'], 'Arrays, plotting, numerical precision, reproducible scripts or notebooks and unit tests for scientific code.', [
    'Implement vectorised NumPy code for small linear-algebra tasks.', 'Evaluate floating-point error and choose sensible tolerances in tests.', 'Write a reproducible script with a fixed random seed and a unit test.']),
  // ---------------- Track B ----------------
  seed('B1', 'B', 'Qubits and pure states', 'foundation', 45, ['A1'], 'Normalisation, global versus relative phase, the computational basis and the Bloch sphere.', [
    'Explain why global phase is unobservable while relative phase is observable.', 'Convert between amplitudes and Bloch-sphere angles.', 'Calculate computational-basis measurement probabilities of a single-qubit state.']),
  seed('B2', 'B', 'Measurement and the quantum postulates', 'foundation', 45, ['B1'], 'Born rule, projective measurement, post-measurement states, arbitrary bases and what repeated experiments reveal.', [
    'Calculate outcome probabilities and post-measurement states for projective measurements in arbitrary bases.', 'Explain why a measurement outcome cannot simply be a pre-existing classical bit.', 'Calculate expectation values and relate them to finite-sample estimates.']),
  seed('B3', 'B', 'Single-qubit gates and circuits', 'foundation', 45, ['B2', 'A1'], 'X, Y, Z, H, S, T and rotations as unitaries; reading circuit diagrams; global-phase equivalence.', [
    'Calculate the action of single-qubit gates on arbitrary states.', 'Derive gate identities such as HZH = X and identify gates that agree up to global phase.', 'Construct a short gate sequence that prepares a given single-qubit state.']),
  seed('B4', 'B', 'Multiple qubits and entanglement', 'foundation', 50, ['B3', 'A2'], 'Product states, Bell states, Schmidt decomposition, reduced states, correlations and an introductory look at Bell inequalities.', [
    'Construct Bell states with H and CNOT and compute their statevectors.', 'Classify two-qubit pure states as product or entangled using reduced states and entropy.', 'Explain why entanglement does not permit faster-than-light signalling.', 'Compare the classical and quantum bounds on the CHSH quantity.']),
  seed('B5', 'B', 'Density operators', 'core', 50, ['B4'], 'Mixed states, ensembles, purity, reduced density matrices, partial trace and von Neumann entropy.', [
    'Calculate density operators, purity and Bloch vectors for pure and mixed qubit states.', 'Compute reduced density matrices by partial trace and interpret the mixedness that entanglement produces.', 'Calculate the von Neumann entropy of simple density operators.']),
  seed('B6', 'B', 'Quantum channels and noise', 'core', 50, ['B5'], 'Kraus operators, CPTP maps, bit flip, phase flip, depolarising and amplitude damping, and their Bloch-sphere effects.', [
    'Verify that Kraus operators are trace preserving and apply them to a density matrix.', 'Describe the Bloch-sphere action of bit-flip, phase-flip, depolarising and amplitude-damping channels.', 'Compare relaxation-type and dephasing-type noise by their effect on populations, coherences and purity.']),
  seed('B7', 'B', 'No-cloning, teleportation and quantum communication', 'core', 60, ['B4', 'B5'], 'Protocols as state-preparation and measurement stories with explicit resource accounting: no-cloning, teleportation, superdense coding.', [
    'Derive the no-cloning theorem for two non-orthogonal states.', 'Calculate the outcomes and corrections in the teleportation protocol.', 'Compare teleportation and superdense coding by their classical and quantum resource costs.']),
  // ---------------- Track C ----------------
  seed('C1', 'C', 'Circuit model and universality', 'core', 60, ['B4', 'A3'], 'Reversibility, controlled operations, universal gate sets, circuit size and depth.', [
    'Construct controlled operations from elementary gates.', 'Explain what universality of a gate set does and does not guarantee.', 'Compare circuits by size and depth.']),
  seed('C2', 'C', 'Phase kickback and the quantum Fourier transform', 'core', 70, ['C1'], 'Phase kickback, the QFT definition, its circuit and its interpretation.', [
    'Derive phase kickback for a controlled unitary acting on an eigenstate.', 'Construct the QFT circuit for small n and verify it numerically.', 'Interpret the QFT as a change of basis and compare its gate count to the classical FFT carefully.']),
  seed('C3', 'C', 'Grover search', 'core', 60, ['C1'], 'The oracle model, amplitude amplification geometry, iteration count, assumptions and limits.', [
    'Derive the rotation picture of Grover iteration in the two-dimensional invariant subspace.', 'Calculate the optimal number of iterations and the success probability.', 'Critique claims of Grover speedups using the oracle model and classical baselines.']),
  seed('C4', 'C', 'Quantum phase estimation', 'core', 70, ['C2'], 'Eigenphase encoding, controlled powers, inverse QFT, precision and resource scaling.', [
    'Derive the phase-estimation circuit output for an exact eigenphase.', 'Calculate the register size needed for a target precision and success probability.', 'Explain the cost of controlled powers of U.']),
  seed('C5', 'C', 'Shor algorithm overview', 'advanced', 60, ['C4'], 'The reduction of factoring to order finding, the QPE connection and honest resource caveats.', [
    'Explain the reduction from factoring to order finding.', 'Calculate order finding by hand for a tiny modulus.', 'Critique resource claims: logical versus physical qubits and error-correction overhead.']),
  seed('C6', 'C', 'Variational quantum algorithms', 'advanced', 70, ['C1', 'A4'], 'Parameterised circuits, expectation values, classical optimisation loops, barren plateaus and measurement cost.', [
    'Implement a parameterised circuit and its expectation-value cost function.', 'Estimate the shot budget needed for a target precision.', 'Evaluate the limits of variational methods: optimisation landscape, barren plateaus and classical baselines.']),
  seed('C7', 'C', 'Complexity and quantum advantage', 'advanced', 60, ['C1', 'A3'], 'BQP vocabulary, oracle versus practical settings, verification, classical baselines and sampling claims.', [
    'Explain BQP and its relations to P and BPP at a vocabulary level.', 'Compare oracle separations with practical advantage claims.', 'Critique an advantage claim by listing assumptions, baselines and verification method.']),
  // ---------------- Track D ----------------
  seed('D1', 'D', 'Hamiltonians as computational objects', 'core', 60, ['A1', 'A2', 'B3'], 'Pauli decompositions, expectation values, spectra and time evolution of Hamiltonians for few-qubit systems.', [
    'Decompose a small Hermitian matrix into Pauli strings.', 'Calculate the spectrum and the time-evolution operator of a few-qubit Hamiltonian.', 'Convert between angular-frequency units and SI energies and frequencies.']),
  seed('D2', 'D', 'Spin systems and qubit encodings', 'core', 60, ['D1', 'B5'], 'Spin-1/2, Pauli operators, Ising and Heisenberg models and basis conventions.', [
    'Write Ising and Heisenberg Hamiltonians in Pauli form with stated conventions.', 'Calculate ground states and gaps of two-spin models.', 'Compare encodings of a spin model on qubits, stating basis conventions.']),
  seed('D3', 'D', 'Quantum dynamics and simulation', 'core', 75, ['D1', 'D2', 'C1'], 'Trotterisation, product formulas, error versus step size, circuit depth and the exact-diagonalisation baseline.', [
    'Derive first-order product-formula error scaling for non-commuting terms.', 'Compare first- and second-order formulas by error versus step count.', 'Evaluate the cost of simulation against an exact-diagonalisation baseline and its qubit limit.']),
  seed('D4', 'D', 'Many-body states and correlations', 'advanced', 60, ['D2'], 'Observables, correlation functions, entanglement measures and finite-size caveats.', [
    'Calculate correlation functions in small spin chains.', 'Compare entanglement entropy across bipartitions.', 'Assess finite-size effects when extrapolating small-system results.']),
  seed('D5', 'D', 'Open quantum systems', 'advanced', 70, ['D2', 'B6'], 'Density-matrix dynamics, the Lindblad master equation (concept level), channels, decoherence and noise modelling.', [
    'Explain how a Lindblad equation generates amplitude damping and dephasing.', 'Calculate relaxation and dephasing rates from T1 and T2.', 'Compare Markovian master-equation and channel descriptions.']),
  seed('D6', 'D', 'Quantum control and state transfer', 'advanced', 60, ['D3'], 'Controllability concepts, simple pulse and circuit analogies, transfer fidelity and constraints.', [
    'Explain controllability of a spin using available rotations.', 'Calculate state-transfer fidelity for simple protocols.', 'Evaluate the effect of control errors and constraints.']),
  seed('D7', 'D', 'Nuclear / subnuclear applications bridge', 'advanced', 75, ['D1', 'D2', 'D3'], 'How quantum algorithms may encode simplified lattice or effective Hamiltonians, scattering and bound-state toy models, and what additional domain knowledge is required. Toy examples only; no claim of near-term solutions to full nuclear problems.', [
    'Explain how a simplified effective Hamiltonian can be mapped to qubits.', 'Identify the approximations in a toy bound-state or scattering model.', 'Critique the gap between toy models and realistic nuclear or lattice problems.']),
  // ---------------- Track E ----------------
  seed('E1', 'E', 'Error correction and fault tolerance', 'advanced', 90, ['B6', 'C1'], 'Stabiliser codes, syndrome extraction, surface-code concepts and overhead.', [
    'Explain how syndrome measurement detects errors without measuring logical information.', 'Calculate the action of the three-qubit bit-flip code.', 'Estimate qualitative overhead of fault tolerance.']),
  seed('E2', 'E', 'Error mitigation and hardware-aware methods', 'advanced', 60, ['B6', 'C6'], 'Readout mitigation, zero-noise extrapolation and calibration caveats.', [
    'Explain readout-error mitigation and its assumptions.', 'Apply zero-noise extrapolation to synthetic data and assess bias.', 'Critique mitigation claims for sampling overhead and calibration drift.']),
  seed('E3', 'E', 'Quantum machine learning', 'advanced', 75, ['C6', 'A3'], 'Feature maps, quantum kernels, variational classifiers, data encoding and fair classical comparisons.', [
    'Describe data-encoding strategies and their costs.', 'Compare a quantum-kernel classifier with a tuned classical baseline fairly.', 'Critique QML claims about speedup and data loading.']),
  seed('E4', 'E', 'Quantum reservoir computing', 'advanced', 75, ['D5', 'C6'], 'The reservoir concept, the dynamical-systems connection, readout training, memory and capacity, and baselines.', [
    'Explain the reservoir-computing architecture and what is trained.', 'Evaluate memory capacity on a toy task.', 'Compare a quantum reservoir with classical echo-state baselines.']),
  seed('E5', 'E', 'Research reading and reproducibility', 'advanced', 60, ['A4', 'B3'], 'Paper anatomy, claim/evidence audits, reproduction plans, notebooks and citation hygiene.', [
    'Audit a paper by listing its claims, evidence and assumptions.', 'Plan a reproduction with inputs, outputs and success criteria.', 'Write citations that distinguish verified from unverified metadata.']),
  seed('E6', 'E', 'MSc research transition', 'advanced', 90, ['E5', 'D3'], 'Question selection, a literature map, a feasibility matrix, supervisor discussion and an 8–12 week mini-project proposal.', [
    'Formulate a scoped research question with feasibility criteria.', 'Plan an 8–12 week mini-project with milestones and risks.', 'Prepare questions to validate topic alignment with a prospective supervisor.']),
];
