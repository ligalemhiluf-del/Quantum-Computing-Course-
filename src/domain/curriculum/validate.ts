import type { CourseData } from './types';
import { findCycle } from './graph';

export const MEASURABLE_VERB = /^(derive|calculate|explain|implement|compare|critique|construct|identify|design|apply|interpret|evaluate|analyse|analyze|describe|diagnose|distinguish|build|plan|use|write|reproduce|assess|choose|map|decide|set|prepare|translate|convert|simulate|predict|justify|relate|classify|decompose|compute|verify|estimate|formulate|select|read|audit|scope|propose|reason)\b/i;

/** Structural validation of authored content. Returns human-readable problems (empty = valid). */
export function validateCourseData(d: CourseData): string[] {
  const errs: string[] = [];
  const dup = (name: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errs.push(`Duplicate ${name} id: ${id}`);
      seen.add(id);
    }
  };
  dup('track', d.tracks.map((t) => t.id));
  dup('module', d.modules.map((m) => m.id));
  dup('lesson', d.lessons.map((l) => l.id));
  dup('activity', d.activities.map((a) => a.id));
  dup('lab', d.labs.map((l) => l.id));
  dup('objective', d.modules.flatMap((m) => m.objectives.map((o) => o.id)));

  const modules = new Map(d.modules.map((m) => [m.id, m]));
  const lessons = new Map(d.lessons.map((l) => [l.id, l]));
  const acts = new Map(d.activities.map((a) => [a.id, a]));
  const labs = new Map(d.labs.map((l) => [l.id, l]));
  const objectives = new Map(d.modules.flatMap((m) => m.objectives.map((o) => [o.id, { o, m }] as const)));
  const owners = new Set([...lessons.keys(), ...labs.keys()]);

  d.course.trackIds.forEach((t) => !d.tracks.find((x) => x.id === t) && errs.push(`Course references missing track ${t}`));
  d.course.recommendedOrder.forEach((m) => !modules.has(m) && errs.push(`recommendedOrder references missing module ${m}`));
  for (const t of d.tracks) for (const m of t.moduleIds) {
    if (!modules.has(m)) errs.push(`Track ${t.id} references missing module ${m}`);
    else if (modules.get(m)!.trackId !== t.id) errs.push(`Module ${m} listed in track ${t.id} but trackId is ${modules.get(m)!.trackId}`);
  }
  for (const m of d.modules) {
    if (!d.tracks.find((t) => t.id === m.trackId)) errs.push(`Module ${m.id} has unknown track ${m.trackId}`);
    m.prerequisiteModuleIds.forEach((p) => !modules.has(p) && errs.push(`Module ${m.id} has unknown prerequisite ${p}`));
    if (m.prerequisiteModuleIds.includes(m.id)) errs.push(`Module ${m.id} lists itself as prerequisite`);
    if (m.objectives.length === 0) errs.push(`Module ${m.id} has no objectives`);
    for (const o of m.objectives)
      if (!MEASURABLE_VERB.test(o.text)) errs.push(`Objective ${o.id} should start with a measurable verb: "${o.text}"`);
    m.lessonIds.forEach((l) => lessons.get(l)?.moduleId !== m.id && errs.push(`Module ${m.id} lists lesson ${l} that is missing or belongs elsewhere`));
    m.labIds.forEach((l) => labs.get(l)?.moduleId !== m.id && errs.push(`Module ${m.id} lists lab ${l} that is missing or belongs elsewhere`));
    if (m.availability === 'available' && m.lessonIds.length === 0 && m.labIds.length === 0) errs.push(`Module ${m.id} is "available" but has no lessons or labs`);
    for (const o of m.objectives) o.assessmentActivityIds.forEach((a) => !acts.has(a) && errs.push(`Objective ${o.id} references missing activity ${a}`));
  }
  const cyc = findCycle(d.modules);
  if (cyc) errs.push(`Prerequisite cycle: ${cyc.join(' -> ')}`);

  for (const l of d.lessons) {
    if (!modules.has(l.moduleId)) errs.push(`Lesson ${l.id} has unknown module`);
    l.objectives.forEach((o) => (objectives.get(o)?.m.id !== l.moduleId) && errs.push(`Lesson ${l.id}: objective ${o} not in module ${l.moduleId}`));
    l.activityIds.forEach((a) => (acts.get(a)?.ownerId !== l.id) && errs.push(`Lesson ${l.id}: activity ${a} missing or owned elsewhere`));
    l.prerequisiteLessonIds.forEach((p) => !lessons.has(p) && errs.push(`Lesson ${l.id}: unknown prerequisite lesson ${p}`));
    for (const s of l.sections) if (s.kind === 'checkpoint' && (!s.activityId || !l.activityIds.includes(s.activityId))) errs.push(`Lesson ${l.id}: checkpoint section ${s.id} needs an activity in the lesson`);
    const own = l.activityIds.map((a) => acts.get(a)).filter(Boolean);
    const count = (r: string) => own.filter((a) => a!.role === r).length;
    if (l.kind === 'standard') {
      if (count('checkpoint') < 1) errs.push(`Lesson ${l.id}: needs at least one checkpoint`);
      const p = count('practice');
      if (p < 3 || p > 6) errs.push(`Lesson ${l.id}: needs 3-6 practice items (has ${p})`);
      if (count('exit') !== 1) errs.push(`Lesson ${l.id}: needs exactly one exit check`);
      if (!l.sections.some((s) => s.kind === 'misconception')) errs.push(`Lesson ${l.id}: needs a misconception callout`);
      if (!l.sections.some((s) => s.kind === 'worked-example')) errs.push(`Lesson ${l.id}: needs a worked example`);
      if (!l.sections.some((s) => s.kind === 'checkpoint')) errs.push(`Lesson ${l.id}: needs an inline checkpoint section`);
      if (l.references.length === 0) errs.push(`Lesson ${l.id}: needs references`);
      const exit = own.find((a) => a!.role === 'exit');
      if (exit && exit.objectiveIds.length === 0) errs.push(`Lesson ${l.id}: exit check must map to at least one objective`);
      const covered = new Set(own.flatMap((a) => a!.objectiveIds));
      l.objectives.forEach((o) => !covered.has(o) && errs.push(`Lesson ${l.id}: no activity assesses objective ${o}`));
    }
  }
  for (const lab of d.labs) {
    if (!modules.has(lab.moduleId)) errs.push(`Lab ${lab.id} has unknown module`);
    lab.activityIds.forEach((a) => (acts.get(a)?.ownerId !== lab.id) && errs.push(`Lab ${lab.id}: activity ${a} missing or owned elsewhere`));
    lab.prerequisiteModuleIds.forEach((p) => !modules.has(p) && errs.push(`Lab ${lab.id}: unknown prerequisite ${p}`));
  }
  for (const a of d.activities) {
    if (!owners.has(a.ownerId)) errs.push(`Activity ${a.id} has unknown owner ${a.ownerId}`);
    if (a.answerSpec.type !== a.type) errs.push(`Activity ${a.id}: type ${a.type} != answerSpec ${a.answerSpec.type}`);
    if (a.hints.length < 2) errs.push(`Activity ${a.id}: needs at least 2 hints`);
    a.hints.forEach((h, i) => h.level !== i + 1 && errs.push(`Activity ${a.id}: hints must be levelled 1,2,3 in order`));
    if (a.feedback.solutionSteps.length === 0) errs.push(`Activity ${a.id}: needs solution steps`);
    if (a.conceptTags.length === 0) errs.push(`Activity ${a.id}: needs concept tags`);
    a.objectiveIds.forEach((o) => !objectives.has(o) && errs.push(`Activity ${a.id}: unknown objective ${o}`));
    if (a.answerSpec.type === 'mcq') {
      const n = a.answerSpec.choices.filter((c) => c.correct).length;
      if (n !== 1) errs.push(`Activity ${a.id}: mcq needs exactly one correct choice (has ${n})`);
    }
  }
  return errs;
}
