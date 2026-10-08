import { Mat, M, matMul, matAdd, dagger, zeros, identity, matApproxEq, kron } from './matrix';
import { I2, X, Y, Z } from './gates';

export type Kraus = Mat[];
const chk = (p: number, name: string) => {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new Error(`${name} must be a probability in [0,1] (got ${p})`);
};
const sc = (m: Mat, s: number): Mat => m.map((r) => r.map((x) => ({ re: x.re * s, im: x.im * s })));

export const bitFlip = (p: number): Kraus => (chk(p, 'p'), [sc(I2, Math.sqrt(1 - p)), sc(X, Math.sqrt(p))]);
export const phaseFlip = (p: number): Kraus => (chk(p, 'p'), [sc(I2, Math.sqrt(1 - p)), sc(Z, Math.sqrt(p))]);
/** rho -> (1-p) rho + p I/2 (Bloch vector shrinks by 1-p). */
export const depolarizing = (p: number): Kraus => (
  chk(p, 'p'), [sc(I2, Math.sqrt(1 - (3 * p) / 4)), sc(X, Math.sqrt(p / 4)), sc(Y, Math.sqrt(p / 4)), sc(Z, Math.sqrt(p / 4))]
);
/** T1-type decay |1> -> |0> with probability gamma. */
export const amplitudeDamping = (g: number): Kraus => (
  chk(g, 'gamma'), [M([[1, 0], [0, Math.sqrt(1 - g)]]), M([[0, Math.sqrt(g)], [0, 0]])]
);
/** Pure dephasing with off-diagonals scaled by sqrt(1-lambda). */
export const phaseDamping = (l: number): Kraus => (
  chk(l, 'lambda'), [M([[1, 0], [0, Math.sqrt(1 - l)]]), M([[0, 0], [0, Math.sqrt(l)]])]
);

export const CHANNELS = {
  bitFlip: { label: 'Bit flip', param: 'p', make: bitFlip },
  phaseFlip: { label: 'Phase flip', param: 'p', make: phaseFlip },
  depolarizing: { label: 'Depolarizing', param: 'p', make: depolarizing },
  amplitudeDamping: { label: 'Amplitude damping', param: 'gamma', make: amplitudeDamping },
  phaseDamping: { label: 'Phase damping', param: 'lambda', make: phaseDamping },
} as const;
export type ChannelName = keyof typeof CHANNELS;

/** Sum_k K_k^dagger K_k should equal the identity (trace preservation). */
export function isTracePreserving(kraus: Kraus, tol = 1e-9): boolean {
  const d = kraus[0].length;
  const sum = kraus.reduce((acc, k) => matAdd(acc, matMul(dagger(k), k)), zeros(d, d));
  return matApproxEq(sum, identity(d), tol);
}
/** rho -> sum_k K rho K^dagger */
export function applyChannel(rho: Mat, kraus: Kraus): Mat {
  if (!isTracePreserving(kraus)) throw new Error('applyChannel: Kraus operators are not trace preserving');
  if (kraus[0].length !== rho.length) throw new Error('applyChannel: dimension mismatch');
  return kraus.reduce((acc, k) => matAdd(acc, matMul(matMul(k, rho), dagger(k))), zeros(rho.length, rho.length));
}
/** Apply a single-qubit channel to qubit `qubit` (0 = leftmost) of an n-qubit density matrix. */
export function applyChannelOnQubit(rho: Mat, qubit: number, kraus: Kraus): Mat {
  const n = Math.log2(rho.length);
  if (!Number.isInteger(n) || n < 1) throw new Error('applyChannelOnQubit: dimension is not a power of two');
  if (qubit < 0 || qubit >= n) throw new Error('applyChannelOnQubit: qubit out of range');
  if (!isTracePreserving(kraus)) throw new Error('applyChannelOnQubit: Kraus operators are not trace preserving');
  const embed = (k: Mat): Mat => {
    let out: Mat = [[{ re: 1, im: 0 }]];
    for (let i = 0; i < n; i++) out = kron(out, i === qubit ? k : I2);
    return out;
  };
  return kraus.map(embed).reduce((acc, k) => matAdd(acc, matMul(matMul(k, rho), dagger(k))), zeros(rho.length, rho.length));
}
