import type { Activity } from '../curriculum/types';
import type { TutorMode } from '../progress/schema';

export type { TutorMode };
export const RESPONSE_TYPES = ['cue', 'question', 'hint', 'diagnosis', 'explanation', 'solution', 'clarify', 'practice', 'info'] as const;
export type ResponseType = (typeof RESPONSE_TYPES)[number];

/** Safe response shape. Every provider (local or remote) must produce exactly this, and it is validated before display. */
export type TutorResponse = {
  message: string;
  responseType: ResponseType;
  hintLevel?: 1 | 2 | 3;
  diagnosis?: string;
  nextQuestion?: string;
  solutionSteps?: string[];
  conceptTags: string[];
  confidence?: 'high' | 'medium' | 'low';
  sourceRefs: string[];
};

export type ProviderKind = 'local-scripted' | 'remote-model';
export type ProviderInfo = { id: string; label: string; kind: ProviderKind };
/** What the UI shows: the validated response plus honest provenance. */
export type TutorReply = TutorResponse & { provider: ProviderInfo; notice?: string };

export type TutorAction = 'ask' | 'hint' | 'stuck' | 'solution' | 'check' | 'next';
export type PrereqNote = { moduleId: string; title: string; mastery: number; lessonId?: string };
export type TutorRequest = {
  action: TutorAction;
  mode: TutorMode;
  text: string;
  lessonId?: string;
  activity?: Activity;
  attempted: boolean;
  lastResult?: { correct: boolean; diagnosis?: string };
  hintLevel: 0 | 1 | 2 | 3;
  solutionRequests: number;
  weakPrerequisites: PrereqNote[];
};

export interface TutorProvider {
  info: ProviderInfo;
  /** Plain-language statement of what leaves the device, shown in Settings. */
  disclosure: string;
  respond(req: TutorRequest): Promise<TutorReply>;
}
