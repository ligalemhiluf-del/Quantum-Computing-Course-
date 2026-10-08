import type { CourseData, TutorConcept } from '../curriculum/types';
import type { ProviderInfo, TutorProvider, TutorReply, TutorRequest, TutorResponse } from './types';
import { validateTutorResponse } from './validate';

export const LOCAL_INFO: ProviderInfo = { id: 'local-scripted', label: 'Local scripted tutor (not an AI model)', kind: 'local-scripted' };

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s'’-]/g, ' ').split(/\s+/).filter(Boolean);
const esc = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Keyword match with a word-start boundary (stems like "dephas" work); very short keywords need whole-word matches. */
const hasKeyword = (text: string, kw: string): boolean => new RegExp(kw.length <= 3 ? `(^|[^a-z0-9])${esc(kw)}($|[^a-z0-9])` : `(^|[^a-z0-9])${esc(kw)}`, 'i').test(text);
/** A learner who writes a negation ("why can't entanglement signal…") is usually asking, not asserting a misconception. */
const NEGATED = /\b(not|never|cannot|no|isn'?t|doesn'?t|don'?t|can'?t|won'?t|impossible)\b|n't\b/i;

function matchConcept(d: CourseData, text: string, req: TutorRequest): TutorConcept | null {
  const t = text.toLowerCase();
  const lessonTags = new Set(d.lessons.find((l) => l.id === req.lessonId)?.conceptTags ?? []);
  const focusTags = new Set(req.activity?.conceptTags ?? []);
  let best: { c: TutorConcept; score: number } | null = null;
  for (const c of d.tutorConcepts) {
    let score = c.keywords.reduce((s, k) => (hasKeyword(t, k) ? s + 2 : s), 0);
    if (score === 0) continue; // context alone never selects a concept
    if (focusTags.has(c.tag)) score += 2;
    if (lessonTags.has(c.tag)) score += 1;
    if (!best || score > best.score) best = { c, score };
  }
  return best?.c ?? null;
}
function conceptForActivity(d: CourseData, req: TutorRequest): TutorConcept | null {
  for (const tag of req.activity?.conceptTags ?? []) {
    const c = d.tutorConcepts.find((x) => x.tag === tag);
    if (c) return c;
  }
  return null;
}
const prereqNote = (req: TutorRequest): string => {
  const w = req.weakPrerequisites[0];
  return w ? `\n\n*Study note:* your evidence on ${w.moduleId} (${w.title}) is still limited (mastery estimate ${Math.round(w.mastery * 100)}%). A short review there may make this easier — no pressure.` : '';
};
const R = (r: Omit<TutorResponse, 'sourceRefs' | 'conceptTags'> & Partial<Pick<TutorResponse, 'sourceRefs' | 'conceptTags'>>): TutorResponse => ({ sourceRefs: [], conceptTags: [], ...r });

/** Deterministic, rule-based tutor that uses only authored content. It never pretends to be a language model. */
export function createLocalTutor(d: CourseData): TutorProvider & { respondSync(req: TutorRequest): TutorResponse } {
  const patterns = d.misconceptions.map((m) => ({ ...m, re: new RegExp(m.regex, 'i') }));

  function respondSync(req: TutorRequest): TutorResponse {
    const a = req.activity;
    const text = req.text.trim();

    if (req.action === 'hint' || req.action === 'stuck') {
      if (!a) return R({ message: 'Hints are attached to a specific question. Pick an item in the lesson (use "Ask about this item"), or ask me a concept question in your own words.', responseType: 'clarify' });
      if (req.mode === 'exam-practice' && !req.attempted)
        return R({ message: 'In **Exam practice** mode I hold back hints until you have submitted an answer. Give it your best attempt first — I will give feedback afterwards, and using hints never blocks you from finishing.', responseType: 'clarify', conceptTags: a.conceptTags });
      if (req.action === 'stuck' && req.hintLevel >= 3)
        return solution(req, 'You have seen all three hint levels, so here is the scaffolded solution. Try to follow each step and then redo the item without looking.');
      const level = Math.min(3, req.hintLevel + 1) as 1 | 2 | 3;
      const hint = a.hints.find((h) => h.level === level) ?? a.hints[a.hints.length - 1];
      const label = level === 1 ? 'conceptual cue' : level === 2 ? 'more specific hint' : 'scaffolded hint';
      return R({
        message: `**Hint ${level}/3 — ${label}.** ${hint.text}${level === 3 ? '\n\nIf you are still stuck after this, ask for the worked solution.' : ''}`,
        responseType: 'hint', hintLevel: level, conceptTags: a.conceptTags,
        nextQuestion: level < 3 ? 'With that in mind, what is the very first quantity you would write down or compute?' : 'Which step of the scaffold is the first one you could not do yourself?',
        sourceRefs: conceptForActivity(d, req)?.sourceRefs ?? [],
      });
    }

    if (req.action === 'solution') {
      if (!a) return R({ message: 'Solutions belong to a specific item. Select one with "Ask about this item" first.', responseType: 'clarify' });
      if (req.mode === 'exam-practice' && !req.attempted)
        return R({ message: 'In **Exam practice** mode the solution unlocks after you submit an attempt. Please answer first.', responseType: 'clarify', conceptTags: a.conceptTags });
      if ((req.mode === 'tutor-me' || req.mode === 'check-reasoning') && req.hintLevel < 2 && req.solutionRequests === 0 && !req.attempted) {
        const level = Math.min(3, req.hintLevel + 1) as 1 | 2 | 3;
        const hint = a.hints.find((h) => h.level === level) ?? a.hints[0];
        return R({ message: `Before the full solution, one nudge: ${hint.text}\n\nIf you still want the complete worked solution, ask again and I will show it.`, responseType: 'hint', hintLevel: level, conceptTags: a.conceptTags, nextQuestion: 'Does that nudge unlock the first step?' });
      }
      return solution(req, req.mode === 'explain-directly' ? 'Here is the worked solution.' : 'Here is the scaffolded solution — read each step, then try a similar item without looking.');
    }

    // Pattern-based diagnosis for free text (any of ask / check).
    const asserting = !!text && !NEGATED.test(text);
    const hitPattern = asserting ? patterns.find((p) => p.re.test(text)) : undefined;
    const specPatterns = a && (a.answerSpec.type === 'explain' || a.answerSpec.type === 'reflection') ? a.answerSpec.patterns ?? [] : [];
    const specHit = asserting ? specPatterns.find((p) => new RegExp(p.regex, 'i').test(text)) : undefined;

    if (req.action === 'check') {
      if (req.lastResult && !req.lastResult.correct && req.lastResult.diagnosis && !text)
        return R({ message: `Looking at your last answer: ${req.lastResult.diagnosis}`, diagnosis: req.lastResult.diagnosis, responseType: 'diagnosis', conceptTags: a?.conceptTags ?? [], nextQuestion: a?.feedback.followUp ?? 'Which single step of your calculation would you re-examine first?' });
      if (!text && !req.lastResult) return R({ message: 'Paste or type the reasoning you want checked — your steps, not just the final answer. I look for the exact step that fails.', responseType: 'clarify', conceptTags: a?.conceptTags ?? [] });
      if (hitPattern || specHit) {
        const diag = specHit?.diagnosis ?? hitPattern!.diagnosis;
        return R({ message: `I spotted a known pitfall in your reasoning: ${diag}`, diagnosis: diag, responseType: 'diagnosis', nextQuestion: hitPattern?.nextQuestion ?? 'How would you rewrite that step so it respects it?', conceptTags: hitPattern ? [hitPattern.tag] : a?.conceptTags ?? [], confidence: 'medium' });
      }
      const c = (a && conceptForActivity(d, req)) || matchConcept(d, text, req);
      return R({
        message: `I did not find any of the common pitfalls I know about in what you wrote. That is **not** a confirmation that it is correct — in local mode I only match authored patterns and cannot verify free-form derivations. Check your steps against this list:\n\n${(c?.steps ?? a?.feedback.solutionSteps ?? ['Define your symbols.', 'Check normalisation.', 'Sanity-check a limiting case.']).map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        responseType: 'info', confidence: 'low', conceptTags: c ? [c.tag] : a?.conceptTags ?? [], nextQuestion: 'At which numbered step does your reasoning first differ from this list?', sourceRefs: c?.sourceRefs ?? [],
      });
    }

    if (req.action === 'next') {
      const c = (a && conceptForActivity(d, req)) || null;
      if (c) return R({ message: `Here is one focused question to test yourself on **${c.title}**:`, responseType: 'question', nextQuestion: c.checkQuestion, conceptTags: [c.tag], sourceRefs: c.sourceRefs });
      return R({ message: 'Tell me which concept you want to practise (for example "global phase", "partial trace" or "Kraus operators") and I will pose one question.', responseType: 'clarify' });
    }

    // action === 'ask'
    if (hitPattern || specHit) {
      const diag = specHit?.diagnosis ?? hitPattern!.diagnosis;
      return R({ message: `That sounds like a common misconception. ${diag}`, diagnosis: diag, responseType: 'diagnosis', nextQuestion: hitPattern?.nextQuestion ?? 'What observable consequence would tell the two cases apart?', conceptTags: hitPattern ? [hitPattern.tag] : [], confidence: 'medium' });
    }
    const concept = matchConcept(d, text, req) ?? (words(text).length < 3 ? conceptForActivity(d, req) : null);
    if (!concept) {
      const suggestions = (d.lessons.find((l) => l.id === req.lessonId)?.conceptTags ?? []).map((t) => d.tutorConcepts.find((c) => c.tag === t)?.title).filter(Boolean).slice(0, 4);
      return R({
        message: `I want to help, but I need more to go on. What have you tried so far, and which part is unclear — the notation, a calculation step, or the physical meaning?${suggestions.length ? `\n\nTopics I have authored help for in this lesson: ${suggestions.join(', ')}.` : ''}\n\n*Local mode only knows the authored topics; for anything else, treat my silence as "not covered", not as "wrong".*`,
        responseType: 'clarify', confidence: 'low',
      });
    }
    const note = prereqNote(req);
    switch (req.mode) {
      case 'explain-directly':
        return R({ message: `**${concept.title}.** ${concept.explanation}${note}`, responseType: 'explanation', solutionSteps: concept.steps, conceptTags: [concept.tag], sourceRefs: concept.sourceRefs, nextQuestion: concept.checkQuestion });
      case 'check-reasoning':
        return R({ message: `On **${concept.title}**: before I explain, show me your reasoning so I can check it. Here is a cue to compare with: ${concept.cue}${note}`, responseType: 'question', conceptTags: [concept.tag], sourceRefs: concept.sourceRefs, nextQuestion: 'Write the steps you took (even if unsure) and press "Check my reasoning".' });
      case 'exam-practice':
        return R({ message: `Exam practice: no explanation until you have tried. Question on **${concept.title}**:${note}`, responseType: 'practice', conceptTags: [concept.tag], sourceRefs: concept.sourceRefs, nextQuestion: concept.checkQuestion });
      default:
        return R({ message: `**${concept.title}.** ${concept.cue}${note}`, responseType: 'cue', conceptTags: [concept.tag], sourceRefs: concept.sourceRefs, nextQuestion: concept.checkQuestion, hintLevel: undefined });
    }
  }

  function solution(req: TutorRequest, lead: string): TutorResponse {
    const a = req.activity!;
    return R({ message: lead, responseType: 'solution', solutionSteps: a.feedback.solutionSteps, nextQuestion: a.feedback.followUp ?? 'Can you now explain, in one sentence, why the last step is justified?', conceptTags: a.conceptTags, sourceRefs: conceptForActivity(d, req)?.sourceRefs ?? [], hintLevel: 3 });
  }

  return {
    info: LOCAL_INFO,
    disclosure: 'Local mode: everything runs in your browser from authored content. Nothing you type is sent anywhere.',
    respondSync,
    async respond(req: TutorRequest): Promise<TutorReply> {
      const res = validateTutorResponse(respondSync(req));
      if (!res.ok) return { message: 'The local tutor produced an invalid response (this is a bug).', responseType: 'info', conceptTags: [], sourceRefs: [], provider: LOCAL_INFO };
      return { ...res.value, provider: LOCAL_INFO };
    },
  };
}
