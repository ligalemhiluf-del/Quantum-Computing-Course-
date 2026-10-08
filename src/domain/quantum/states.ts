import { c, ZERO, expi, abs2, conj, mul as cmul, add as cadd, scale as cscale } from './complex';
import { Mat, Vec, V, apply, inner, vecNorm, vecNormalize, outer, trace, matMul, zeros, hermitianEigenvalues, dagger } from './matrix';
import { X, Y, Z } from './gates';

export const MAX_QUBITS = 10; // statevector memory/time limit for this in-browser teaching simulator

export function checkQubitCount(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > MAX_QUBITS) throw new Error(`Qubit count must be an integer in 1..${MAX_QUBITS} (got ${n})`);
}

/** |bits>, e.g. ket('01') for qubit0=0, qubit1=1 (leftmost character = qubit 0 = most significant). */
export function ket(bits: string): Vec {
  if (!/^[01]+$/.test(bits)) throw new Error(`ket: expected a bit string, got "${bits}"`);
  checkQubitCount(bits.length);
  const v: Vec = Array.from({ length: 2 ** bits.length }, () => ZERO);
  v[parseInt(bits, 2)] = c(1, 0);
  return v;
}
export const ket0 = (): Vec => ket('0');
export const ket1 = (): Vec => ket('1');
export const ketPlus = (): Vec => V([Math.SQRT1_2, Math.SQRT1_2]);
export const ketMinus = (): Vec => V([Math.SQRT1_2, -Math.SQRT1_2]);
export const ketPlusI = (): Vec => V([Math.SQRT1_2, [0, Math.SQRT1_2]]);

export const numQubits = (psi: Vec): number => {
  const n = Math.log2(psi.length);
  if (!Number.isInteger(n) || n < 1) throw new Error(`State length ${psi.length} is not a power of two`);
  return n;
};
export const isNormalized = (psi: Vec, tol = 1e-9): boolean => Math.abs(vecNorm(psi) - 1) <= tol;
export { vecNormalize as normalize };

/** |psi> = cos(theta/2)|0> + e^{i phi} sin(theta/2)|1> (angles in radians; theta in [0, pi]). */
export function blochToState(theta: number, phi: number): Vec {
  return [c(Math.cos(theta / 2), 0), cscale(expi(phi), Math.sin(theta / 2))];
}
export const densityFromKet = (psi: Vec): Mat => outer(psi, psi);

export const expectation = (op: Mat, psi: Vec): number => inner(psi, apply(op, psi)).re;
export const expectationRho = (op: Mat, rho: Mat): number => trace(matMul(op, rho)).re;

export interface Bloch { x: number; y: number; z: number }
export const blochFromKet = (psi: Vec): Bloch => {
  if (psi.length !== 2) throw new Error('blochFromKet: single-qubit state required');
  return { x: expectation(X, psi), y: expectation(Y, psi), z: expectation(Z, psi) };
};
export const blochFromRho = (rho: Mat): Bloch => {
  if (rho.length !== 2) throw new Error('blochFromRho: single-qubit density matrix required');
  return { x: expectationRho(X, rho), y: expectationRho(Y, rho), z: expectationRho(Z, rho) };
};
/** Spherical angles of a Bloch vector (theta from +z, phi from +x toward +y). */
export function blochAngles(b: Bloch): { theta: number; phi: number; r: number } {
  const r = Math.hypot(b.x, b.y, b.z);
  const theta = r < 1e-12 ? 0 : Math.acos(Math.max(-1, Math.min(1, b.z / r)));
  const phi = Math.atan2(b.y, b.x);
  return { theta, phi, r };
}
export const rhoFromBloch = (b: Bloch): Mat => [
  [c((1 + b.z) / 2, 0), c(b.x / 2, -b.y / 2)],
  [c(b.x / 2, b.y / 2), c((1 - b.z) / 2, 0)],
];

export const probabilities = (psi: Vec): number[] => psi.map(abs2);
export const purity = (rho: Mat): number => trace(matMul(rho, rho)).re;
export const isDensityMatrix = (rho: Mat, tol = 1e-8): boolean => {
  try {
    const ev = hermitianEigenvalues(rho, tol);
    return Math.abs(trace(rho).re - 1) <= tol && Math.abs(trace(rho).im) <= tol && ev.every((l) => l >= -tol);
  } catch {
    return false;
  }
};
/** Von Neumann entropy S = -tr(rho log2 rho), in bits. */
export function vonNeumannEntropy(rho: Mat): number {
  return hermitianEigenvalues(rho, 1e-7).reduce((s, l) => (l > 1e-12 ? s - l * Math.log2(l) : s), 0);
}
export const fidelityPure = (a: Vec, b: Vec): number => abs2(inner(a, b));
/** True if a = e^{i alpha} b for some alpha, within tolerance. */
export function equalUpToGlobalPhase(a: Vec, b: Vec, tol = 1e-8): boolean {
  if (a.length !== b.length) return false;
  return Math.abs(fidelityPure(a, b) - vecNorm(a) * vecNorm(a) * vecNorm(b) * vecNorm(b)) <= tol;
}

