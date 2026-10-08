import { describe, it, expect } from 'vitest';
import { courseData as d } from '../src/content';
import { createLocalTutor, LOCAL_INFO } from '../src/domain/tutor/local';
import { createRemoteTutor, buildRemotePayload, isSafeEndpoint } from '../src/domain/tutor/remote';
import { validateTutorResponse } from '../src/domain/tutor/validate';
import type { TutorRequest } from '../src/domain/tutor/types';

const tutor = createLocalTutor(d);
const act = (id: string) => d.activities.find((a) => a.id === id)!;
const req = (over: Partial<TutorRequest>): TutorRequest => ({ action: 'ask', mode: 'tutor-me', text: '', attempted: false, hintLevel: 0, solutionRequests: 0, weakPrerequisites: [], ...over });

describe('response validation', () => {
  it('accepts a good response and strips unknown fields', () => {
    const v = validateTutorResponse({ message: 'hi', responseType: 'hint', hintLevel: 2, conceptTags: ['a'], sourceRefs: [], evil: '<script>' });
    expect(v.ok).toBe(true);
    expect(v.ok && 'evil' in v.value).toBe(false);
  });
  it('rejects malformed output', () => {
    for (const bad of [null, 'x', [], {}, { message: '', responseType: 'hint' }, { message: 'a', responseType: 'rm -rf' }, { message: 'a', responseType: 'hint', hintLevel: 7 }, { message: 'a', responseType: 'hint', conceptTags: [1] }, { message: 'x'.repeat(5000), responseType: 'hint' }, { message: 'a', responseType: 'hint', solutionSteps: 'no' }])
      expect(validateTutorResponse(bad).ok).toBe(false);
  });
});

describe('local tutor honesty and staging', () => {
  it('labels itself as a local scripted tutor, not an LLM', async () => {
    const r = await tutor.respond(req({ text: 'what is global phase' }));
    expect(r.provider.kind).toBe('local-scripted');
    expect(r.provider.label).toMatch(/not an AI model/i);
    expect(LOCAL_INFO.kind).toBe('local-scripted');
  });
  it('escalates hints 1 → 2 → 3, then offers the solution when still stuck', () => {
    const a = act('b2-p1');
    const h1 = tutor.respondSync(req({ action: 'hint', activity: a, hintLevel: 0 }));
    const h2 = tutor.respondSync(req({ action: 'hint', activity: a, hintLevel: 1 }));
    const h3 = tutor.respondSync(req({ action: 'hint', activity: a, hintLevel: 2 }));
    expect([h1.hintLevel, h2.hintLevel, h3.hintLevel]).toEqual([1, 2, 3]);
    expect(h1.message).toContain(a.hints[0].text);
    expect(h3.message).toContain(a.hints[2].text);
    const stuck = tutor.respondSync(req({ action: 'stuck', activity: a, hintLevel: 3 }));
    expect(stuck.responseType).toBe('solution');
    expect(stuck.solutionSteps).toEqual(a.feedback.solutionSteps);
  });
  it('tutor-me gates the first solution request behind a nudge, but gives it on the second request', () => {
    const a = act('b2-p1');
    const first = tutor.respondSync(req({ action: 'solution', activity: a }));
    expect(first.responseType).toBe('hint');
    expect(first.solutionSteps).toBeUndefined();
    const second = tutor.respondSync(req({ action: 'solution', activity: a, solutionRequests: 1, hintLevel: 1 }));
    expect(second.responseType).toBe('solution');
  });
  it('explain-directly answers immediately; exam-practice withholds help until an attempt exists', () => {
    const a = act('b2-p1');
    expect(tutor.respondSync(req({ action: 'solution', activity: a, mode: 'explain-directly' })).responseType).toBe('solution');
    const exam = tutor.respondSync(req({ action: 'hint', activity: a, mode: 'exam-practice' }));
    expect(exam.responseType).toBe('clarify');
    expect(exam.hintLevel).toBeUndefined();
    expect(tutor.respondSync(req({ action: 'solution', activity: a, mode: 'exam-practice' })).solutionSteps).toBeUndefined();
    expect(tutor.respondSync(req({ action: 'hint', activity: a, mode: 'exam-practice', attempted: true })).responseType).toBe('hint');
  });
  it('asks what the learner tried when the question lacks context', () => {
    const r = tutor.respondSync(req({ text: 'help' }));
    expect(r.responseType).toBe('clarify');
    expect(r.message).toMatch(/what have you tried/i);
    const r2 = tutor.respondSync(req({ text: 'I do not get this at all, it is confusing' }));
    expect(r2.responseType).toBe('clarify');
  });
  it('Socratic by default: a concept question gets a cue and exactly one follow-up question; explain-directly gives the explanation', () => {
    const t = tutor.respondSync(req({ text: 'Why is global phase unobservable?', lessonId: 'b1-qubits-bloch' }));
    expect(t.responseType).toBe('cue');
    expect(t.nextQuestion).toBeTruthy();
    expect(t.solutionSteps).toBeUndefined();
    const e = tutor.respondSync(req({ text: 'Why is global phase unobservable?', mode: 'explain-directly', lessonId: 'b1-qubits-bloch' }));
    expect(e.responseType).toBe('explanation');
    expect(e.solutionSteps?.length).toBeGreaterThan(0);
  });
  it('diagnoses known misconceptions in the learner\'s own words', () => {
    const cases: [string, string][] = [
      ['I think entanglement lets you send messages faster than light', 'no-signalling'],
      ['global phase is observable by interference', 'global-phase'],
      ['The qubit already had a definite value and measurement just reveals it', 'measurement-disturbance'],
      ['dimensions add when you combine qubits', 'tensor-product'],
      ['Hermitian matrices must be real', 'hermitian'],
    ];
    for (const [text, tag] of cases) {
      const r = tutor.respondSync(req({ text }));
      expect(r.responseType, text).toBe('diagnosis');
      expect(r.conceptTags).toContain(tag);
      expect(r.nextQuestion).toBeTruthy();
    }
    // correct statements are not flagged
    expect(tutor.respondSync(req({ text: 'global phase is not observable' })).responseType).not.toBe('diagnosis');
  });
  it('check-my-reasoning does not pretend to verify free text', () => {
    const r = tutor.respondSync(req({ action: 'check', mode: 'check-reasoning', activity: act('b1-p3'), text: 'I took cos(theta)=1/4 so theta is about 75 degrees' }));
    expect(r.responseType).toBe('info');
    expect(r.message).toMatch(/not\*\* a confirmation|cannot verify/i);
    expect(r.confidence).toBe('low');
    expect(r.nextQuestion).toBeTruthy();
  });
  it('mentions weak prerequisites gently without blocking', () => {
    const r = tutor.respondSync(req({ text: 'explain the partial trace', weakPrerequisites: [{ moduleId: 'A2', title: 'Tensor products', mastery: 0.1 }] }));
    expect(r.message).toMatch(/A2/);
    expect(r.message).toMatch(/no pressure/);
  });
  it('every authored activity yields valid responses for every action and mode', async () => {
    for (const a of d.activities) for (const mode of ['tutor-me', 'check-reasoning', 'explain-directly', 'exam-practice'] as const) for (const action of ['hint', 'stuck', 'solution', 'check', 'next', 'ask'] as const) {
      const r = await tutor.respond(req({ action, mode, activity: a, text: action === 'check' ? 'my reasoning is x' : 'help with this', attempted: true, hintLevel: 3, solutionRequests: 1, lessonId: a.ownerId }));
      expect(r.message.length).toBeGreaterThan(0);
      expect(validateTutorResponse(r).ok).toBe(true);
    }
  });
});

