import { c } from './complex';
import { Mat, zeros, matAdd, matScale, matMul, identity, kronAll, evolutionOperator, hermitianEigenvalues, matSub, spectralNorm, Vec, apply, inner } from './matrix';
import { PAULI } from './gates';

/**
 * Hamiltonians are written as sums of weighted Pauli strings, H = sum_k c_k P_k, with H/hbar in rad/us
 * (angular frequency units, hbar = 1). Time is in microseconds.
 */
export type PauliTerm = { coeff: number; pauli: string };
export const MAX_HAMILTONIAN_QUBITS = 3;

export function validateTerms(terms: PauliTerm[], n: number) {
  if (!Number.isInteger(n) || n < 1 || n > MAX_HAMILTONIAN_QUBITS) throw new Error(`Hamiltonian qubits must be 1..${MAX_HAMILTONIAN_QUBITS}`);
  if (terms.length === 0) throw new Error('Add at least one Pauli term');
  for (const t of terms) {
    if (!Number.isFinite(t.coeff)) throw new Error(`Coefficient for "${t.pauli}" must be a finite number`);
    if (t.pauli.length !== n || !/^[IXYZ]+$/.test(t.pauli)) throw new Error(`"${t.pauli}" must be a string of exactly ${n} letters from I, X, Y, Z`);
  }
}
export const pauliMatrix = (s: string): Mat => kronAll([...s].map((ch) => PAULI[ch as 'I' | 'X' | 'Y' | 'Z']));

export function buildHamiltonian(terms: PauliTerm[], n: number): Mat {
  validateTerms(terms, n);
  const d = 2 ** n;
  return terms.reduce((acc, t) => matAdd(acc, matScale(pauliMatrix(t.pauli), t.coeff)), zeros(d, d));
}
export const spectrum = (terms: PauliTerm[], n: number): number[] => hermitianEigenvalues(buildHamiltonian(terms, n));
export const exactPropagator = (terms: PauliTerm[], n: number, t: number): Mat => evolutionOperator(buildHamiltonian(terms, n), t);

/** exp(-i a P) = cos(a) I - i sin(a) P, exact because P^2 = I for a Pauli string. */
function pauliExp(pauli: string, a: number): Mat {
  const d = 2 ** pauli.length;
  return matAdd(matScale(identity(d), Math.cos(a)), matScale(pauliMatrix(pauli), c(0, -Math.sin(a))));
}
/** Product-formula propagator for total time t using `steps` Trotter steps; order 1 (Lie-Trotter) or 2 (symmetric Strang). */
export function trotterPropagator(terms: PauliTerm[], n: number, t: number, steps: number, order: 1 | 2): Mat {
  validateTerms(terms, n);
  if (!Number.isInteger(steps) || steps < 1 || steps > 4096) throw new Error('steps must be an integer in 1..4096');
  const dt = t / steps;
  let stepU = identity(2 ** n);
  if (order === 1) {
    for (const term of terms) stepU = matMul(pauliExp(term.pauli, term.coeff * dt), stepU);
  } else {
    for (const term of terms) stepU = matMul(pauliExp(term.pauli, (term.coeff * dt) / 2), stepU);
    for (const term of [...terms].reverse()) stepU = matMul(pauliExp(term.pauli, (term.coeff * dt) / 2), stepU);
  }
  let u = identity(2 ** n);
  for (let s = 0; s < steps; s++) u = matMul(stepU, u);
  return u;
}
/** Operator-norm distance between exact and product-formula propagators. */
export function trotterError(terms: PauliTerm[], n: number, t: number, steps: number, order: 1 | 2): number {
  return spectralNorm(matSub(exactPropagator(terms, n, t), trotterPropagator(terms, n, t, steps, order)));
}
/** Least-squares slope of log(y) against log(x), ignoring non-positive points. */
export function logLogSlope(xs: number[], ys: number[]): number | null {
  const pts = xs.map((x, i) => [Math.log(x), Math.log(ys[i])]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (pts.length < 2) return null;
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const num = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
  const den = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  return den === 0 ? null : num / den;
}
export const evolveState = (u: Mat, psi: Vec): Vec => apply(u, psi);
export const stateOverlap2 = (a: Vec, b: Vec): number => {
  const z = inner(a, b);
  return z.re * z.re + z.im * z.im;
};
/** hbar = 1.054571817e-34 J s. Convert H/hbar given in rad/us to frequency in MHz (omega / 2 pi) and energy in neV. */
export const HBAR_J_S = 1.054571817e-34;
export const radPerUsToMHz = (w: number): number => w / (2 * Math.PI);
export const radPerUsToNeV = (w: number): number => (HBAR_J_S * w * 1e6) / 1.602176634e-19 * 1e9;
