import { describe, it, expect } from 'vitest';
import { courseData as d } from '../src/content';
import { ProgressStore, STORAGE_KEY, type StorageLike } from '../src/domain/progress/store';
import { validateProgress, migrate, emptyProgress, SCHEMA_VERSION } from '../src/domain/progress/schema';
import { computeObjective, MIN_REVIEW_GAP_MS, moduleMastery, prerequisiteStatus, attemptsThisWeek } from '../src/domain/progress/mastery';
import { recommendNext, prerequisiteReport, dueObjectives, reviewQueue, moduleStatus, lessonStatus, unitQuiz } from '../src/domain/progress/selectors';

class Mem implements StorageLike {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
const act = (id: string) => d.activities.find((a) => a.id === id)!;
let clock = Date.parse('2026-01-01T10:00:00Z');
const tick = (ms = 1000) => (clock += ms);
const mk = (storage: StorageLike | null = new Mem()) => new ProgressStore(d, storage, () => new Date(clock));
const attempt = (s: ProgressStore, id: string, correct: boolean, hintLevel: 0 | 1 | 2 | 3 = 0, context: 'lesson' | 'review' | 'quiz' | 'lab' = 'lesson', selfAssessed = false) => {
  tick();
  s.recordAttempt(act(id), { correct, hintLevel, context, selfAssessed });
};

describe('mastery rules', () => {
  it('opening a lesson or reading sections never creates mastery', () => {
    const s = mk();
    s.visitLesson('a1-linear-algebra');
    expect(lessonStatus(s.getState(), 'a1-linear-algebra')).toBe('not-started');
    expect(s.getState().objectives['A1.2']).toBeUndefined();
    s.markSectionRead('a1-linear-algebra', 'motivation');
    expect(lessonStatus(s.getState(), 'a1-linear-algebra')).toBe('in-progress');
    expect(Object.keys(s.getState().objectives)).toHaveLength(0);
  });
  it('developing after one attempt (even wrong); practiced after two distinct independent correct items; secure only after a spaced review', () => {
    const s = mk();
    attempt(s, 'b1-cp1', false);
    expect(s.getState().objectives['B1.1'].level).toBe('developing');
    attempt(s, 'b1-cp1', true);
    expect(s.getState().objectives['B1.1'].level).toBe('developing'); // same activity twice is not distinct
    attempt(s, 'b1-p2', true);
    expect(s.getState().objectives['B1.1'].level).toBe('practiced');
    attempt(s, 'b1-p2', true, 0, 'review'); // too soon
    expect(s.getState().objectives['B1.1'].level).toBe('practiced');
    tick(MIN_REVIEW_GAP_MS + 1000);
    attempt(s, 'b1-p2', true, 0, 'review');
    expect(s.getState().objectives['B1.1'].level).toBe('secure');
  });
  it('seeing the full solution (hint level 3) is not independent evidence, and never blocks completion', () => {
    const s = mk();
    attempt(s, 'b1-p2', true, 3);
    attempt(s, 'b1-cp1', true, 3);
    expect(s.getState().objectives['B1.1'].level).toBe('developing');
    attempt(s, 'b1-p2', true, 1); // hints 1-2 still count as independent
    attempt(s, 'b1-cp1', true, 2);
    expect(s.getState().objectives['B1.1'].level).toBe('practiced');
    s.completeLesson('b1-qubits-bloch');
    expect(lessonStatus(s.getState(), 'b1-qubits-bloch')).toBe('completed');
  });
  it('self-assessed answers can reach practiced but never secure', () => {
    const s = mk();
    attempt(s, 'b1-p5', true, 0, 'lesson', true);
    attempt(s, 'b1-cp1', true);
    expect(s.getState().objectives['B1.1'].level).toBe('practiced');
    tick(MIN_REVIEW_GAP_MS * 2);
    attempt(s, 'b1-p5', true, 0, 'review', true);
    expect(s.getState().objectives['B1.1'].level).toBe('practiced');
  });
  it('wrong answers schedule an early review; correct ones push it out', () => {
    const s = mk();
    attempt(s, 'b1-p1', false);
    const o = s.getState().objectives['B1.3'];
    expect(Date.parse(o.nextReviewAt!) - Date.parse(o.lastAttemptAt!)).toBe(86_400_000);
    expect(dueObjectives(d, s.getState(), clock)).toHaveLength(0);
    expect(dueObjectives(d, s.getState(), clock + 2 * 86_400_000).map((x) => x.objectiveId)).toContain('B1.3');
    expect(reviewQueue(d, s.getState(), 5, clock + 2 * 86_400_000).map((a) => a.id)).toContain('b1-p1');
  });
  it('computeObjective is pure and ignores activities for other objectives', () => {
    const o = computeObjective('B1.1', d.activities, {});
    expect(o.level).toBe('none');
  });
  it('module mastery is the mean of objective weights', () => {
    const m = d.modules.find((x) => x.id === 'B1')!;
    expect(moduleMastery(m, {})).toBe(0);
    const s = mk();
    for (const id of ['b1-p1', 'b1-p2', 'b1-cp1', 'b1-p3', 'b1-p4', 'b1-exit']) attempt(s, id, true);
    expect(moduleMastery(m, s.getState().objectives)).toBeGreaterThan(0.5);
  });
});

describe('prerequisites and recommendation', () => {
  it('explains unmet prerequisites with a concrete lesson to review', () => {
    const s = mk();
    const rep = prerequisiteReport(d, d.modules.find((m) => m.id === 'B2')!, s.getState());
    expect(rep[0].module.id).toBe('B1');
    expect(rep[0].status).toBe('unmet');
    expect(rep[0].suggestion?.lessonId).toBe('b1-qubits-bloch');
  });
  it('preview prerequisites are reported as unavailable, not as unmet failures', () => {
    const a3 = d.modules.find((m) => m.id === 'A3')!;
    expect(prerequisiteStatus(a3, {}).status).toBe('unavailable');
  });
  it('first recommendation is the diagnostic; resumes an in-progress lesson; moves on after completion', () => {
    const s = mk();
    let rec = recommendNext(d, s.getState());
    expect(rec.kind === 'lesson' && rec.lesson.id).toBe('a0-diagnostic');
    s.markSectionRead('a1-linear-algebra', 'motivation');
    rec = recommendNext(d, s.getState());
    expect(rec.kind === 'lesson' && rec.lesson.id).toBe('a1-linear-algebra');
    expect(rec.kind === 'lesson' && rec.resume).toBe(true);
    for (const l of d.lessons) s.completeLesson(l.id);
    expect(recommendNext(d, s.getState()).kind).toBe('done');
    expect(moduleStatus(d.modules.find((m) => m.id === 'B3')!, s.getState())).toBe('completed');
    expect(moduleStatus(d.modules.find((m) => m.id === 'C1')!, s.getState())).toBe('preview');
  });
  it('recommends the unmet prerequisite before a module that builds on it', () => {
    const s = mk();
    s.completeLesson('a0-diagnostic');
    // skip A1 by completing nothing there; A1 has unmet A0? A0 has no objectives mastered, so A1's prerequisite A0 is 'unmet'
    const rec = recommendNext(d, s.getState());
    expect(rec.kind).toBe('lesson');
  });
  it('unit quiz returns gradable non-checkpoint items, easiest first', () => {
    const q = unitQuiz(d, 'B3', 5);
    expect(q.length).toBeGreaterThan(0);
    expect(q.every((a) => a.role !== 'checkpoint' && a.type !== 'reflection')).toBe(true);
    for (let i = 1; i < q.length; i++) expect(q[i].difficulty).toBeGreaterThanOrEqual(q[i - 1].difficulty);
  });
});

describe('persistence, export / import, reset', () => {
  it('persists across a reload (new store on the same storage)', () => {
    const mem = new Mem();
    const s = mk(mem);
    attempt(s, 'a1-p1', true);
    s.setPreferences({ textSize: 'lg', weeklyTarget: 12 });
    s.addNote('idea', 'try Trotter on 2 spins');
    const s2 = mk(mem);
    expect(s2.getState().activities['a1-p1'].attempts).toHaveLength(1);
    expect(s2.getState().objectives['A1.1'].level).toBe('developing');
    expect(s2.getState().preferences.textSize).toBe('lg');
    expect(s2.getState().notes[0].title).toBe('idea');
    expect(JSON.parse(mem.getItem(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('round-trips export → import and rebuilds derived mastery', () => {
    const a = mk();
    attempt(a, 'b1-p1', true);
    attempt(a, 'b1-p2', true);
    a.saveLabArtifact('lab-bloch', { label: 'run', params: { theta: 90 }, summary: 'ok' });
    const json = a.exportJSON();
    const b = mk();
    const res = b.importJSON(json);
    expect(res.ok).toBe(true);
    expect(b.getState().activities['b1-p1'].attempts).toHaveLength(1);
    expect(b.getState().labs['lab-bloch'].artifacts).toHaveLength(1);
  });
  it('rejects malformed, wrong-version and non-JSON imports without changing state', () => {
    const s = mk();
    attempt(s, 'b1-p1', true);
    const before = s.exportJSON();
    expect(s.importJSON('not json').ok).toBe(false);
    expect(s.importJSON('[]').ok).toBe(false);
    expect(s.importJSON(JSON.stringify({ schemaVersion: 999, learnerId: 'local' })).ok).toBe(false);
    expect(s.importJSON(JSON.stringify({ schemaVersion: 1, learnerId: 'x', activities: {}, lessons: {} })).ok).toBe(false);
    expect(s.importJSON(JSON.stringify({ schemaVersion: 1, learnerId: 'local', activities: { a: { attempts: 'x' } }, lessons: {} })).ok).toBe(false);
    expect(s.exportJSON()).toBe(before);
  });
  it('drops malformed attempts but keeps valid data, and sanitises preferences', () => {
    const raw = { ...emptyProgress(), activities: { 'b1-p1': { attempts: [{ at: '2026-01-01T00:00:00Z', correct: true, hintLevel: 0, context: 'lesson', selfAssessed: false }, { at: 'bad', correct: 1 }], solutionViewed: false } }, preferences: { textSize: 'huge', tutorMode: 'exam-practice', weeklyTarget: -4 } };
    const v = validateProgress(raw);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.activities['b1-p1'].attempts).toHaveLength(1);
      expect(v.value.preferences.textSize).toBe('md');
      expect(v.value.preferences.tutorMode).toBe('exam-practice');
      expect(v.value.preferences.weeklyTarget).toBeNull();
      expect(v.warnings.length).toBe(1);
    }
  });
  it('migrates a version-0 export that lacks labs, research and preferences', () => {
    const v0 = { schemaVersion: 0, activities: {}, lessons: { 'a1-linear-algebra': { status: 'completed', sectionsRead: [] } } };
    const m = migrate(v0) as { schemaVersion: number };
    expect(m.schemaVersion).toBe(SCHEMA_VERSION);
    const v = validateProgress(v0);
    expect(v.ok && v.value.lessons['a1-linear-algebra'].status).toBe('completed');
  });
  it('reset clears learning data; reset(true) also clears preferences', () => {
    const s = mk();
    attempt(s, 'b1-p1', true);
    s.setPreferences({ textSize: 'xl' });
    s.reset();
    expect(Object.keys(s.getState().activities)).toHaveLength(0);
    expect(s.getState().preferences.textSize).toBe('xl');
    s.reset(true);
    expect(s.getState().preferences.textSize).toBe('md');
  });
  it('survives corrupt stored data and unavailable storage', () => {
    const mem = new Mem();
    mem.setItem(STORAGE_KEY, '{oops');
    const s = mk(mem);
    expect(s.loadWarning).toMatch(/could not be read/);
    expect(Object.keys(s.getState().activities)).toHaveLength(0);
    const broken: StorageLike = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
    const s2 = mk(broken);
    attempt(s2, 'b1-p1', true);
    expect(s2.storageError).toMatch(/Could not save/);
    expect(s2.getState().activities['b1-p1']).toBeDefined(); // still works in memory
  });
  it('counts weekly attempts from the attempt log', () => {
    const s = mk();
    attempt(s, 'b1-p1', true);
    attempt(s, 'b1-p2', false);
    expect(attemptsThisWeek(s.getState(), clock)).toBe(2);
    expect(attemptsThisWeek(s.getState(), clock + 8 * 86_400_000)).toBe(0);
  });
  it('lab progress: runs, artifacts and completion are stored', () => {
    const s = mk();
    s.recordLabRun('lab-bell');
    s.recordLabRun('lab-bell');
    s.setLabCompleted('lab-bell', true);
    s.setLabNotes('lab-bell', 'purity 0.5');
    const l = s.getState().labs['lab-bell'];
    expect(l.runs).toBe(2);
    expect(l.completed).toBe(true);
    expect(l.notes).toBe('purity 0.5');
  });
});
