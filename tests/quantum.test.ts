import { describe, it, expect } from 'vitest';
import * as Q from '../src/domain/quantum';

const close = (a: number, b: number, tol = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe('matrices', () => {
  it('Pauli matrices are Hermitian, unitary, square to identity, and anticommute', () => {
    for (const P of [Q.X, Q.Y, Q.Z]) {
      expect(Q.isHermitian(P)).toBe(true);
      expect(Q.isUnitary(P)).toBe(true);
      expect(Q.matApproxEq(Q.matMul(P, P), Q.I2)).toBe(true);
    }
    expect(Q.matApproxEq(Q.matMul(Q.X, Q.Y), Q.matScale(Q.Z, Q.c(0, 1)))).toBe(true); // XY = iZ
    expect(Q.matApproxEq(Q.matAdd(Q.matMul(Q.X, Z_()), Q.matMul(Z_(), Q.X)), Q.zeros(2, 2))).toBe(true);
  });
  it('kron respects ordering (first factor is most significant)', () => {
    const xz = Q.kron(Q.X, Q.Z);
    const out = Q.apply(xz, Q.ket('00')); // X|0> (x) Z|0> = |1>|0>
    expect(Q.probabilities(out)).toEqual([0, 0, 1, 0]);
  });
  it('rejects mismatched shapes', () => {
    expect(() => Q.matMul(Q.kron(Q.X, Q.X), Q.X)).toThrow();
    expect(() => Q.ket('02')).toThrow();
  });
  it('expm of -i theta X/2 equals RX(theta)', () => {
    const th = 1.234;
    const u = Q.expm(Q.matScale(Q.X, Q.c(0, -th / 2)));
    expect(Q.matApproxEq(u, Q.rx(th), 1e-10)).toBe(true);
    expect(Q.isUnitary(u, 1e-10)).toBe(true);
  });
  it('Hermitian eigenvalues of Pauli sums', () => {
    const ev = Q.hermitianEigenvalues(Q.matAdd(Q.X, Q.Z));
    close(ev[0], -Math.SQRT2);
    close(ev[1], Math.SQRT2);
    const evY = Q.hermitianEigenvalues(Q.Y);
    close(evY[0], -1);
    close(evY[1], 1);
    expect(() => Q.hermitianEigenvalues(Q.M([[1, 1], [0, 1]]))).toThrow();
  });
});
const Z_ = () => Q.Z;

describe('single-qubit states', () => {
  it('Bloch mapping round-trips and normalises', () => {
    const psi = Q.blochToState(0.8, 2.1);
    expect(Q.isNormalized(psi)).toBe(true);
    const b = Q.blochFromKet(psi);
    close(b.x, Math.sin(0.8) * Math.cos(2.1));
    close(b.y, Math.sin(0.8) * Math.sin(2.1));
    close(b.z, Math.cos(0.8));
  });
  it('global phase does not change probabilities or Bloch vector; relative phase does', () => {
    const psi = Q.ketPlus();
    const g = psi.map((a) => Q.mul(a, Q.expi(0.7)));
    expect(Q.equalUpToGlobalPhase(psi, g)).toBe(true);
    const rel = Q.apply(Q.phaseGate(Math.PI / 2), psi);
    expect(Q.equalUpToGlobalPhase(psi, rel)).toBe(false);
    close(Q.blochFromKet(rel).y, 1);
    close(Q.blochFromKet(psi).x, 1);
  });
  it('H maps |0> to |+> and is self-inverse; HZH = X', () => {
    expect(Q.equalUpToGlobalPhase(Q.apply(Q.H, Q.ket('0')), Q.ketPlus())).toBe(true);
    expect(Q.matApproxEq(Q.matMul(Q.H, Q.H), Q.I2)).toBe(true);
    expect(Q.matApproxEq(Q.matMul(Q.matMul(Q.H, Q.Z), Q.H), Q.X)).toBe(true);
  });
  it('S^2 = Z, T^2 = S', () => {
    expect(Q.matApproxEq(Q.matMul(Q.S, Q.S), Q.Z)).toBe(true);
    expect(Q.matApproxEq(Q.matMul(Q.T, Q.T), Q.S)).toBe(true);
  });
});

describe('circuits and entanglement', () => {
  const bell = () => Q.simulate(2, [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }]);
  it('builds the Bell state (|00>+|11>)/sqrt2', () => {
    const p = Q.probabilities(bell());
    close(p[0], 0.5); close(p[3], 0.5); close(p[1], 0); close(p[2], 0);
  });
  it('reduced state is maximally mixed, purity 1/2, entropy 1 bit; Schmidt rank 2', () => {
    const rhoA = Q.reducedState(bell(), [0]);
    expect(Q.matApproxEq(rhoA, Q.matScale(Q.I2, 0.5))).toBe(true);
    close(Q.purity(rhoA), 0.5);
    close(Q.vonNeumannEntropy(rhoA), 1, 1e-6);
    expect(Q.schmidtCoefficients(bell(), 1)).toHaveLength(2);
    close(Q.entanglementEntropy(bell(), 1), 1, 1e-6);
  });
  it('product states have zero entanglement entropy', () => {
    const prod = Q.simulate(2, [{ gate: 'H', targets: [0] }]);
    close(Q.entanglementEntropy(prod, 1), 0, 1e-6);
    expect(Q.schmidtCoefficients(prod, 1)).toHaveLength(1);
  });
  it('correlators: <ZZ> = <XX> = 1 for Phi+, local <ZI> = 0', () => {
    const rho = Q.densityFromKet(bell());
    close(Q.expectationRho(Q.kron(Q.Z, Q.Z), rho), 1);
    close(Q.expectationRho(Q.kron(Q.X, Q.X), rho), 1);
    close(Q.expectationRho(Q.kron(Q.Z, Q.I2), rho), 0);
  });
  it('control/target ordering: CNOT(0->1) on |10> gives |11>; reversed targets act the other way', () => {
    expect(Q.probabilities(Q.simulate(2, [{ gate: 'X', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }]))[3]).toBeCloseTo(1);
    expect(Q.probabilities(Q.simulate(2, [{ gate: 'X', targets: [0] }, { gate: 'CNOT', targets: [1, 0] }]))[2]).toBeCloseTo(1);
  });
  it('circuit unitaries are unitary and gate on non-adjacent qubits works', () => {
    const ops: Q.Op[] = [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 2] }, { gate: 'T', targets: [1] }];
    expect(Q.isUnitary(Q.circuitUnitary(3, ops))).toBe(true);
    const ghz = Q.simulate(3, ops.slice(0, 2));
    close(Q.probabilities(ghz)[0], 0.5); close(Q.probabilities(ghz)[5], 0.5);
  });
  it('validates ops', () => {
    expect(() => Q.simulate(2, [{ gate: 'CNOT', targets: [0, 0] }])).toThrow();
    expect(() => Q.simulate(2, [{ gate: 'H', targets: [2] }])).toThrow();
    expect(() => Q.simulate(2, [{ gate: 'RX', targets: [0] }])).toThrow();
    expect(() => Q.simulate(11, [])).toThrow();
  });
  it('partial trace of a product state returns the factors', () => {
    const a = Q.densityFromKet(Q.blochToState(0.4, 0.3));
    const b = Q.densityFromKet(Q.blochToState(1.9, -1));
    const rho = Q.kron(a, b);
    expect(Q.matApproxEq(Q.partialTrace(rho, [2, 2], [0]), a)).toBe(true);
    expect(Q.matApproxEq(Q.partialTrace(rho, [2, 2], [1]), b)).toBe(true);
  });
});

