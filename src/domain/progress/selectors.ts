import type { Activity, CourseData, Lesson, Module, Track } from '../curriculum/types';
import type { LessonStatus, ProgressRecord } from './schema';
import { isDue, moduleMastery, prerequisiteStatus, PrereqStatus } from './mastery';

export const lessonStatus = (p: ProgressRecord, id: string): LessonStatus => p.lessons[id]?.status ?? 'not-started';
export type ModuleStatus = 'preview' | 'not-started' | 'in-progress' | 'completed';

export function moduleStatus(m: Module, p: ProgressRecord): ModuleStatus {
  if (m.lessonIds.length === 0) return 'preview'; // lab-only modules are still previews: the lesson content is not written
  const sts = m.lessonIds.map((l) => lessonStatus(p, l));
  if (sts.length > 0 && sts.every((s) => s === 'completed')) return 'completed';
  const touched = sts.some((s) => s !== 'not-started') || m.labIds.some((l) => (p.labs[l]?.runs ?? 0) > 0) || m.objectives.some((o) => p.objectives[o.id]);
  return touched ? 'in-progress' : 'not-started';
}

export type PrereqReport = { module: Module; status: PrereqStatus; mastery: number; suggestion?: { lessonId: string; title: string } };
/** For each prerequisite of `m`, its status and a concrete review lesson (or the diagnostic) when unmet. */
export function prerequisiteReport(d: CourseData, m: Module, p: ProgressRecord): PrereqReport[] {
  return m.prerequisiteModuleIds.map((id) => {
    const pre = d.modules.find((x) => x.id === id)!;
    const { status, mastery } = prerequisiteStatus(pre, p.objectives);
    let suggestion: PrereqReport['suggestion'];
    if (status === 'unmet' || status === 'partial') {
      const lesson = pre.lessonIds.map((l) => d.lessons.find((x) => x.id === l)!).find((l) => lessonStatus(p, l.id) !== 'completed') ?? d.lessons.find((l) => l.id === pre.lessonIds[0]);
      if (lesson) suggestion = { lessonId: lesson.id, title: lesson.title };
    }
    return { module: pre, status, mastery, suggestion };
  });
}
export const unmetPrerequisites = (d: CourseData, m: Module, p: ProgressRecord): PrereqReport[] =>
  prerequisiteReport(d, m, p).filter((r) => r.status === 'unmet' || r.status === 'partial');

export type Recommendation =
  | { kind: 'lesson'; lesson: Lesson; module: Module; reason: string; resume: boolean }
  | { kind: 'done'; reason: string };

/** First available module in the recommended order that still has an unfinished lesson. If a prerequisite is clearly unmet, recommend that first. */
export function recommendNext(d: CourseData, p: ProgressRecord): Recommendation {
  // Resume the most recently visited in-progress lesson if there is one.
  const inProg = d.lessons
    .filter((l) => lessonStatus(p, l.id) === 'in-progress')
    .sort((a, b) => Date.parse(p.lessons[b.id]?.lastVisitedAt ?? '0') - Date.parse(p.lessons[a.id]?.lastVisitedAt ?? '0'))[0];
  if (inProg) return { kind: 'lesson', lesson: inProg, module: d.modules.find((m) => m.id === inProg.moduleId)!, reason: 'You started this lesson — pick up where you left off.', resume: true };
  for (const id of d.course.recommendedOrder) {
    const m = d.modules.find((x) => x.id === id)!;
    if (m.availability !== 'available' || m.lessonIds.length === 0) continue;
    const next = m.lessonIds.map((l) => d.lessons.find((x) => x.id === l)!).find((l) => lessonStatus(p, l.id) !== 'completed');
    if (!next) continue;
    const unmet = unmetPrerequisites(d, m, p).filter((r) => r.status === 'unmet' && r.suggestion);
    if (unmet.length && lessonStatus(p, next.id) === 'not-started') {
      const r = unmet[0];
      const lesson = d.lessons.find((l) => l.id === r.suggestion!.lessonId)!;
      return { kind: 'lesson', lesson, module: r.module, reason: `${m.id} (${m.title}) builds on ${r.module.id} (${r.module.title}), which has no evidence yet.`, resume: false };
    }
    return { kind: 'lesson', lesson: next, module: m, reason: p.lessons[next.id] ? 'Next lesson in the recommended sequence.' : id === d.course.recommendedOrder[0] ? 'Start with a short, non-blocking diagnostic to see which refreshers you need.' : 'Next lesson in the recommended sequence.', resume: false };
  }
  return { kind: 'done', reason: 'You have completed every lesson currently authored. Preview modules are listed as planned; try the labs or the research transition page.' };
}

export type DueItem = { objectiveId: string; module: Module; text: string; dueAt: string };
export function dueObjectives(d: CourseData, p: ProgressRecord, now = Date.now()): DueItem[] {
  const out: DueItem[] = [];
  for (const m of d.modules) for (const o of m.objectives) {
    const op = p.objectives[o.id];
    if (op && isDue(op, now)) out.push({ objectiveId: o.id, module: m, text: o.text, dueAt: op.nextReviewAt! });
  }
  return out.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

/** Review queue: one gradable activity per due objective, preferring items answered least recently / incorrectly. */
export function reviewQueue(d: CourseData, p: ProgressRecord, limit = 8, now = Date.now()): Activity[] {
  const chosen: Activity[] = [];
  const used = new Set<string>();
  for (const due of dueObjectives(d, p, now)) {
    const cands = d.activities
      .filter((a) => a.objectiveIds.includes(due.objectiveId) && a.type !== 'reflection' && !used.has(a.id) && (p.activities[a.id]?.attempts.length ?? 0) > 0)
      .sort((a, b) => lastAt(p, a.id) - lastAt(p, b.id));
    const miss = cands.find((a) => p.activities[a.id]?.attempts.slice(-1)[0]?.correct === false);
    const pick = miss ?? cands[0];
    if (pick) { chosen.push(pick); used.add(pick.id); }
    if (chosen.length >= limit) break;
  }
  return chosen;
}
const lastAt = (p: ProgressRecord, id: string) => Date.parse(p.activities[id]?.attempts.slice(-1)[0]?.at ?? '0');

/** A short unit quiz for a module: gradable practice/exit items, easiest first, deterministic. */
export function unitQuiz(d: CourseData, moduleId: string, size = 6): Activity[] {
  const lessonIds = new Set(d.lessons.filter((l) => l.moduleId === moduleId).map((l) => l.id));
  return d.activities
    .filter((a) => lessonIds.has(a.ownerId) && a.role !== 'checkpoint' && a.type !== 'reflection' && a.type !== 'code')
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, size);
}

export function trackProgress(d: CourseData, t: Track, p: ProgressRecord) {
  const mods = t.moduleIds.map((id) => d.modules.find((m) => m.id === id)!);
  const authored = mods.filter((m) => m.lessonIds.length > 0);
  const lessonIds = authored.flatMap((m) => m.lessonIds);
  const completed = lessonIds.filter((l) => lessonStatus(p, l) === 'completed').length;
  const mastery = authored.length ? authored.reduce((s, m) => s + moduleMastery(m, p.objectives), 0) / authored.length : 0;
  return { modules: mods.length, authoredModules: authored.length, lessons: lessonIds.length, completedLessons: completed, mastery };
}
