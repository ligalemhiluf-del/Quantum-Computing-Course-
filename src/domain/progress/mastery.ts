import type { Activity, Module } from '../curriculum/types';
import type { ActivityProgress, Attempt, Evidence, MasteryLevel, ObjectiveProgress, ProgressRecord } from './schema';

/** Transparent mastery rules (also documented in the README and shown in the UI):
 *  developing — at least one attempt on an activity mapped to the objective.
 *  practiced  — independent correct answers on >= 2 distinct activities. "Independent" = no full solution revealed (hint level < 3).
 *  secure     — practiced, AND a later correct auto-graded retrieval in review mode at least MIN_REVIEW_GAP_MS after becoming practiced.
 *  Opening a page or spending time never changes mastery. Self-assessed answers can reach "practiced" but never "secure". */
export const MIN_REVIEW_GAP_MS = 20 * 60 * 60 * 1000;
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21, 60];
export const PREREQ_THRESHOLD = 0.5;
export const LEVEL_WEIGHT: Record<MasteryLevel, number> = { none: 0, developing: 0.3, practiced: 0.7, secure: 1 };
const DAY = 86_400_000;

export const isIndependent = (a: Attempt): boolean => a.correct && a.hintLevel < 3;

export function computeObjective(objectiveId: string, activities: Activity[], progress: Record<string, ActivityProgress>): ObjectiveProgress {
  const evidence: Evidence[] = [];
  for (const act of activities) {
    if (!act.objectiveIds.includes(objectiveId)) continue;
    for (const at of progress[act.id]?.attempts ?? [])
      evidence.push({ activityId: act.id, at: at.at, correct: at.correct, independent: isIndependent(at), selfAssessed: at.selfAssessed, context: at.context });
  }
  evidence.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (evidence.length === 0) return { level: 'none', evidence: [], reviewCorrect: 0 };

  let level: MasteryLevel = 'developing';
  const seen = new Set<string>();
  let practicedAt: number | null = null;
  for (const e of evidence) {
    if (e.independent) {
      seen.add(e.activityId);
      if (seen.size >= 2 && practicedAt === null) practicedAt = Date.parse(e.at);
    }
  }
  if (practicedAt !== null) {
    level = 'practiced';
    const retrieval = evidence.some((e) => e.independent && !e.selfAssessed && e.context === 'review' && Date.parse(e.at) - practicedAt! >= MIN_REVIEW_GAP_MS);
    if (retrieval) level = 'secure';
  }
  const last = evidence[evidence.length - 1];
  const correct = evidence.filter((e) => e.independent);
  const lastCorrect = correct[correct.length - 1];
  const reviewCorrect = evidence.filter((e) => e.context === 'review' && e.independent).length;
  // Missed concepts come back after 1 day; otherwise spaced intervals grow with successful review retrievals.
  const intervalDays = last.correct ? REVIEW_INTERVAL_DAYS[Math.min(reviewCorrect, REVIEW_INTERVAL_DAYS.length - 1)] : REVIEW_INTERVAL_DAYS[0];
  const base = last.correct ? Date.parse((lastCorrect ?? last).at) : Date.parse(last.at);
  return {
    level, evidence: evidence.slice(-40), reviewCorrect, lastAttemptAt: last.at,
    ...(lastCorrect ? { lastCorrectAt: lastCorrect.at } : {}),
    nextReviewAt: new Date(base + intervalDays * DAY).toISOString(),
  };
}

export function recomputeAllObjectives(p: ProgressRecord, modules: Module[], activities: Activity[]): Record<string, ObjectiveProgress> {
  const out: Record<string, ObjectiveProgress> = {};
  for (const m of modules) for (const o of m.objectives) {
    const op = computeObjective(o.id, activities, p.activities);
    if (op.level !== 'none') out[o.id] = op;
  }
  return out;
}

export const moduleMastery = (m: Module, objectives: Record<string, ObjectiveProgress>): number =>
  m.objectives.length === 0 ? 0 : m.objectives.reduce((s, o) => s + LEVEL_WEIGHT[objectives[o.id]?.level ?? 'none'], 0) / m.objectives.length;

export type PrereqStatus = 'met' | 'partial' | 'unmet' | 'unavailable';
export function prerequisiteStatus(pre: Module, objectives: Record<string, ObjectiveProgress>): { status: PrereqStatus; mastery: number } {
  if (pre.availability === 'preview') return { status: 'unavailable', mastery: 0 };
  const mastery = moduleMastery(pre, objectives);
  return { status: mastery >= PREREQ_THRESHOLD ? 'met' : mastery > 0 ? 'partial' : 'unmet', mastery };
}

export const isDue = (o: ObjectiveProgress | undefined, now = Date.now()): boolean => !!o?.nextReviewAt && Date.parse(o.nextReviewAt) <= now;

/** Number of attempts in the trailing 7 days (weekly target uses this; it is activity-based, not time-based). */
export function attemptsThisWeek(p: ProgressRecord, now = Date.now()): number {
  let n = 0;
  for (const ap of Object.values(p.activities)) for (const a of ap.attempts) if (now - Date.parse(a.at) <= 7 * DAY) n++;
  return n;
}
