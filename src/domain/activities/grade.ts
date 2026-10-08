import type { Activity, GateStep, AnswerSpec } from '../curriculum/types';
import { simulate, equalUpToGlobalPhase, probabilities, c } from '../quantum';

export type Response =
  | { type: 'mcq'; choiceId: string }
  | { type: 'numeric'; value: string }
  | { type: 'explain' | 'reflection'; text: string; ticked: string[] }
  | { type: 'order'; ids: string[] }
  | { type: 'match'; pairs: Record<string, string> }
  | { type: 'circuit'; gates: GateStep[] }
  | { type: 'code'; source: string };

export type GradeResult =
  | { status: 'invalid'; message: string }
  | { status: 'graded'; correct: boolean; selfAssessed: boolean; message: string; diagnosis?: string; conceptTags: string[]; misconception?: string };

/** Safe arithmetic parser for numeric answers: numbers, + - * / ^, parentheses, sqrt(), pi, percent. No eval. */
export function parseNumeric(input: string, unit?: string): number | null {
  let s = input.trim().toLowerCase().replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/×/g, '*').replace(/−/g, '-').replace(/,/g, '.');
  if (unit) s = s.replace(new RegExp(`\\s*${unit.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '');
  let percent = false;
  if (s.endsWith('%')) { percent = true; s = s.slice(0, -1); }
  let pos = 0;
  const peek = () => s[pos];
  const ws = () => { while (peek() === ' ') pos++; };
  const fail = (): never => { throw new Error('parse'); };
  function primary(): number {
    ws();
    if (peek() === '(') { pos++; const v = expr(); ws(); if (peek() !== ')') fail(); pos++; return v; }
    if (s.startsWith('sqrt', pos)) {
      pos += 4; ws();
      let v: number;
      if (peek() === '(') { pos++; v = expr(); ws(); if (peek() !== ')') fail(); pos++; } else v = primary(); // allows "sqrt2" as well as "sqrt(2)"
      if (v < 0) fail();
      return Math.sqrt(v);
    }
    if (s.startsWith('pi', pos)) { pos += 2; return Math.PI; }
    const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(pos));
    if (!m) return fail();
    pos += m[0].length;
    return parseFloat(m[0]);
  }
  function unary(): number { ws(); if (peek() === '-') { pos++; return -unary(); } if (peek() === '+') { pos++; return unary(); } return power(); }
  function power(): number { const b = primary(); ws(); if (peek() === '^') { pos++; return Math.pow(b, unary()); } return b; }
  function term(): number {
    let v = unary();
    for (;;) {
      ws();
      if (peek() === '*') { pos++; v *= unary(); }
      else if (peek() === '/') { pos++; const d = unary(); if (d === 0) fail(); v /= d; }
      else if (peek() !== undefined && peek() !== ')' && peek() !== '+' && peek() !== '-' && /[(sp\d.]/.test(peek())) v *= power(); // implicit product: 2sqrt(2)
      else return v;
    }
  }
  function expr(): number {
    let v = term();
    for (;;) {
      ws();
      if (peek() === '+') { pos++; v += term(); }
      else if (peek() === '-') { pos++; v -= term(); }
      else return v;
    }
  }
  try {
    if (s.trim() === '') return null;
    const v = expr();
    ws();
    if (pos !== s.length || !Number.isFinite(v)) return null;
    return percent ? v / 100 : v;
  } catch {
    return null;
  }
}

const tags = (a: Activity) => a.conceptTags;

export function gradeActivity(a: Activity, r: Response): GradeResult {
  const spec: AnswerSpec = a.answerSpec;
  if (spec.type !== r.type) return { status: 'invalid', message: 'Response type does not match this activity.' };
  switch (spec.type) {
    case 'mcq': {
      const rr = r as Extract<Response, { type: 'mcq' }>;
      const ch = spec.choices.find((x) => x.id === rr.choiceId);
      if (!ch) return { status: 'invalid', message: 'Choose one of the options first.' };
      return { status: 'graded', correct: !!ch.correct, selfAssessed: false, message: ch.correct ? `${ch.feedback}` : ch.feedback, conceptTags: tags(a), misconception: ch.correct ? undefined : ch.misconception, diagnosis: ch.correct ? undefined : ch.feedback };
    }
    case 'numeric': {
      const rr = r as Extract<Response, { type: 'numeric' }>;
      const v = parseNumeric(rr.value, spec.unit);
      if (v === null) return { status: 'invalid', message: 'I could not read that as a number. You can type things like 0.5, 1/2, 1/sqrt(2) or 50%.' };
      if (Math.abs(v - spec.value) <= spec.tolerance) return { status: 'graded', correct: true, selfAssessed: false, message: a.feedback.correct, conceptTags: tags(a) };
      const cw = spec.commonWrong?.find((w) => Math.abs(v - w.value) <= (w.tolerance ?? spec.tolerance));
      return { status: 'graded', correct: false, selfAssessed: false, message: cw ? cw.diagnosis : a.feedback.incorrect, diagnosis: cw?.diagnosis, conceptTags: tags(a) };
    }
    case 'explain':
    case 'reflection': {
      const rr = r as Extract<Response, { type: 'explain' | 'reflection' }>;
      if (rr.text.trim().length < 15) return { status: 'invalid', message: 'Write a few sentences first (at least a short explanation), then self-check against the rubric.' };
      const valid = new Set(spec.rubric.map((x) => x.id));
      const ticks = rr.ticked.filter((t) => valid.has(t)).length;
      const hit = spec.patterns?.find((p) => new RegExp(p.regex, 'i').test(rr.text));
      const ok = ticks >= spec.minTicks;
      return {
        status: 'graded', correct: ok, selfAssessed: true, diagnosis: hit?.diagnosis,
        message: (ok ? `Self-check: ${ticks}/${spec.rubric.length} rubric points. ${a.feedback.correct}` : `Self-check: ${ticks}/${spec.rubric.length} rubric points (need ${spec.minTicks}). ${a.feedback.incorrect}`) + (hit ? ` Note: ${hit.diagnosis}` : ''),
        conceptTags: tags(a),
      };
    }
    case 'order': {
      const rr = r as Extract<Response, { type: 'order' }>;
      const key = spec.items.map((i) => i.id);
      if (rr.ids.length !== key.length) return { status: 'invalid', message: 'Arrange all the steps first.' };
      const firstWrong = rr.ids.findIndex((id, i) => id !== key[i]);
      if (firstWrong < 0) return { status: 'graded', correct: true, selfAssessed: false, message: a.feedback.correct, conceptTags: tags(a) };
      const d = `Position ${firstWrong + 1} is not yet right: ask what must already be known before that step can happen.`;
      return { status: 'graded', correct: false, selfAssessed: false, message: `${a.feedback.incorrect} ${d}`, diagnosis: d, conceptTags: tags(a) };
    }
    case 'match': {
      const rr = r as Extract<Response, { type: 'match' }>;
      if (spec.pairs.some((p) => !rr.pairs[p.id])) return { status: 'invalid', message: 'Match every item first.' };
      const wrong = spec.pairs.filter((p) => rr.pairs[p.id] !== p.id);
      if (wrong.length === 0) return { status: 'graded', correct: true, selfAssessed: false, message: a.feedback.correct, conceptTags: tags(a) };
      const d = `Re-check: ${wrong.map((w) => `"${w.left}"`).join('; ')}. (${spec.pairs.length - wrong.length}/${spec.pairs.length} correct.)`;
      return { status: 'graded', correct: false, selfAssessed: false, message: `${a.feedback.incorrect} ${d}`, diagnosis: d, conceptTags: tags(a) };
    }
    case 'circuit': {
      const rr = r as Extract<Response, { type: 'circuit' }>;
      if (rr.gates.length === 0) return { status: 'invalid', message: 'Add at least one gate to the circuit.' };
      if (rr.gates.some((g) => !spec.allowedGates.includes(g.gate))) return { status: 'invalid', message: `Only these gates are allowed here: ${spec.allowedGates.join(', ')}.` };
      let psi;
      try { psi = simulate(spec.numQubits, rr.gates); } catch (e) { return { status: 'invalid', message: (e as Error).message }; }
      const target = spec.target.map(([re, im]) => c(re, im));
      const sameProb = probabilities(psi).every((p, i) => Math.abs(p - probabilities(target)[i]) < 1e-6);
      if (equalUpToGlobalPhase(psi, target, 1e-6)) {
        if (rr.gates.length > spec.maxGates) { const d = `Correct state, but this task asks for at most ${spec.maxGates} gates. Can you shorten it?`; return { status: 'graded', correct: false, selfAssessed: false, message: d, diagnosis: d, conceptTags: tags(a) }; }
        return { status: 'graded', correct: true, selfAssessed: false, message: a.feedback.correct, conceptTags: tags(a) };
      }
      const d = sameProb ? 'Your circuit gives the right measurement probabilities in the computational basis, but the relative phase differs from the target. Which gate changes only relative phase?' : 'The output probabilities differ from the target state. Track the state after each gate and compare with the target.';
      return { status: 'graded', correct: false, selfAssessed: false, message: `${a.feedback.incorrect} ${d}`, diagnosis: d, conceptTags: tags(a) };
    }
    case 'code':
      return { status: 'invalid', message: 'Run the code activity with the "Run tests" button.' };
  }
}