describe('measurement', () => {
  it('post-measurement state of a Bell pair collapses the partner', () => {
    const bell = Q.simulate(2, [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }]);
    const r = Q.postMeasurement(bell, 0, 1);
    close(r.prob, 0.5);
    expect(Q.probabilities(r.state!)[3]).toBeCloseTo(1);
  });
  it('seeded sampling is reproducible and close to the probabilities', () => {
    const a = Q.sampleCounts([0.5, 0.5], 4000, Q.makeRng(7));
    const b = Q.sampleCounts([0.5, 0.5], 4000, Q.makeRng(7));
    expect(a).toEqual(b);
    expect(Math.abs(a[0] / 4000 - 0.5)).toBeLessThan(0.05);
    expect(() => Q.sampleCounts([0.9, 0.3], 10, Q.makeRng(1))).toThrow();
  });
});

describe('channels', () => {
  it('all channels are trace preserving', () => {
    for (const ch of Object.values(Q.CHANNELS)) expect(Q.isTracePreserving(ch.make(0.37))).toBe(true);
    expect(() => Q.bitFlip(1.2)).toThrow();
  });
  it('bit flip on |0> with p gives z = 1-2p', () => {
    const rho = Q.applyChannel(Q.densityFromKet(Q.ket('0')), Q.bitFlip(0.2));
    close(Q.blochFromRho(rho).z, 0.6);
  });
  it('phase flip on |+> shrinks x by 1-2p; depolarizing shrinks by 1-p; amplitude damping drives to |0>', () => {
    const plus = Q.densityFromKet(Q.ketPlus());
    close(Q.blochFromRho(Q.applyChannel(plus, Q.phaseFlip(0.1))).x, 0.8);
    close(Q.blochFromRho(Q.applyChannel(plus, Q.depolarizing(0.3))).x, 0.7);
    const one = Q.densityFromKet(Q.ket('1'));
    const ad = Q.blochFromRho(Q.applyChannel(one, Q.amplitudeDamping(0.25)));
    close(ad.z, -0.5);
    const full = Q.blochFromRho(Q.applyChannel(one, Q.amplitudeDamping(1)));
    close(full.z, 1);
  });
  it('purity decreases under noise and entropy increases', () => {
    const plus = Q.densityFromKet(Q.ketPlus());
    const noisy = Q.applyChannel(plus, Q.phaseFlip(0.5));
    close(Q.purity(plus), 1);
    close(Q.purity(noisy), 0.5);
    expect(Q.isDensityMatrix(noisy)).toBe(true);
    close(Q.vonNeumannEntropy(noisy), 1, 1e-6);
  });
  it('local noise on one half of a Bell pair keeps it a valid density matrix', () => {
    const bell = Q.densityFromKet(Q.simulate(2, [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }]));
    const out = Q.applyChannelOnQubit(bell, 1, Q.depolarizing(1));
    expect(Q.isDensityMatrix(out)).toBe(true);
    close(Q.purity(out), 0.25, 1e-8); // I/2 (x) I/2
  });
});

