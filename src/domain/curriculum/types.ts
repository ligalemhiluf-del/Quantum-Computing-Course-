/** Curriculum schema: Course -> Track -> Module -> Lesson -> Activity. Content files conform to these types. */
export type Level = 'foundation' | 'core' | 'advanced';
export type Availability = 'available' | 'preview';

export type Course = { id: string; title: string; description: string; audience: string; version: number; trackIds: string[]; recommendedOrder: string[] };
export type Track = { id: string; title: string; description: string; moduleIds: string[]; order: number };
export type Objective = { id: string; text: string; assessmentActivityIds: string[] };
export type Module = {
  id: string;
  trackId: string;
  title: string;
  summary: string;
  objectives: Objective[];
  prerequisiteModuleIds: string[];
  lessonIds: string[];
  labIds: string[];
  estimatedMinutes: number;
  level: Level;
  availability: Availability;
};

export type SectionKind = 'motivation' | 'explanation' | 'worked-example' | 'interpretation' | 'misconception' | 'derivation' | 'extension' | 'conventions' | 'checkpoint';
export type LessonSection = {
  id: string;
  kind: SectionKind;
  title: string;
  /** Markdown-lite: paragraphs, `- ` lists, **bold**, *italic*, `code`, $inline$ and $$display$$ LaTeX. */
  body: string;
  /** For kind === 'checkpoint': the activity to show inline. */
  activityId?: string;
  /** Progressive disclosure: render collapsed behind a button. */
  collapsed?: boolean;
  /** Plain-language text alternative for display math, used for accessibility. */
  mathAlt?: string;
};
export type Reference = { citation: string; kind: 'textbook' | 'paper' | 'lecture-notes'; url?: string; note?: string };
export type Lesson = {
  id: string;
  moduleId: string;
  kind: 'standard' | 'diagnostic';
  title: string;
  question: string; // motivating physical/computational question
  objectives: string[]; // objective ids (from the module)
  prerequisiteLessonIds: string[];
  estimatedMinutes: number;
  sections: LessonSection[];
  activityIds: string[];
  conceptTags: string[];
  references: Reference[];
};

export type ActivityType = 'mcq' | 'numeric' | 'explain' | 'order' | 'match' | 'circuit' | 'code' | 'reflection';
export type ActivityRole = 'checkpoint' | 'practice' | 'exit';
export type Hint = { level: 1 | 2 | 3; text: string }; // 1 conceptual cue, 2 specific hint, 3 scaffolded derivation

export type Choice = { id: string; text: string; correct?: boolean; /** Why a learner might pick it, and what to say. */ feedback: string; misconception?: string };
export type RubricItem = { id: string; text: string };
export type GateStep = { gate: string; targets: number[]; params?: number[] };

export type AnswerSpec =
  | { type: 'mcq'; choices: Choice[] }
  | { type: 'numeric'; value: number; tolerance: number; unit?: string; commonWrong?: { value: number; tolerance?: number; diagnosis: string }[] }
  | { type: 'explain' | 'reflection'; rubric: RubricItem[]; modelAnswer: string; minTicks: number; patterns?: { regex: string; diagnosis: string }[] }
  | { type: 'order'; items: { id: string; text: string }[] /* in the correct order */ }
  | { type: 'match'; pairs: { id: string; left: string; right: string }[] }
  | {
      type: 'circuit';
      numQubits: number;
      allowedGates: string[];
      maxGates: number;
      /** Target statevector as [re, im] pairs; matching is up to global phase. */
      target: [number, number][];
      targetLabel: string;
      solution: GateStep[];
    }
  | { type: 'code'; starter: string; tests: CodeTest[]; solutionSource: string; api: string };
export type CodeTest = { label: string; args: unknown[]; expected: unknown; tol?: number };

export type FeedbackSpec = {
  correct: string;
  incorrect: string; // default when no specific diagnosis applies
  solutionSteps: string[]; // scaffolded worked solution (markdown-lite)
  followUp?: string; // one focused follow-up question
};
export type Activity = {
  id: string;
  ownerId: string; // lesson id or lab id
  role: ActivityRole;
  type: ActivityType;
  prompt: string;
  conceptTags: string[];
  difficulty: 1 | 2 | 3;
  hints: Hint[];
  answerSpec: AnswerSpec;
  feedback: FeedbackSpec;
  objectiveIds: string[];
};

export type Lab = {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  physicsMeaning: string; // what the lab shows, in physics/computational terms
  objectives: string[]; // plain-text outcomes
  objectiveIds: string[];
  instructions: string[];
  assumptions: string[]; // simulator assumptions / limits
  activityIds: string[];
  prerequisiteModuleIds: string[];
  estimatedMinutes: number;
};

export type TutorConcept = {
  tag: string;
  title: string;
  keywords: string[];
  cue: string; // conceptual cue (Socratic first step)
  hint: string; // more specific hint
  explanation: string; // direct explanation
  steps: string[]; // scaffolded derivation
  checkQuestion: string; // one focused question
  sourceRefs: string[];
};
export type MisconceptionPattern = { id: string; regex: string; tag: string; diagnosis: string; nextQuestion: string };

export type CourseData = {
  course: Course;
  tracks: Track[];
  modules: Module[];
  lessons: Lesson[];
  activities: Activity[];
  labs: Lab[];
  tutorConcepts: TutorConcept[];
  misconceptions: MisconceptionPattern[];
};
