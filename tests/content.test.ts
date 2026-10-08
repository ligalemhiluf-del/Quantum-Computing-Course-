import { describe, it, expect } from 'vitest';
import katex from 'katex';
import { courseData as d } from '../src/content';
import { validateCourseData } from '../src/domain/curriculum/validate';
import { findCycle, topologicalOrder, depths, ancestors } from '../src/domain/curriculum/graph';
import { gradeActivity, parseNumeric } from '../src/domain/activities/grade';
import type { Response } from '../src/domain/activities/grade';
import { runCodeTests, gradeCodeRun } from '../src/domain/activities/codeRunner';
import { extractMath } from '../src/domain/text/markdown';

describe('curriculum structure', () => {
  it('passes structural validation', () => {
    expect(validateCourseData(d)).toEqual([]);
  });
  it('has all five tracks and the 32 specified modules', () => {
    expect(d.tracks.map((t) => t.id)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(d.modules.map((m) => m.id).sort()).toEqual(
      ['A0', 'A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'].sort(),
    );
  });
  it('prerequisite graph is a DAG and ordering respects dependencies', () => {
    expect(findCycle(d.modules)).toBeNull();
    const order = topologicalOrder(d.modules);
    const pos = new Map(order.map((id, i) => [id, i]));
    for (const m of d.modules) for (const p of m.prerequisiteModuleIds) expect(pos.get(p)!).toBeLessThan(pos.get(m.id)!);
    const dep = depths(d.modules);
    expect(dep.A0).toBe(0);
    expect(dep.B2).toBeGreaterThan(dep.B1);
  });
  it('detects cycles in a synthetic graph', () => {
    const cyc = [{ id: 'X', prerequisiteModuleIds: ['Y'] }, { id: 'Y', prerequisiteModuleIds: ['Z'] }, { id: 'Z', prerequisiteModuleIds: ['X'] }];
    expect(findCycle(cyc)).not.toBeNull();
    expect(() => topologicalOrder(cyc)).toThrow(/cycle/i);
  });
  it('encodes the specified dependencies explicitly in data', () => {
    const pre = (id: string) => d.modules.find((m) => m.id === id)!.prerequisiteModuleIds;
    expect(pre('D1')).toEqual(expect.arrayContaining(['A1', 'A2', 'B3']));
    expect(pre('D2')).toEqual(expect.arrayContaining(['D1', 'B5']));
    expect(pre('D3')).toEqual(expect.arrayContaining(['D1', 'D2', 'C1']));
    expect(pre('D7')).toEqual(expect.arrayContaining(['D1', 'D2', 'D3']));
    expect(ancestors(d.modules, 'B6')).toEqual(expect.arrayContaining(['B5', 'B4', 'B3', 'B2', 'B1', 'A1', 'A0']));
    expect(d.modules.filter((m) => m.prerequisiteModuleIds.length > 1).length).toBeGreaterThan(5); // multi-prerequisite modules exist
  });
  it('ships at least 6 complete standard lessons and four labs', () => {
    const std = d.lessons.filter((l) => l.kind === 'standard');
    expect(std.length).toBeGreaterThanOrEqual(6);
    expect(d.labs).toHaveLength(4);
    for (const l of std) {
      const own = d.activities.filter((a) => l.activityIds.includes(a.id));
      expect(own.filter((a) => a.role === 'checkpoint').length).toBeGreaterThanOrEqual(1);
      expect(own.filter((a) => a.role === 'exit')).toHaveLength(1);
    }
  });
  it('every activity concept tag has tutor knowledge, and every misconception pattern compiles', () => {
    const tags = new Set(d.tutorConcepts.map((c) => c.tag));
    for (const a of d.activities) for (const t of a.conceptTags) expect(tags.has(t), `${a.id} -> ${t}`).toBe(true);
    for (const l of d.lessons) for (const t of l.conceptTags) expect(tags.has(t), `${l.id} -> ${t}`).toBe(true);
    for (const m of d.misconceptions) { expect(() => new RegExp(m.regex, 'i')).not.toThrow(); expect(tags.has(m.tag)).toBe(true); }
  });
});

describe('authored answer keys are self-consistent', () => {
  for (const a of d.activities) {
    it(`${a.id} (${a.type}): key is graded correct`, () => {
      const s = a.answerSpec;
      let r: Response | null = null;
      if (s.type === 'mcq') {
        r = { type: 'mcq', choiceId: s.choices.find((c) => c.correct)!.id };
        for (const c of s.choices.filter((x) => !x.correct)) {
          const g = gradeActivity(a, { type: 'mcq', choiceId: c.id });
          expect(g.status === 'graded' && !g.correct).toBe(true);
        }
      } else if (s.type === 'numeric') {
        r = { type: 'numeric', value: String(s.value) };
        for (const w of s.commonWrong ?? []) {
          expect(Math.abs(w.value - s.value), `commonWrong overlaps the right answer in ${a.id}`).toBeGreaterThan(s.tolerance);
          const g = gradeActivity(a, { type: 'numeric', value: String(w.value) });
          expect(g.status === 'graded' && !g.correct && !!g.diagnosis).toBe(true);
        }
      } else if (s.type === 'explain' || s.type === 'reflection') {
        r = { type: s.type, text: s.modelAnswer, ticked: s.rubric.map((x) => x.id) };
        expect(s.minTicks).toBeLessThanOrEqual(s.rubric.length);
        const g = gradeActivity(a, { type: s.type, text: s.modelAnswer, ticked: [] });
        expect(g.status === 'graded' && !g.correct).toBe(true);
        for (const p of s.patterns ?? []) { expect(() => new RegExp(p.regex, 'i')).not.toThrow(); expect(new RegExp(p.regex, 'i').test(s.modelAnswer), `model answer trips its own pattern in ${a.id}`).toBe(false); }
      } else if (s.type === 'order') r = { type: 'order', ids: s.items.map((i) => i.id) };
      else if (s.type === 'match') r = { type: 'match', pairs: Object.fromEntries(s.pairs.map((p) => [p.id, p.id])) };
      else if (s.type === 'circuit') r = { type: 'circuit', gates: s.solution };
      else if (s.type === 'code') {
        const ok = gradeCodeRun(a, runCodeTests(s.solutionSource, s.tests));
        expect(ok.status === 'graded' && ok.correct).toBe(true);
        const starter = gradeCodeRun(a, runCodeTests(s.starter, s.tests));
        expect(starter.status === 'graded' && !starter.correct, 'starter code must not already pass').toBe(true);
        return;
      }
      const g = gradeActivity(a, r!);
      expect(g.status === 'graded' && g.correct).toBe(true);
      if (s.type === 'circuit') expect(s.solution.length).toBeLessThanOrEqual(s.maxGates);
    });
  }
});

describe('numeric parsing', () => {
  it('parses fractions, roots, percentages and rejects junk', () => {
    expect(parseNumeric('1/2')).toBeCloseTo(0.5);
    expect(parseNumeric('1/sqrt(2)')).toBeCloseTo(0.70710678);
    expect(parseNumeric('√2/2')).toBeCloseTo(0.70710678);
    expect(parseNumeric('2sqrt(2)')).toBeCloseTo(2.8284271);
    expect(parseNumeric('50%')).toBeCloseTo(0.5);
    expect(parseNumeric('-3.5e-1')).toBeCloseTo(-0.35);
    expect(parseNumeric('2^3')).toBe(8);
    expect(parseNumeric('4.136 neV', 'neV')).toBeCloseTo(4.136);
    expect(parseNumeric('abc')).toBeNull();
    expect(parseNumeric('')).toBeNull();
    expect(parseNumeric('1/0')).toBeNull();
    expect(parseNumeric('process.exit()')).toBeNull();
  });
});

describe('code runner', () => {
  it('reports load errors, missing solve, runtime errors and infinite-loop-free failures', () => {
    expect(runCodeTests('function solve( {', []).fatal).toMatch(/did not load/);
    expect(runCodeTests('const x = 1;', []).fatal).toMatch(/solve/);
    const r = runCodeTests('function solve(a){ throw new Error("boom"); }', [{ label: 't', args: [1], expected: 1 }]);
    expect(r.outcomes[0].ok).toBe(false);
    expect(r.outcomes[0].error).toBe('boom');
  });
});

describe('all authored LaTeX compiles', () => {
  const skipKeys = new Set(['starter', 'solutionSource', 'api', 'regex']);
  const strings: { path: string; v: string }[] = [];
  const walk = (x: unknown, path: string) => {
    if (typeof x === 'string') strings.push({ path, v: x });
    else if (Array.isArray(x)) x.forEach((y, i) => walk(y, `${path}[${i}]`));
    else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) if (!skipKeys.has(k)) walk(y, `${path}.${k}`);
  };
  walk(d, 'course');
  it('has authored math to check', () => expect(strings.filter((s) => s.v.includes('$')).length).toBeGreaterThan(200));
  it('renders every $...$ and $$...$$ snippet with KaTeX without errors', () => {
    const bad: string[] = [];
    for (const s of strings) {
      if (!s.v.includes('$')) continue;
      for (const tex of extractMath(s.v)) {
        try { katex.renderToString(tex, { throwOnError: true, strict: 'ignore' }); } catch (e) { bad.push(`${s.path}: ${tex} -> ${(e as Error).message}`); }
      }
    }
    expect(bad).toEqual([]);
  });
  it('has no stray control characters (a single-backslash escape such as \\beta in a plain string)', () => {
    const bad = strings.filter((s) => /[\u0008\u0009\u000b\u000c\r]/.test(s.v)).map((s) => s.path);
    expect(bad).toEqual([]);
  });
  it('has no unbalanced dollar signs in prose', () => {
    const bad = strings.filter((s) => s.v.includes('$') && (s.v.replace(/\\\$/g, '').match(/\$/g) ?? []).length % 2 !== 0).map((s) => s.path);
    expect(bad).toEqual([]);
  });
});