describe('remote adapter seam', () => {
  const good = { response: { message: 'remote hello', responseType: 'explanation', conceptTags: ['x'], sourceRefs: [] } };
  const ok = (body: unknown) => async () => ({ ok: true, status: 200, json: async () => body });
  it('only sends the minimal, documented payload (no notes, progress or identifiers)', () => {
    const p = buildRemotePayload(req({ text: 'q', activity: act('b1-p1'), lessonId: 'b1-qubits-bloch', weakPrerequisites: [{ moduleId: 'A1', title: 'x', mastery: 0.234 }] }));
    expect(Object.keys(p).sort()).toEqual(['action', 'attempted', 'hintLevelUsed', 'item', 'learnerText', 'lesson', 'mode', 'weakPrerequisites']);
    expect(p.weakPrerequisites[0]).toEqual({ module: 'A1', mastery: 0.23 });
    expect(JSON.stringify(p)).not.toMatch(/localStorage|notes|email/i);
  });
  it('uses a valid remote reply and labels it as remote', async () => {
    const t = createRemoteTutor({ endpoint: 'https://example.invalid/t', fallback: tutor, fetchFn: ok(good) });
    const r = await t.respond(req({ text: 'hello' }));
    expect(r.message).toBe('remote hello');
    expect(r.provider.kind).toBe('remote-model');
    expect(t.disclosure).toMatch(/example\.invalid/);
  });
  it('falls back to the local tutor on HTTP errors, invalid schema and network failure, and says so', async () => {
    const cases = [
      async () => ({ ok: false, status: 503, json: async () => ({}) }),
      ok({ response: { message: '', responseType: 'hint' } }),
      ok({ nothing: true }),
      async () => { throw new Error('offline'); },
    ];
    for (const fetchFn of cases) {
      const t = createRemoteTutor({ endpoint: 'https://example.invalid/t', fallback: tutor, fetchFn });
      const r = await t.respond(req({ text: 'what is global phase' }));
      expect(r.provider.kind).toBe('local-scripted');
      expect(r.notice).toMatch(/Remote tutor unavailable/);
    }
  });
  it('accepts only https (or localhost http) endpoints', () => {
    expect(isSafeEndpoint('https://tutor.example.org/api')).toBe(true);
    expect(isSafeEndpoint('http://localhost:8787/tutor')).toBe(true);
    expect(isSafeEndpoint('http://evil.example.org')).toBe(false);
    expect(isSafeEndpoint('javascript:alert(1)')).toBe(false);
    expect(isSafeEndpoint('not a url')).toBe(false);
  });
});
