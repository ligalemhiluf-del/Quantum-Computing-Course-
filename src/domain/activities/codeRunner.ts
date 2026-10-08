import type { CodeTest, Activity } from '../curriculum/types';
import * as Q from '../quantum';
import type { GradeResult } from './grade';

export type TestOutcome = { label: string; ok: boolean; value?: unknown; error?: string };
export type CodeRunResult = { outcomes: TestOutcome[]; fatal?: string };

const norm = (x: unknown): unknown => {
  if (x && typeof x === 'object' && !Array.isArray(x) && 're' in (x as object) && 'im' in (x as object)) return [(x as Q.C).re, (x as Q.C).im];
  if (Array.isArray(x)) return x.map(norm);
  return x;
};
export function approxDeepEqual(actual: unknown, expected: unknown, tol: number): boolean {
  const a = norm(actual);
  const e = norm(expected);
  if (typeof e === 'number') return typeof a === 'number' && Math.abs(a - e) <= tol;
  if (Array.isArray(e)) return Array.isArray(a) && a.length === e.length && e.every((x, i) => approxDeepEqual(a[i], x, tol));
  return a === e;
}

/**
 * Evaluate learner source (must define `solve`) against tests. Synchronous and used both in tests and inside the Web Worker.
 * The source is evaluated with `new Function` and receives the quantum library as `Q`; it is the learner's own code running in their own browser tab/worker.
 */
export function runCodeTests(source: string, tests: CodeTest[]): CodeRunResult {
  let solve: ((...args: unknown[]) => unknown) | undefined;
  try {
    solve = new Function('Q', `"use strict";\n${source}\n;return typeof solve === "function" ? solve : undefined;`)(Q) as typeof solve;
  } catch (e) {
    return { outcomes: [], fatal: `Your code did not load: ${(e as Error).message}` };
  }
  if (!solve) return { outcomes: [], fatal: 'Define a function named `solve` (see the starter code).' };
  const outcomes = tests.map((t): TestOutcome => {
    try {
      const value = solve!(...structuredClone(t.args));
      return { label: t.label, ok: approxDeepEqual(value, t.expected, t.tol ?? 1e-6), value: norm(value) };
    } catch (e) {
      return { label: t.label, ok: false, error: (e as Error).message };
    }
  });
  return { outcomes };
}

export function gradeCodeRun(a: Activity, run: CodeRunResult): GradeResult {
  if (run.fatal) return { status: 'invalid', message: run.fatal };
  const failed = run.outcomes.filter((o) => !o.ok);
  if (failed.length === 0) return { status: 'graded', correct: true, selfAssessed: false, message: a.feedback.correct, conceptTags: a.conceptTags };
  const d = `${run.outcomes.length - failed.length}/${run.outcomes.length} tests pass. First failure: "${failed[0].label}"${failed[0].error ? ` (error: ${failed[0].error})` : ` — your function returned ${JSON.stringify(failed[0].value)}`}.`;
  return { status: 'graded', correct: false, selfAssessed: false, message: `${a.feedback.incorrect} ${d}`, diagnosis: d, conceptTags: a.conceptTags };
}

/** Run in a Web Worker with a timeout so an infinite loop cannot freeze the page. */
export function runCodeInWorker(source: string, tests: CodeTest[], timeoutMs = 3000): Promise<CodeRunResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./codeWorker.ts', import.meta.url), { type: 'module' });
    } catch {
      resolve({ outcomes: [], fatal: 'Web Workers are unavailable in this browser, so code activities cannot run here.' });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ outcomes: [], fatal: `Your code ran longer than ${timeoutMs / 1000}s and was stopped (is there an infinite loop?).` });
    }, timeoutMs);
    worker.onmessage = (ev: MessageEvent<CodeRunResult>) => { clearTimeout(timer); worker.terminate(); resolve(ev.data); };
    worker.onerror = (ev) => { clearTimeout(timer); worker.terminate(); resolve({ outcomes: [], fatal: `Worker error: ${ev.message}` }); };
    worker.postMessage({ source, tests });
  });
}
