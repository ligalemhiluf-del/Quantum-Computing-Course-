import { RESPONSE_TYPES, TutorResponse } from './types';

const isStr = (x: unknown): x is string => typeof x === 'string';
const strArr = (x: unknown, max: number, maxLen: number): string[] | null =>
  Array.isArray(x) && x.length <= max && x.every((s) => isStr(s) && s.length <= maxLen) ? (x as string[]) : null;

/** Validate untrusted tutor output (e.g. from a remote model) against the safe response schema. Unknown fields are dropped. */
export function validateTutorResponse(raw: unknown): { ok: true; value: TutorResponse } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'Response is not an object.' };
  const r = raw as Record<string, unknown>;
  if (!isStr(r.message) || r.message.trim() === '' || r.message.length > 4000) return { ok: false, error: 'message must be a non-empty string (<= 4000 chars).' };
  if (!isStr(r.responseType) || !(RESPONSE_TYPES as readonly string[]).includes(r.responseType)) return { ok: false, error: 'responseType is not allowed.' };
  const tags = strArr(r.conceptTags ?? [], 12, 60);
  if (!tags) return { ok: false, error: 'conceptTags must be a short array of short strings.' };
  const refs = strArr(r.sourceRefs ?? [], 8, 300);
  if (!refs) return { ok: false, error: 'sourceRefs must be a short array of strings.' };
  const out: TutorResponse = { message: r.message, responseType: r.responseType as TutorResponse['responseType'], conceptTags: tags, sourceRefs: refs };
  if (r.hintLevel !== undefined) { if (![1, 2, 3].includes(r.hintLevel as number)) return { ok: false, error: 'hintLevel must be 1, 2 or 3.' }; out.hintLevel = r.hintLevel as 1 | 2 | 3; }
  if (r.diagnosis !== undefined) { if (!isStr(r.diagnosis) || r.diagnosis.length > 1500) return { ok: false, error: 'diagnosis is invalid.' }; out.diagnosis = r.diagnosis; }
  if (r.nextQuestion !== undefined) { if (!isStr(r.nextQuestion) || r.nextQuestion.length > 800) return { ok: false, error: 'nextQuestion is invalid.' }; out.nextQuestion = r.nextQuestion; }
  if (r.solutionSteps !== undefined) { const s = strArr(r.solutionSteps, 12, 1500); if (!s) return { ok: false, error: 'solutionSteps is invalid.' }; out.solutionSteps = s; }
  if (r.confidence !== undefined) { if (!['high', 'medium', 'low'].includes(r.confidence as string)) return { ok: false, error: 'confidence is invalid.' }; out.confidence = r.confidence as 'high' | 'medium' | 'low'; }
  return { ok: true, value: out };
}
