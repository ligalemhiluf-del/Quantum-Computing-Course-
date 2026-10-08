import { c, expi, abs2 } from './complex';
import { Mat, M, identity, kron, matScale } from './matrix';

const S2 = Math.SQRT1_2;

export const I2: Mat = identity(2);
export const X: Mat = M([[0, 1], [1, 0]]);
export const Y: Mat = M([[0, [0, -1]], [[0, 1], 0]]);
export const Z: Mat = M([[1, 0], [0, -1]]);
export const H: Mat = M([[S2, S2], [S2, -S2]]);
export const S: Mat = M([[1, 0], [0, [0, 1]]]);
export const Sdg: Mat = M([[1, 0], [0, [0, -1]]]);
export const T: Mat = M([[1, 0], [0, [S2, S2]]]);
export const Tdg: Mat = M([[1, 0], [0, [S2, -S2]]]);

export const phaseGate = (phi: number): Mat => M([[1, 0], [0, expi(phi)]]);
/** R_n(a) = exp(-i a n.sigma / 2) */
export const rx = (a: number): Mat => M([[Math.cos(a / 2), [0, -Math.sin(a / 2)]], [[0, -Math.sin(a / 2)], Math.cos(a / 2)]]);
export const ry = (a: number): Mat => M([[Math.cos(a / 2), -Math.sin(a / 2)], [Math.sin(a / 2), Math.cos(a / 2)]]);
export const rz = (a: number): Mat => M([[expi(-a / 2), 0], [0, expi(a / 2)]]);

/** Two-qubit gates; first target is the most significant bit of the 4x4 matrix (control for CNOT/CZ). */
export const CNOT: Mat = M([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]]);
export const CZ: Mat = M([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1]]);
export const SWAP: Mat = M([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]);

export type GateDef = { name: string; arity: 1 | 2; nParams: number; label: string; matrix: (params: number[]) => Mat };

export const GATES: Record<string, GateDef> = {
  I: { name: 'I', arity: 1, nParams: 0, label: 'Identity', matrix: () => I2 },
  X: { name: 'X', arity: 1, nParams: 0, label: 'Pauli X (bit flip)', matrix: () => X },
  Y: { name: 'Y', arity: 1, nParams: 0, label: 'Pauli Y', matrix: () => Y },
  Z: { name: 'Z', arity: 1, nParams: 0, label: 'Pauli Z (phase flip)', matrix: () => Z },
  H: { name: 'H', arity: 1, nParams: 0, label: 'Hadamard', matrix: () => H },
  S: { name: 'S', arity: 1, nParams: 0, label: 'S = sqrt(Z)', matrix: () => S },
  Sdg: { name: 'Sdg', arity: 1, nParams: 0, label: 'S dagger', matrix: () => Sdg },
  T: { name: 'T', arity: 1, nParams: 0, label: 'T = fourth root of Z', matrix: () => T },
  Tdg: { name: 'Tdg', arity: 1, nParams: 0, label: 'T dagger', matrix: () => Tdg },
  P: { name: 'P', arity: 1, nParams: 1, label: 'Phase(phi)', matrix: (p) => phaseGate(p[0]) },
  RX: { name: 'RX', arity: 1, nParams: 1, label: 'Rotation about x', matrix: (p) => rx(p[0]) },
  RY: { name: 'RY', arity: 1, nParams: 1, label: 'Rotation about y', matrix: (p) => ry(p[0]) },
  RZ: { name: 'RZ', arity: 1, nParams: 1, label: 'Rotation about z', matrix: (p) => rz(p[0]) },
  CNOT: { name: 'CNOT', arity: 2, nParams: 0, label: 'Controlled-NOT (control, target)', matrix: () => CNOT },
  CZ: { name: 'CZ', arity: 2, nParams: 0, label: 'Controlled-Z', matrix: () => CZ },
  SWAP: { name: 'SWAP', arity: 2, nParams: 0, label: 'Swap', matrix: () => SWAP },
};

export const PAULI: Record<'I' | 'X' | 'Y' | 'Z', Mat> = { I: I2, X, Y, Z };

/** Embed a single-qubit operator on qubit q (0 = leftmost / most significant) of an n-qubit register. */
export function embedSingle(op: Mat, q: number, n: number): Mat {
  if (q < 0 || q >= n) throw new Error(`embedSingle: qubit ${q} out of range for n=${n}`);
  let out: Mat = [[c(1, 0)]];
  for (let k = 0; k < n; k++) out = kron(out, k === q ? op : I2);
  return out;
}

export const sigmaVector = (): Mat[] => [X, Y, Z];
export const scaleMat = matScale;
export { abs2 };