/**
 * Partial trace of rho over all subsystems not in `keep`. `dims` lists each subsystem dimension in
 * tensor order (subsystem 0 is the leftmost factor / most significant index).
 */
export function partialTrace(rho: Mat, dims: number[], keep: number[]): Mat {
  const total = dims.reduce((a, b) => a * b, 1);
  if (rho.length !== total) throw new Error(`partialTrace: rho is ${rho.length}x${rho.length} but dims multiply to ${total}`);
  const keepSorted = [...new Set(keep)].sort((a, b) => a - b);
  if (keepSorted.some((k) => k < 0 || k >= dims.length)) throw new Error('partialTrace: subsystem index out of range');
  const traced = dims.map((_, i) => i).filter((i) => !keepSorted.includes(i));
  const dKeep = keepSorted.reduce((a, k) => a * dims[k], 1);
  const dTr = traced.reduce((a, k) => a * dims[k], 1);
  const out = zeros(dKeep, dKeep);
  const decode = (idx: number): number[] => {
    const digits = new Array(dims.length).fill(0);
    for (let k = dims.length - 1; k >= 0; k--) {
      digits[k] = idx % dims[k];
      idx = Math.floor(idx / dims[k]);
    }
    return digits;
  };
  const encode = (digits: number[], subset: number[]): number => subset.reduce((acc, k) => acc * dims[k] + digits[k], 0);
  for (let i = 0; i < total; i++) {
    const di = decode(i);
    for (let j = 0; j < total; j++) {
      const dj = decode(j);
      if (traced.some((k) => di[k] !== dj[k])) continue;
      const r = encode(di, keepSorted);
      const s = encode(dj, keepSorted);
      out[r][s] = cadd(out[r][s], rho[i][j]);
    }
  }
  void dTr;
  return out;
}
/** Reduced density matrix of the listed qubits from an n-qubit pure state. */
export const reducedState = (psi: Vec, keep: number[]): Mat => {
  const n = numQubits(psi);
  return partialTrace(densityFromKet(psi), new Array(n).fill(2), keep);
};

/** Schmidt coefficients (descending) of a pure state across the bipartition first nA qubits | rest. */
export function schmidtCoefficients(psi: Vec, nA: number): number[] {
  const n = numQubits(psi);
  if (nA < 1 || nA >= n) throw new Error('schmidtCoefficients: need 1 <= nA < n');
  const rhoA = reducedState(psi, Array.from({ length: nA }, (_, i) => i));
  return hermitianEigenvalues(rhoA, 1e-7).map((l) => Math.sqrt(Math.max(0, l))).filter((s) => s > 1e-9).sort((a, b) => b - a);
}
/** Entanglement entropy (bits) across first nA qubits | rest for a pure state. */
export const entanglementEntropy = (psi: Vec, nA: number): number =>
  schmidtCoefficients(psi, nA).reduce((s, sc) => (sc > 1e-12 ? s - sc * sc * Math.log2(sc * sc) : s), 0);

/* ---------- Measurement ---------- */
/** Deterministic PRNG (mulberry32) so labs are reproducible from a seed. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Sample `shots` outcomes from a probability vector. Returns counts per basis index. */
export function sampleCounts(probs: number[], shots: number, rng: () => number): number[] {
  if (!Number.isInteger(shots) || shots < 0 || shots > 1_000_000) throw new Error('shots must be an integer in 0..1e6');
  const total = probs.reduce((a, b) => a + b, 0);
  if (Math.abs(total - 1) > 1e-6 || probs.some((p) => p < -1e-12)) throw new Error('sampleCounts: probabilities must be non-negative and sum to 1');
  const cum: number[] = [];
  probs.reduce((acc, p, i) => (cum[i] = acc + Math.max(0, p)), 0);
  const counts = new Array(probs.length).fill(0);
  for (let s = 0; s < shots; s++) {
    const r = rng() * cum[cum.length - 1];
    let k = cum.findIndex((x) => r < x);
    if (k < 0) k = probs.length - 1;
    counts[k]++;
  }
  return counts;
}
/** Projective measurement of one qubit in the computational basis: probability and normalised post-measurement state. */
export function postMeasurement(psi: Vec, qubit: number, outcome: 0 | 1): { prob: number; state: Vec | null } {
  const n = numQubits(psi);
  if (qubit < 0 || qubit >= n) throw new Error('postMeasurement: qubit out of range');
  const bit = n - 1 - qubit;
  const proj = psi.map((a, i) => (((i >> bit) & 1) === outcome ? a : ZERO));
  const prob = proj.reduce((s, a) => s + abs2(a), 0);
  return { prob, state: prob < 1e-14 ? null : vecNormalize(proj) };
}
export const bitString = (index: number, n: number): string => index.toString(2).padStart(n, '0');
export { cmul, conj, dagger };
