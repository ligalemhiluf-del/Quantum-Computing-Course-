import type { Activity, CourseData, Lab, Lesson, Module, Track } from '../domain/curriculum/types';
import { course, moduleSeeds, trackSeeds } from './modules';
import { labs as labList, labActivities } from './labs';
import { tutorConcepts, misconceptions } from './tutorKnowledge';
import * as a0 from './lessons/a0';
import * as a1 from './lessons/a1';
import * as a2 from './lessons/a2';
import * as b1 from './lessons/b1';
import * as b2 from './lessons/b2';
import * as b3 from './lessons/b3';
import * as b4 from './lessons/b4';
import * as b5 from './lessons/b5';
import * as b6 from './lessons/b6';

const lessonFiles = [a0, a1, a2, b1, b2, b3, b4, b5, b6];
export const lessons: Lesson[] = lessonFiles.map((f) => f.lesson);
export const activities: Activity[] = [...lessonFiles.flatMap((f) => f.activities), ...labActivities];
export const labs: Lab[] = labList;

/** Derive module links (lessons, labs, availability, objective→activity map) from the authored files so there is a single source of truth. */
export const modules: Module[] = moduleSeeds.map((s) => {
  const lessonIds = lessons.filter((l) => l.moduleId === s.id).map((l) => l.id);
  const labIds = labs.filter((l) => l.moduleId === s.id).map((l) => l.id);
  return {
    ...s,
    lessonIds,
    labIds,
    availability: lessonIds.length > 0 ? 'available' : 'preview',
    objectives: s.objectives.map((text, i) => {
      const id = `${s.id}.${i + 1}`;
      return { id, text, assessmentActivityIds: activities.filter((a) => a.objectiveIds.includes(id)).map((a) => a.id) };
    }),
  };
});
export const tracks: Track[] = trackSeeds.map((t) => ({ ...t, moduleIds: modules.filter((m) => m.trackId === t.id).map((m) => m.id) }));

export const courseData: CourseData = { course, tracks, modules, lessons, activities, labs, tutorConcepts, misconceptions };