describe('Hamiltonians and Trotterisation', () => {
  const tfim: Q.PauliTerm[] = [
    { coeff: -1, pauli: 'ZZ' },
    { coeff: -0.7, pauli: 'XI' },
    { coeff: -0.7, pauli: 'IX' },
  ];
  it('single-spin H = (w/2) Z has spectrum +-w/2', () => {
    const ev = Q.spectrum([{ coeff: 1.5, pauli: 'Z' }], 1);
    close(ev[0], -1.5); close(ev[1], 1.5);
  });
  it('two-spin Ising ground energy matches the closed form for h=0 limit', () => {
    const ev = Q.spectrum([{ coeff: -1, pauli: 'ZZ' }], 2);
    expect(ev.map((x) => +x.toFixed(9))).toEqual([-1, -1, 1, 1]);
  });
  it('exact propagator is unitary and conserves energy', () => {
    const u = Q.exactPropagator(tfim, 2, 1.7);
    expect(Q.isUnitary(u, 1e-9)).toBe(true);
    const h = Q.buildHamiltonian(tfim, 2);
    const psi = Q.ket('01');
    const e0 = Q.expectation(h, psi);
    close(Q.expectation(h, Q.apply(u, psi)), e0, 1e-9);
  });
  it('commuting terms: Trotter is exact', () => {
    const terms: Q.PauliTerm[] = [{ coeff: 0.9, pauli: 'ZI' }, { coeff: -0.4, pauli: 'ZZ' }];
    expect(Q.trotterError(terms, 2, 2.0, 1, 1)).toBeLessThan(1e-9);
  });
  it('first-order error scales ~1/steps, second-order ~1/steps^2', () => {
    const steps = [4, 8, 16, 32];
    const e1 = steps.map((s) => Q.trotterError(tfim, 2, 1, s, 1));
    const e2 = steps.map((s) => Q.trotterError(tfim, 2, 1, s, 2));
    close(Q.logLogSlope(steps, e1)!, -1, 0.1);
    close(Q.logLogSlope(steps, e2)!, -2, 0.15);
    expect(e2[2]).toBeLessThan(e1[2]);
    expect(Q.isUnitary(Q.trotterPropagator(tfim, 2, 1, 8, 2), 1e-9)).toBe(true);
  });
  it('validates Pauli strings and sizes', () => {
    expect(() => Q.buildHamiltonian([{ coeff: 1, pauli: 'ZA' }], 2)).toThrow();
    expect(() => Q.buildHamiltonian([{ coeff: 1, pauli: 'Z' }], 2)).toThrow();
    expect(() => Q.buildHamiltonian([], 2)).toThrow();
    expect(() => Q.trotterPropagator(tfim, 2, 1, 0, 1)).toThrow();
  });
  it('unit conversion: 2 pi rad/us is 1 MHz', () => {
    close(Q.radPerUsToMHz(2 * Math.PI), 1);
    close(Q.radPerUsToNeV(1), 0.6582119569, 1e-6);
  });
});
