import type { Activity, CourseData } from '../curriculum/types';
import { emptyProgress, validateProgress, SCHEMA_VERSION } from './schema';
import type { Artifact, Attempt, Context, Note, Preferences, ProgressRecord, Research, LessonProgress } from './schema';
import { recomputeAllObjectives } from './mastery';

export const STORAGE_KEY = 'qtutor.progress.v1';
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Local progress store with an injectable storage backend (browser localStorage, or memory in tests). */
export class ProgressStore {
  private state: ProgressRecord;
  private listeners = new Set<() => void>();
  storageError: string | null = null;
  loadWarning: string | null = null;
  constructor(private data: CourseData, private storage: StorageLike | null, private now: () => Date = () => new Date()) {
    this.state = this.load();
  }

  private load(): ProgressRecord {
    if (!this.storage) return this.rebuild(emptyProgress(this.now().toISOString()));
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return this.rebuild(emptyProgress(this.now().toISOString()));
      const res = validateProgress(JSON.parse(raw));
      if (res.ok) return this.rebuild(res.value);
      this.loadWarning = `Saved progress could not be read (${res.errors[0]}). Starting fresh; the unreadable data was left in storage under a backup key.`;
      this.storage.setItem(`${STORAGE_KEY}.backup`, raw);
    } catch (e) {
      this.loadWarning = `Saved progress could not be read (${(e as Error).message}). Starting fresh.`;
    }
    return this.rebuild(emptyProgress(this.now().toISOString()));
  }
  private rebuild(p: ProgressRecord): ProgressRecord {
    return { ...p, objectives: recomputeAllObjectives(p, this.data.modules, this.data.activities) };
  }
  private commit(mut: (p: ProgressRecord) => ProgressRecord) {
    const next = mut(this.state);
    this.state = { ...this.rebuild(next), updatedAt: this.now().toISOString(), schemaVersion: SCHEMA_VERSION };
    if (this.storage) {
      try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state)); this.storageError = null; }
      catch (e) { this.storageError = `Could not save progress in this browser (${(e as Error).message}). Export your data from Settings to keep it.`; }
    }
    this.listeners.forEach((l) => l());
  }

  getState = (): ProgressRecord => this.state;
  subscribe = (l: () => void) => { this.listeners.add(l); return () => this.listeners.delete(l); };

  /* ---- lessons ---- */
  private touchLesson(p: ProgressRecord, id: string, patch: Partial<LessonProgress> = {}): ProgressRecord {
    const cur = p.lessons[id] ?? { status: 'not-started', sectionsRead: [] };
    const t = this.now().toISOString();
    return { ...p, lessons: { ...p.lessons, [id]: { ...cur, ...patch, lastVisitedAt: t } } };
  }
  /** Visiting a lesson records the visit time only; status stays "not-started" until the learner does something. */
  visitLesson(id: string) { this.commit((p) => this.touchLesson(p, id)); }
  markSectionRead(lessonId: string, sectionId: string) {
    const cur = this.state.lessons[lessonId];
    if (cur?.sectionsRead.includes(sectionId)) return;
    this.commit((p) => {
      const lp = p.lessons[lessonId] ?? { status: 'not-started' as const, sectionsRead: [] };
      const started = this.now().toISOString();
      return this.touchLesson(p, lessonId, { sectionsRead: [...lp.sectionsRead, sectionId], status: lp.status === 'completed' ? 'completed' : 'in-progress', startedAt: lp.startedAt ?? started });
    });
  }
  completeLesson(id: string) {
    this.commit((p) => this.touchLesson(p, id, { status: 'completed', completedAt: this.now().toISOString(), startedAt: p.lessons[id]?.startedAt ?? this.now().toISOString() }));
  }
  reopenLesson(id: string) { this.commit((p) => this.touchLesson(p, id, { status: 'in-progress', completedAt: undefined })); }

  /* ---- activities ---- */
  recordAttempt(activity: Activity, args: { correct: boolean; hintLevel: 0 | 1 | 2 | 3; context: Context; selfAssessed: boolean }) {
    const attempt: Attempt = { at: this.now().toISOString(), ...args };
    this.commit((p) => {
      const prev = p.activities[activity.id] ?? { attempts: [], solutionViewed: false };
      const withAct = { ...p, activities: { ...p.activities, [activity.id]: { ...prev, attempts: [...prev.attempts, attempt].slice(-30), solutionViewed: prev.solutionViewed || args.hintLevel >= 3 } } };
      return args.context === 'lesson' && this.data.lessons.some((l) => l.id === activity.ownerId)
        ? this.touchLesson(withAct, activity.ownerId, { status: withAct.lessons[activity.ownerId]?.status === 'completed' ? 'completed' : 'in-progress', startedAt: withAct.lessons[activity.ownerId]?.startedAt ?? attempt.at })
        : withAct;
    });
  }
  setConfidence(activityId: string, confidence: 1 | 2 | 3 | 4 | 5) {
    this.commit((p) => {
      const prev = p.activities[activityId] ?? { attempts: [], solutionViewed: false };
      return { ...p, activities: { ...p.activities, [activityId]: { ...prev, confidence } } };
    });
  }

  /* ---- labs ---- */
  private lab(p: ProgressRecord, id: string) { return p.labs[id] ?? { runs: 0, completed: false, artifacts: [], notes: '' }; }
  recordLabRun(id: string) { this.commit((p) => ({ ...p, labs: { ...p.labs, [id]: { ...this.lab(p, id), runs: this.lab(p, id).runs + 1 } } })); }
  saveLabArtifact(id: string, a: Omit<Artifact, 'id' | 'savedAt'>) {
    this.commit((p) => ({ ...p, labs: { ...p.labs, [id]: { ...this.lab(p, id), artifacts: [...this.lab(p, id).artifacts, { ...a, id: uid('art'), savedAt: this.now().toISOString() }].slice(-20) } } }));
  }
  deleteLabArtifact(id: string, artId: string) { this.commit((p) => ({ ...p, labs: { ...p.labs, [id]: { ...this.lab(p, id), artifacts: this.lab(p, id).artifacts.filter((x) => x.id !== artId) } } })); }
  setLabNotes(id: string, notes: string) { this.commit((p) => ({ ...p, labs: { ...p.labs, [id]: { ...this.lab(p, id), notes } } })); }
  setLabCompleted(id: string, completed: boolean) { this.commit((p) => ({ ...p, labs: { ...p.labs, [id]: { ...this.lab(p, id), completed, completedAt: completed ? this.now().toISOString() : undefined } } })); }

  /* ---- notes / research / prefs ---- */
  addNote(title: string, body: string, context?: string): string {
    const id = uid('note');
    const t = this.now().toISOString();
    this.commit((p) => ({ ...p, notes: [...p.notes, { id, title, body, createdAt: t, updatedAt: t, ...(context ? { context } : {}) }] }));
    return id;
  }
  updateNote(id: string, patch: Partial<Pick<Note, 'title' | 'body'>>) { this.commit((p) => ({ ...p, notes: p.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: this.now().toISOString() } : n)) })); }
  deleteNote(id: string) { this.commit((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) })); }
  setResearch(patch: (r: Research) => Research) { this.commit((p) => ({ ...p, research: patch(p.research) })); }
  setPreferences(patch: Partial<Preferences>) { this.commit((p) => ({ ...p, preferences: { ...p.preferences, ...patch } })); }

  /* ---- export / import / reset ---- */
  exportJSON(): string { return JSON.stringify(this.state, null, 2); }
  importJSON(text: string): { ok: true; warnings: string[] } | { ok: false; errors: string[] } {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return { ok: false, errors: ['File is not valid JSON.'] }; }
    const res = validateProgress(parsed);
    if (!res.ok) return res;
    this.commit(() => res.value);
    return { ok: true, warnings: res.warnings };
  }
  /** Reset all learning data. Preferences are kept unless `includePreferences`. */
  reset(includePreferences = false) {
    this.commit((p) => ({ ...emptyProgress(this.now().toISOString()), preferences: includePreferences ? emptyProgress().preferences : p.preferences }));
  }
}
