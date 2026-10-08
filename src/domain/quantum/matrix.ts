import { C, ZERO, add as cadd, mul as cmul, conj, c, abs2, scale as cscale } from './complex';

/** Dense complex matrix, row-major array of rows. Sizes in this app are tiny (<= 2^10 for vectors). */
export type Mat = C[][];
export type Vec = C[];

export const rows = (m: Mat) => m.length;
export const cols = (m: Mat) => (m.length ? m[0].length : 0);

/** Build a matrix from numbers (real) or [re, im] pairs or C objects. */
export function M(data: (number | C | [number, number])[][]): Mat {
  const w = data[0]?.length ?? 0;
  return data.map((r) => {
    if (r.length !== w) throw new Error('Ragged matrix: every row must have the same length');
    return r.map((x) => (typeof x === 'number' ? c(x, 0) : Array.isArray(x) ? c(x[0], x[1]) : x));
  });
}
export function V(data: (number | C | [number, number])[]): Vec {
  return data.map((x) => (typeof x === 'number' ? c(x, 0) : Array.isArray(x) ? c(x[0], x[1]) : x));
}

export const zeros = (r: number, k: number): Mat => Array.from({ length: r }, () => Array.from({ length: k }, () => ZERO));
export const identity = (n: number): Mat => zeros(n, n).map((row, i) => row.map((_, j) => (i === j ? c(1, 0) : ZERO)));

function assertSameShape(a: Mat, b: Mat, what: string) {
  if (rows(a) !== rows(b) || cols(a) !== cols(b))
    throw new Error(`${what}: shape mismatch ${rows(a)}x${cols(a)} vs ${rows(b)}x${cols(b)}`);
}

export function matMul(a: Mat, b: Mat): Mat {
  if (cols(a) !== rows(b)) throw new Error(`matMul: inner dimensions differ (${cols(a)} vs ${rows(b)})`);
  const out = zeros(rows(a), cols(b));
  for (let i = 0; i < rows(a); i++)
    for (let k = 0; k < cols(a); k++) {
      const aik = a[i][k];
      if (aik.re === 0 && aik.im === 0) continue;
      for (let j = 0; j < cols(b); j++) out[i][j] = cadd(out[i][j], cmul(aik, b[k][j]));
    }
  return out;
}
export const matAdd = (a: Mat, b: Mat): Mat => {
  assertSameShape(a, b, 'matAdd');
  return a.map((r, i) => r.map((x, j) => cadd(x, b[i][j])));
};
export const matSub = (a: Mat, b: Mat): Mat => {
  assertSameShape(a, b, 'matSub');
  return a.map((r, i) => r.map((x, j) => c(x.re - b[i][j].re, x.im - b[i][j].im)));
};
export const matScale = (a: Mat, s: number | C): Mat =>
  a.map((r) => r.map((x) => (typeof s === 'number' ? cscale(x, s) : cmul(x, s))));
export const dagger = (a: Mat): Mat => Array.from({ length: cols(a) }, (_, j) => Array.from({ length: rows(a) }, (_, i) => conj(a[i][j])));
export const trace = (a: Mat): C => {
  if (rows(a) !== cols(a)) throw new Error('trace: matrix must be square');
  return a.reduce((s, r, i) => cadd(s, r[i]), ZERO);
};
export function kron(a: Mat, b: Mat): Mat {
  const out = zeros(rows(a) * rows(b), cols(a) * cols(b));
  for (let i = 0; i < rows(a); i++)
    for (let j = 0; j < cols(a); j++)
      for (let k = 0; k < rows(b); k++)
        for (let l = 0; l < cols(b); l++) out[i * rows(b) + k][j * cols(b) + l] = cmul(a[i][j], b[k][l]);
  return out;
}
export const kronAll = (ms: Mat[]): Mat => ms.reduce((acc, m) => kron(acc, m));

export function apply(a: Mat, v: Vec): Vec {
  if (cols(a) !== v.length) throw new Error(`apply: matrix has ${cols(a)} columns but vector has length ${v.length}`);
  return a.map((r) => r.reduce((s, x, j) => cadd(s, cmul(x, v[j])), ZERO));
}
/** <a|b> = sum conj(a_i) b_i */
export function inner(a: Vec, b: Vec): C {
  if (a.length !== b.length) throw new Error('inner: vectors must have equal length');
  return a.reduce((s, x, i) => cadd(s, cmul(conj(x), b[i])), ZERO);
}
export const vecNorm = (v: Vec): number => Math.sqrt(v.reduce((s, x) => s + abs2(x), 0));
export function vecNormalize(v: Vec): Vec {
  const n = vecNorm(v);
  if (n < 1e-14) throw new Error('Cannot normalise the zero vector');
  return v.map((x) => cscale(x, 1 / n));
}
/** |a><b| */
export const outer = (a: Vec, b: Vec): Mat => a.map((x) => b.map((y) => cmul(x, conj(y))));
export const frobenius = (a: Mat): number => Math.sqrt(a.reduce((s, r) => s + r.reduce((t, x) => t + abs2(x), 0), 0));

