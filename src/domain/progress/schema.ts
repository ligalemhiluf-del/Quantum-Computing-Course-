/** Versioned local progress schema with runtime validation and migrations. */
export const SCHEMA_VERSION = 1;

export type Context = 'lesson' | 'review' | 'quiz' | 'lab';
export type Attempt = { at: string; correct: boolean; hintLevel: 0 | 1 | 2 | 3; context: Context; selfAssessed: boolean };
export type ActivityProgress = { attempts: Attempt[]; confidence?: 1 | 2 | 3 | 4 | 5; solutionViewed: boolean };
export type LessonStatus = 'not-started' | 'in-progress' | 'completed';
export type LessonProgress = { status: LessonStatus; startedAt?: string; completedAt?: string; lastVisitedAt?: string; sectionsRead: string[] };
export type MasteryLevel = 'none' | 'developing' | 'practiced' | 'secure';
export type Evidence = { activityId: string; at: string; correct: boolean; independent: boolean; selfAssessed: boolean; context: Context };
export type ObjectiveProgress = { level: MasteryLevel; evidence: Evidence[]; lastAttemptAt?: string; lastCorrectAt?: string; nextReviewAt?: string; reviewCorrect: number };
export type Artifact = { id: string; savedAt: string; label: string; params: Record<string, string | number>; summary: string };
export type LabProgress = { runs: number; completed: boolean; completedAt?: string; artifacts: Artifact[]; notes: string };
export type Note = { id: string; title: string; body: string; createdAt: string; updatedAt: string; context?: string };
export type TutorMode = 'tutor-me' | 'check-reasoning' | 'explain-directly' | 'exam-practice';
export type Preferences = {
  tutorMode: TutorMode;
  textSize: 'sm' | 'md' | 'lg' | 'xl';
  reducedMotion: 'system' | 'on';
  theme: 'system' | 'light' | 'dark';
  weeklyTarget: number | null; // activity attempts per week
  remoteTutor: { enabled: boolean; endpoint: string; consent: boolean };
};
export type Research = { paperChecklist: Record<string, boolean>; reproChecklist: Record<string, boolean>; worksheet: Record<string, string> };
export type ProgressRecord = {
  schemaVersion: number;
  learnerId: 'local';
  updatedAt: string;
  lessons: Record<string, LessonProgress>;
  objectives: Record<string, ObjectiveProgress>;
  activities: Record<string, ActivityProgress>;
  labs: Record<string, LabProgress>;
  notes: Note[];
  research: Research;
  preferences: Preferences;
};

export const defaultPreferences = (): Preferences => ({
  tutorMode: 'tutor-me', textSize: 'md', reducedMotion: 'system', theme: 'system', weeklyTarget: null,
  remoteTutor: { enabled: false, endpoint: '', consent: false },
});
export const emptyProgress = (now = new Date().toISOString()): ProgressRecord => ({
  schemaVersion: SCHEMA_VERSION, learnerId: 'local', updatedAt: now,
  lessons: {}, objectives: {}, activities: {}, labs: {}, notes: [],
  research: { paperChecklist: {}, reproChecklist: {}, worksheet: {} },
  preferences: defaultPreferences(),
});

/* ---------- validation ---------- */
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const isIso = (x: unknown): x is string => isStr(x) && !Number.isNaN(Date.parse(x));
const oneOf = <T extends string>(x: unknown, vals: readonly T[]): x is T => isStr(x) && (vals as readonly string[]).includes(x);

export type ValidationResult = { ok: true; value: ProgressRecord; warnings: string[] } | { ok: false; errors: string[] };

/** Migrate older shapes up to SCHEMA_VERSION. Version 0 = pre-release exports without labs/research/preferences. */
export function migrate(raw: unknown): unknown {
  if (!isObj(raw)) return raw;
  let cur: Record<string, unknown> = { ...raw };
  let v = typeof cur.schemaVersion === 'number' ? cur.schemaVersion : 0;
  if (v > SCHEMA_VERSION) return cur; // validate() will reject it
  while (v < SCHEMA_VERSION) {
    if (v === 0) {
      cur = { ...cur, schemaVersion: 1, learnerId: 'local', labs: cur.labs ?? {}, research: cur.research ?? emptyProgress().research, preferences: cur.preferences ?? defaultPreferences(), notes: cur.notes ?? [], objectives: cur.objectives ?? {} };
    }
    v = cur.schemaVersion as number;
  }
  return cur;
}

