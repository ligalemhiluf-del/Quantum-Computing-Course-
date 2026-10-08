/** Minimal complex-number arithmetic. Plain objects keep everything serialisable and transparent. */
export type C = { re: number; im: number };

export const c = (re = 0, im = 0): C => ({ re, im });
export const ZERO: C = c(0, 0);
export const ONE: C = c(1, 0);
export const I_UNIT: C = c(0, 1);

export const add = (a: C, b: C): C => c(a.re + b.re, a.im + b.im);
export const sub = (a: C, b: C): C => c(a.re - b.re, a.im - b.im);
export const mul = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const conj = (a: C): C => c(a.re, -a.im);
export const scale = (a: C, s: number): C => c(a.re * s, a.im * s);
export const abs2 = (a: C): number => a.re * a.re + a.im * a.im;
export const abs = (a: C): number => Math.sqrt(abs2(a));
export const arg = (a: C): number => Math.atan2(a.im, a.re);
/** e^{i phi} */
export const expi = (phi: number): C => c(Math.cos(phi), Math.sin(phi));
export const div = (a: C, b: C): C => {
  const d = abs2(b);
  if (d === 0) throw new Error('Division by zero complex number');
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
export const approxEq = (a: C, b: C, tol = 1e-9): boolean =>
  Math.abs(a.re - b.re) <= tol && Math.abs(a.im - b.im) <= tol;

/** Compact human-readable formatting, e.g. "0.7071 + 0.7071i". */
export function fmt(a: C, digits = 4): string {
  const clean = (x: number) => (Math.abs(x) < 0.5 * 10 ** -digits ? 0 : x);
  const re = clean(a.re);
  const im = clean(a.im);
  const r = +re.toFixed(digits);
  const i = +Math.abs(im).toFixed(digits);
  if (im === 0) return `${r}`;
  if (re === 0) return `${im < 0 ? '-' : ''}${i}i`;
  return `${r} ${im < 0 ? '-' : '+'} ${i}i`;
}
