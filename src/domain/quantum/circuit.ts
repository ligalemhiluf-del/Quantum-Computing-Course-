import { Vec, Mat, kron, identity, zeros } from './matrix';
import { c, ZERO } from './complex';
import { GATES } from './gates';
import { ket, checkQubitCount } from './states';

export type Op = { gate: string; targets: number[]; params?: number[] };

export function validateOp(op: Op, n: number) {
  const def = GATES[op.gate];
  if (!def) throw new Error(`Unknown gate "${op.gate}"`);
  if (op.targets.length !== def.arity) throw new Error(`${op.gate} acts on ${def.arity} qubit(s), got ${op.targets.length}`);
  if (new Set(op.targets).size !== op.targets.length) throw new Error(`${op.gate}: target qubits must be distinct`);
  if (op.targets.some((t) => !Number.isInteger(t) || t < 0 || t >= n)) throw new Error(`${op.gate}: target out of range for ${n} qubits`);
  if ((op.params?.length ?? 0) !== def.nParams) throw new Error(`${op.gate} needs ${def.nParams} parameter(s)`);
  if (op.params?.some((p) => !Number.isFinite(p))) throw new Error(`${op.gate}: parameters must be finite numbers`);
}

/** Apply a k-qubit gate matrix to `targets` of an n-qubit statevector. targets[0] is the gate's most significant qubit. */
export function applyGateToState(psi: Vec, n: number, u: Mat, targets: number[]): Vec {
  const k = targets.length;
  const bitPos = targets.map((t) => n - 1 - t);
  const out: Vec = psi.map(() => ZERO);
  const dim = psi.length;
  for (let i = 0; i < dim; i++) {
    const amp = psi[i];
    if (amp.re === 0 && amp.im === 0) continue;
    let tb = 0;
    for (let a = 0; a < k; a++) tb = (tb << 1) | ((i >> bitPos[a]) & 1);
    let base = i;
    for (let a = 0; a < k; a++) base &= ~(1 << bitPos[a]);
    for (let ob = 0; ob < 1 << k; ob++) {
      const g = u[ob][tb];
      if (g.re === 0 && g.im === 0) continue;
      let idx = base;
      for (let a = 0; a < k; a++) if ((ob >> (k - 1 - a)) & 1) idx |= 1 << bitPos[a];
      out[idx] = { re: out[idx].re + g.re * amp.re - g.im * amp.im, im: out[idx].im + g.re * amp.im + g.im * amp.re };
    }
  }
  return out;
}

/** Simulate a circuit on |0...0> (or a supplied state). */
export function simulate(n: number, ops: Op[], initial?: Vec): Vec {
  checkQubitCount(n);
  let psi = initial ?? ket('0'.repeat(n));
  if (psi.length !== 2 ** n) throw new Error('simulate: initial state has wrong dimension');
  for (const op of ops) {
    validateOp(op, n);
    psi = applyGateToState(psi, n, GATES[op.gate].matrix(op.params ?? []), op.targets);
  }
  return psi;
}
/** Full unitary of a circuit (columns = images of basis states). Limited to 5 qubits. */
export function circuitUnitary(n: number, ops: Op[]): Mat {
  if (n > 5) throw new Error('circuitUnitary is limited to 5 qubits');
  const dim = 2 ** n;
  const u = zeros(dim, dim);
  for (let col = 0; col < dim; col++) {
    const basis = Array.from({ length: dim }, (_, i) => (i === col ? c(1, 0) : ZERO));
    const col_ = simulate(n, ops, basis);
    for (let r = 0; r < dim; r++) u[r][col] = col_[r];
  }
  return u;
}
export const describeOp = (op: Op): string => {
  const p = op.params?.length ? `(${op.params.map((x) => +x.toFixed(4)).join(', ')})` : '';
  return `${op.gate}${p} on q${op.targets.join(', q')}`;
};
export { kron, identity };