/** Validate and normalise an unknown value (e.g. imported JSON or stored data). Never throws. */
export function validateProgress(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const raw = migrate(input);
  if (!isObj(raw)) return { ok: false, errors: ['File is not a JSON object.'] };
  if (typeof raw.schemaVersion !== 'number') return { ok: false, errors: ['Missing schemaVersion.'] };
  if (raw.schemaVersion > SCHEMA_VERSION) return { ok: false, errors: [`This file uses schema version ${raw.schemaVersion}, newer than this app (${SCHEMA_VERSION}).`] };
  if (raw.learnerId !== 'local') errors.push('learnerId must be "local".');
  const out = emptyProgress(isIso(raw.updatedAt) ? raw.updatedAt : new Date().toISOString());

  const attemptOk = (a: unknown): a is Attempt =>
    isObj(a) && isIso(a.at) && typeof a.correct === 'boolean' && [0, 1, 2, 3].includes(a.hintLevel as number) && oneOf(a.context, ['lesson', 'review', 'quiz', 'lab'] as const) && typeof a.selfAssessed === 'boolean';

  if (!isObj(raw.activities)) errors.push('activities must be an object.');
  else for (const [id, ap] of Object.entries(raw.activities)) {
    if (!isObj(ap) || !Array.isArray(ap.attempts)) { errors.push(`activities.${id} is malformed.`); continue; }
    const attempts = ap.attempts.filter(attemptOk);
    if (attempts.length !== ap.attempts.length) warnings.push(`Dropped ${ap.attempts.length - attempts.length} malformed attempt(s) in ${id}.`);
    const conf = ap.confidence;
    out.activities[id] = { attempts: attempts.slice(-30), solutionViewed: ap.solutionViewed === true, ...([1, 2, 3, 4, 5].includes(conf as number) ? { confidence: conf as 1 | 2 | 3 | 4 | 5 } : {}) };
  }
  if (!isObj(raw.lessons)) errors.push('lessons must be an object.');
  else for (const [id, lp] of Object.entries(raw.lessons)) {
    if (!isObj(lp) || !oneOf(lp.status, ['not-started', 'in-progress', 'completed'] as const)) { errors.push(`lessons.${id} is malformed.`); continue; }
    out.lessons[id] = {
      status: lp.status, sectionsRead: Array.isArray(lp.sectionsRead) ? lp.sectionsRead.filter(isStr) : [],
      ...(isIso(lp.startedAt) ? { startedAt: lp.startedAt } : {}), ...(isIso(lp.completedAt) ? { completedAt: lp.completedAt } : {}), ...(isIso(lp.lastVisitedAt) ? { lastVisitedAt: lp.lastVisitedAt } : {}),
    };
  }
  // objectives are a derived cache; they are recomputed from attempts by the store, so we accept but do not trust them.
  if (isObj(raw.labs)) for (const [id, lb] of Object.entries(raw.labs)) {
    if (!isObj(lb)) { warnings.push(`Ignored malformed lab ${id}.`); continue; }
    const arts = Array.isArray(lb.artifacts) ? lb.artifacts.filter((a): a is Artifact => isObj(a) && isStr(a.id) && isIso(a.savedAt) && isStr(a.label) && isObj(a.params) && isStr(a.summary)) : [];
    out.labs[id] = { runs: typeof lb.runs === 'number' && lb.runs >= 0 ? Math.floor(lb.runs) : 0, completed: lb.completed === true, notes: isStr(lb.notes) ? lb.notes : '', artifacts: arts.slice(-20), ...(isIso(lb.completedAt) ? { completedAt: lb.completedAt } : {}) };
  }
  if (Array.isArray(raw.notes)) out.notes = raw.notes.filter((n): n is Note => isObj(n) && isStr(n.id) && isStr(n.title) && isStr(n.body) && isIso(n.createdAt) && isIso(n.updatedAt)).map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.createdAt, updatedAt: n.updatedAt, ...(isStr(n.context) ? { context: n.context } : {}) }));
  if (isObj(raw.research)) {
    const bools = (x: unknown) => (isObj(x) ? Object.fromEntries(Object.entries(x).filter(([, v]) => typeof v === 'boolean')) as Record<string, boolean> : {});
    const strs = (x: unknown) => (isObj(x) ? Object.fromEntries(Object.entries(x).filter(([, v]) => isStr(v))) as Record<string, string> : {});
    out.research = { paperChecklist: bools(raw.research.paperChecklist), reproChecklist: bools(raw.research.reproChecklist), worksheet: strs(raw.research.worksheet) };
  }
  if (isObj(raw.preferences)) {
    const p = raw.preferences, d = defaultPreferences();
    out.preferences = {
      tutorMode: oneOf(p.tutorMode, ['tutor-me', 'check-reasoning', 'explain-directly', 'exam-practice'] as const) ? p.tutorMode : d.tutorMode,
      textSize: oneOf(p.textSize, ['sm', 'md', 'lg', 'xl'] as const) ? p.textSize : d.textSize,
      reducedMotion: oneOf(p.reducedMotion, ['system', 'on'] as const) ? p.reducedMotion : d.reducedMotion,
      theme: oneOf(p.theme, ['system', 'light', 'dark'] as const) ? p.theme : d.theme,
      weeklyTarget: typeof p.weeklyTarget === 'number' && p.weeklyTarget > 0 && p.weeklyTarget <= 1000 ? Math.floor(p.weeklyTarget) : null,
      remoteTutor: isObj(p.remoteTutor) ? { enabled: p.remoteTutor.enabled === true, endpoint: isStr(p.remoteTutor.endpoint) ? p.remoteTutor.endpoint : '', consent: p.remoteTutor.consent === true } : d.remoteTutor,
    };
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out, warnings };
}
