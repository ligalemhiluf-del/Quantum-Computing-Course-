import type { Activity, ActivityRole, Choice, FeedbackSpec, GateStep, Module, Hint } from '../domain/curriculum/types';

type H = [string, string, string?];
const hints = (h: H): Hint[] => h.filter((x): x is string => !!x).map((text, i) => ({ level: (i + 1) as 1 | 2 | 3, text }));

type Base = { id: string; owner: string; role: ActivityRole; prompt: string; tags: string[]; diff: 1 | 2 | 3; objs: string[]; hints: H; fb: FeedbackSpec };
const base = (b: Base) => ({ id: b.id, ownerId: b.owner, role: b.role, prompt: b.prompt, conceptTags: b.tags, difficulty: b.diff, hints: hints(b.hints), feedback: b.fb, objectiveIds: b.objs });

/** choices: [text, feedback, correct?, misconceptionTag?] — ids a, b, c, d are assigned in order. */
export const mcq = (b: Base & { choices: [string, string, boolean?, string?][] }): Activity => ({
  ...base(b), type: 'mcq',
  answerSpec: { type: 'mcq', choices: b.choices.map(([text, feedback, correct, misconception], i): Choice => ({ id: 'abcdef'[i], text, feedback, ...(correct ? { correct: true } : {}), ...(misconception ? { misconception } : {}) })) },
});
export const numeric = (b: Base & { value: number; tol: number; unit?: string; wrong?: [number, string, number?][] }): Activity => ({
  ...base(b), type: 'numeric',
  answerSpec: { type: 'numeric', value: b.value, tolerance: b.tol, ...(b.unit ? { unit: b.unit } : {}), ...(b.wrong ? { commonWrong: b.wrong.map(([value, diagnosis, tolerance]) => ({ value, diagnosis, ...(tolerance ? { tolerance } : {}) })) } : {}) },
});
export const explain = (b: Base & { reflection?: boolean; rubric: string[]; model: string; min: number; patterns?: [string, string][] }): Activity => ({
  ...base(b), type: b.reflection ? 'reflection' : 'explain',
  answerSpec: { type: b.reflection ? 'reflection' : 'explain', rubric: b.rubric.map((text, i) => ({ id: `r${i + 1}`, text })), modelAnswer: b.model, minTicks: b.min, ...(b.patterns ? { patterns: b.patterns.map(([regex, diagnosis]) => ({ regex, diagnosis })) } : {}) },
});
/** items must be given in the CORRECT order; the UI shuffles them. */
export const order = (b: Base & { items: string[] }): Activity => ({ ...base(b), type: 'order', answerSpec: { type: 'order', items: b.items.map((text, i) => ({ id: `s${i + 1}`, text })) } });
export const match = (b: Base & { pairs: [string, string][] }): Activity => ({ ...base(b), type: 'match', answerSpec: { type: 'match', pairs: b.pairs.map(([left, right], i) => ({ id: `p${i + 1}`, left, right })) } });
export const circuit = (b: Base & { n: number; gates: string[]; max: number; target: [number, number][]; label: string; solution: GateStep[] }): Activity => ({
  ...base(b), type: 'circuit', answerSpec: { type: 'circuit', numQubits: b.n, allowedGates: b.gates, maxGates: b.max, target: b.target, targetLabel: b.label, solution: b.solution },
});
export const code = (b: Base & { starter: string; solution: string; api: string; tests: { label: string; args: unknown[]; expected: unknown; tol?: number }[] }): Activity => ({
  ...base(b), type: 'code', answerSpec: { type: 'code', starter: b.starter, solutionSource: b.solution, api: b.api, tests: b.tests },
});

export type ModuleSeed = Omit<Module, 'objectives' | 'lessonIds' | 'labIds' | 'availability'> & { objectives: string[] };
export const seed = (id: string, trackId: string, title: string, level: Module['level'], minutes: number, prereqs: string[], summary: string, objectives: string[]): ModuleSeed => ({
  id, trackId, title, summary, level, estimatedMinutes: minutes, prerequisiteModuleIds: prereqs, objectives,
});

/** Template tag for lesson text: write ⟦ for a backtick (so inline code does not fight template literals) and use raw LaTeX backslashes. */
export const md = (s: TemplateStringsArray, ...v: unknown[]): string => String.raw(s, ...v).replaceAll('⟦', '`').trim();