export function matApproxEq(a: Mat, b: Mat, tol = 1e-9): boolean {
  if (rows(a) !== rows(b) || cols(a) !== cols(b)) return false;
  return a.every((r, i) => r.every((x, j) => Math.abs(x.re - b[i][j].re) <= tol && Math.abs(x.im - b[i][j].im) <= tol));
}
export const isHermitian = (a: Mat, tol = 1e-9): boolean => rows(a) === cols(a) && matApproxEq(a, dagger(a), tol);
export const isUnitary = (a: Mat, tol = 1e-9): boolean =>
  rows(a) === cols(a) && matApproxEq(matMul(dagger(a), a), identity(rows(a)), tol);
export const commutator = (a: Mat, b: Mat): Mat => matSub(matMul(a, b), matMul(b, a));

/** Matrix exponential by scaling-and-squaring with a Taylor series (accurate for the small, bounded-norm matrices used here). */
export function expm(a: Mat): Mat {
  if (rows(a) !== cols(a)) throw new Error('expm: matrix must be square');
  const n = rows(a);
  const nrm = frobenius(a);
  const s = Math.max(0, Math.ceil(Math.log2(Math.max(nrm, 1e-12))) + 1);
  const scaled = matScale(a, 1 / 2 ** s);
  let term = identity(n);
  let result = identity(n);
  for (let k = 1; k <= 24; k++) {
    term = matScale(matMul(term, scaled), 1 / k);
    result = matAdd(result, term);
  }
  for (let i = 0; i < s; i++) result = matMul(result, result);
  return result;
}
/** exp(-i H t): unitary time-evolution operator for Hermitian H (hbar = 1, so H in angular-frequency units). */
export const evolutionOperator = (h: Mat, t: number): Mat => expm(matScale(h, c(0, -t)));

/** Cyclic Jacobi eigenvalues of a real symmetric matrix. */
function jacobiSymmetric(a: number[][]): number[] {
  const n = a.length;
  const m = a.map((r) => r.slice());
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += m[i][j] * m[i][j];
    if (off < 1e-26) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(m[p][q]) < 1e-300) continue;
        const theta = (m[q][q] - m[p][p]) / (2 * m[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const cs = 1 / Math.sqrt(t * t + 1);
        const sn = t * cs;
        for (let k = 0; k < n; k++) {
          const kp = m[k][p];
          const kq = m[k][q];
          m[k][p] = cs * kp - sn * kq;
          m[k][q] = sn * kp + cs * kq;
        }
        for (let k = 0; k < n; k++) {
          const pk = m[p][k];
          const qk = m[q][k];
          m[p][k] = cs * pk - sn * qk;
          m[q][k] = sn * pk + cs * qk;
        }
      }
  }
  return m.map((r, i) => r[i]);
}

/**
 * Eigenvalues (ascending) of a Hermitian matrix H = A + iB. Uses the real symmetric embedding
 * [[A, -B],[B, A]], whose spectrum is that of H with every eigenvalue doubled.
 */
export function hermitianEigenvalues(h: Mat, tol = 1e-8): number[] {
  if (!isHermitian(h, tol)) throw new Error('hermitianEigenvalues: matrix is not Hermitian within tolerance');
  const n = rows(h);
  const big: number[][] = Array.from({ length: 2 * n }, () => new Array(2 * n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      big[i][j] = h[i][j].re;
      big[i + n][j + n] = h[i][j].re;
      big[i][j + n] = -h[i][j].im;
      big[i + n][j] = h[i][j].im;
    }
  const ev = jacobiSymmetric(big).sort((x, y) => x - y);
  return ev.filter((_, i) => i % 2 === 0);
}

/** Spectral (operator) norm: sqrt of the largest eigenvalue of A^dagger A. */
export function spectralNorm(a: Mat): number {
  const g = matMul(dagger(a), a);
  const ev = hermitianEigenvalues(g, 1e-6);
  return Math.sqrt(Math.max(0, ev[ev.length - 1]));
}
