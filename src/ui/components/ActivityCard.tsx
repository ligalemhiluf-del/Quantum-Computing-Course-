import { useMemo, useState } from 'react';
import type { Activity, GateStep } from '../../domain/curriculum/types';
import { gradeActivity, type GradeResult, type Response } from '../../domain/activities/grade';
import { runCodeInWorker, gradeCodeRun, type CodeRunResult } from '../../domain/activities/codeRunner';
import { GATES, simulate, fmt, probabilities, bitString, makeRng } from '../../domain/quantum';
import type { Context } from '../../domain/progress/schema';
import { useProgress, useSession, useStore } from '../../app/state';
import { Markdown } from './Markdown';

const hash = (s: string) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
function shuffled<T>(items: T[], seed: string, avoidIdentity = true): T[] {
  const rng = makeRng(hash(seed));
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (avoidIdentity && a.length > 1 && a.every((x, i) => x === items[i])) a.push(a.shift()!);
  return a;
}
const TYPE_LABEL: Record<Activity['type'], string> = { mcq: 'Multiple choice', numeric: 'Numeric answer', explain: 'Explain (self-check)', order: 'Order the steps', match: 'Match', circuit: 'Build a circuit', code: 'Code cell', reflection: 'Reflection' };
const ROLE_LABEL = { checkpoint: 'Checkpoint', practice: 'Practice', exit: 'Exit check' } as const;
const DIFF = ['', 'easier', 'medium', 'harder'];

export function ActivityCard({ activity: a, context = 'lesson', index, onGraded, onAskTutor, onRetryReset }: { activity: Activity; context?: Context; index?: number; onGraded?: (r: GradeResult) => void; onAskTutor?: (id: string) => void; onRetryReset?: () => void }) {
  const store = useStore();
  const prog = useProgress();
  const session = useSession();
  const ap = prog.activities[a.id];
  const hintLevel = session.hintLevels[a.id] ?? 0;
  const [result, setResult] = useState<GradeResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [busy, setBusy] = useState(false);
  const [codeRun, setCodeRun] = useState<CodeRunResult | null>(null);
  // inputs
  const [choiceId, setChoiceId] = useState('');
  const [num, setNum] = useState('');
  const [text, setText] = useState('');
  const [ticked, setTicked] = useState<string[]>([]);
  const spec = a.answerSpec;
  const [orderIds, setOrderIds] = useState<string[]>(() => (spec.type === 'order' ? shuffled(spec.items.map((i) => i.id), a.id) : []));
  const rightOrder = useMemo(() => (spec.type === 'match' ? shuffled(spec.pairs.map((p) => p.id), a.id + 'r') : []), [spec, a.id]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [gates, setGates] = useState<GateStep[]>([]);
  const [source, setSource] = useState(spec.type === 'code' ? spec.starter : '');

  const lastAttempt = ap?.attempts[ap.attempts.length - 1];
  const maxHint = Math.min(3, a.hints.length);

  const build = (): Response | null => {
    switch (spec.type) {
      case 'mcq': return { type: 'mcq', choiceId };
      case 'numeric': return { type: 'numeric', value: num };
      case 'explain': case 'reflection': return { type: spec.type, text, ticked };
      case 'order': return { type: 'order', ids: orderIds };
      case 'match': return { type: 'match', pairs };
      case 'circuit': return { type: 'circuit', gates };
      case 'code': return { type: 'code', source };
    }
  };

  async function submit() {
    setBusy(true);
    try {
      let res: GradeResult;
      if (spec.type === 'code') {
        const run = await runCodeInWorker(source, spec.tests);
        setCodeRun(run);
        res = gradeCodeRun(a, run);
      } else res = gradeActivity(a, build()!);
      setResult(res);
      if (res.status === 'invalid') { session.announce(res.message); return; }
      store.recordAttempt(a, { correct: res.correct, hintLevel: showSolution ? 3 : hintLevel, context, selfAssessed: res.selfAssessed });
      session.setLastResult(a.id, { correct: res.correct, diagnosis: res.diagnosis });
      session.announce(res.selfAssessed ? 'Self-check recorded.' : res.correct ? 'Correct.' : 'Not yet correct. ' + (res.diagnosis ?? ''));
      onGraded?.(res);
    } finally { setBusy(false); }
  }
  function askHint() {
    const next = Math.min(maxHint, hintLevel + 1) as 0 | 1 | 2 | 3;
    session.setHintLevel(a.id, next);
    session.announce(`Hint ${next} shown.`);
  }
  function revealSolution() {
    setShowSolution(true);
    session.setHintLevel(a.id, 3);
    session.bumpSolutionRequests(a.id);
  }
  function retry() { setResult(null); onRetryReset?.(); }
  const move = (i: number, d: -1 | 1) => setOrderIds((o) => { const n = [...o]; const j = i + d; if (j < 0 || j >= n.length) return o; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const graded = result && result.status === 'graded' ? result : null;
  const dotId = `act-${a.id}`;
  const done = graded?.correct;

  return (
    <article className={`activity ${a.role === 'checkpoint' ? 'checkpoint' : ''}`} aria-labelledby={`${dotId}-h`} id={dotId}>
      <header>
        <strong id={`${dotId}-h`}>{index !== undefined ? `${index}. ` : ''}{ROLE_LABEL[a.role]}</strong>
        <span className="pill">{TYPE_LABEL[a.type]}</span>
        <span className="pill">{DIFF[a.difficulty]}</span>
        {a.conceptTags.slice(0, 3).map((t) => <span key={t} className="pill info">{t}</span>)}
      </header>
      <div><Markdown text={a.prompt} /></div>

      {spec.type === 'mcq' && (
        <fieldset disabled={!!done}>
          <legend>Choose one answer</legend>
          {spec.choices.map((c) => (
            <label key={c.id} className={`choice ${choiceId === c.id ? 'sel' : ''}`}>
              <input type="radio" name={a.id} value={c.id} checked={choiceId === c.id} onChange={() => { setChoiceId(c.id); if (result) setResult(null); }} />
              <span><Markdown text={c.text} inline /></span>
            </label>
          ))}
        </fieldset>
      )}
      {spec.type === 'numeric' && (
        <div className="row">
          <label htmlFor={`${dotId}-num`}>Your answer{spec.unit ? ` (${spec.unit})` : ''}:</label>
          <input id={`${dotId}-num`} type="text" inputMode="decimal" autoComplete="off" value={num} disabled={!!done} onChange={(e) => { setNum(e.target.value); if (result) setResult(null); }} onKeyDown={(e) => e.key === 'Enter' && submit()} aria-describedby={`${dotId}-numhelp`} />
          <span id={`${dotId}-numhelp`} className="small muted">Numbers, fractions (1/2), 1/sqrt(2) or percentages are fine.</span>
        </div>
      )}
      {(spec.type === 'explain' || spec.type === 'reflection') && (
        <div className="stack">
          <label htmlFor={`${dotId}-txt`}>Your explanation</label>
          <textarea id={`${dotId}-txt`} value={text} onChange={(e) => { setText(e.target.value); if (result) setResult(null); }} />
          <fieldset>
            <legend>Self-check rubric — tick only what your answer actually contained</legend>
            {spec.rubric.map((r) => (
              <label key={r.id} className="inline" style={{ display: 'flex' }}>
                <input type="checkbox" checked={ticked.includes(r.id)} onChange={(e) => setTicked((t) => (e.target.checked ? [...t, r.id] : t.filter((x) => x !== r.id)))} />
                <span><Markdown text={r.text} inline /></span>
              </label>
            ))}
          </fieldset>
          <p className="small muted">Local mode cannot grade free text. This is recorded as <em>self-assessed</em> evidence: it can count toward "practiced" but never toward "secure".</p>
        </div>
      )}
      {spec.type === 'order' && (
        <div>
          <p className="small muted">Use the arrow buttons to reorder the steps (first step at the top).</p>
          <ol>
            {orderIds.map((id, i) => (
              <li key={id} style={{ margin: '6px 0' }}>
                <span className="row">
                  <span style={{ flex: 1, minWidth: 180 }}><Markdown text={spec.items.find((x) => x.id === id)!.text} inline /></span>
                  <button type="button" className="ghost small" onClick={() => move(i, -1)} disabled={i === 0 || !!done} aria-label={`Move step ${i + 1} up`}>↑</button>
                  <button type="button" className="ghost small" onClick={() => move(i, 1)} disabled={i === orderIds.length - 1 || !!done} aria-label={`Move step ${i + 1} down`}>↓</button>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {spec.type === 'match' && (
        <div className="stack">
          <div className="callout">
            <strong>Options</strong>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {rightOrder.map((id, i) => <li key={id}><strong>{String.fromCharCode(65 + i)}.</strong> <Markdown text={spec.pairs.find((p) => p.id === id)!.right} inline /></li>)}
            </ul>
          </div>
          {spec.pairs.map((p) => (
            <div className="row" key={p.id}>
              <label htmlFor={`${dotId}-${p.id}`} style={{ minWidth: 160 }}><Markdown text={p.left} inline /></label>
              <select id={`${dotId}-${p.id}`} disabled={!!done} value={pairs[p.id] ?? ''} onChange={(e) => { setPairs((s) => ({ ...s, [p.id]: e.target.value })); if (result) setResult(null); }}>
                <option value="">Choose…</option>
                {rightOrder.map((id, i) => <option key={id} value={id}>{String.fromCharCode(65 + i)}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
      {spec.type === 'circuit' && <CircuitInput spec={spec} gates={gates} setGates={(g) => { setGates(g); if (result) setResult(null); }} disabled={!!done} idp={dotId} />}
      {spec.type === 'code' && (
        <div className="stack">
          <p className="small muted">Runs as JavaScript in a sandboxed Web Worker with the app's quantum library as <code>Q</code>. Available: <code>{spec.api}</code></p>
          <label htmlFor={`${dotId}-code`}>Your code (define <code>solve</code>)</label>
          <textarea id={`${dotId}-code`} className="codearea" spellCheck={false} value={source} onChange={(e) => { setSource(e.target.value); if (result) setResult(null); }} />
          <div className="row"><button type="button" className="ghost small" onClick={() => setSource(spec.starter)}>Reset to starter code</button></div>
          {codeRun && !codeRun.fatal && (
            <ul>{codeRun.outcomes.map((o, i) => <li key={i}>{o.ok ? '✓ pass' : '✗ fail'} — {o.label}{!o.ok && (o.error ? ` (error: ${o.error})` : ` (returned ${JSON.stringify(o.value)})`)}</li>)}</ul>
          )}
        </div>
      )}

      {hintLevel > 0 && (
        <div className="hintbox" aria-label="Hints used">
          {a.hints.filter((h) => h.level <= hintLevel).map((h) => <div key={h.level}><strong>Hint {h.level}:</strong> <Markdown text={h.text} inline /></div>)}
        </div>
      )}

      <div className="row" style={{ marginTop: 10 }}>
        {!done && <button type="button" onClick={submit} disabled={busy}>{busy ? 'Checking…' : spec.type === 'code' ? 'Run tests' : spec.type === 'explain' || spec.type === 'reflection' ? 'Record self-check' : 'Check answer'}</button>}
        {!done && hintLevel < maxHint && <button type="button" className="secondary" onClick={askHint}>{hintLevel === 0 ? 'Give me a hint' : 'Another hint'}</button>}
        {!showSolution && <button type="button" className="ghost" onClick={revealSolution} aria-describedby={`${dotId}-sol`}>Show worked solution</button>}
        {onAskTutor && <button type="button" className="ghost" onClick={() => onAskTutor(a.id)}>Ask the tutor about this item</button>}
      </div>
      <p id={`${dotId}-sol`} className="small muted">Hints and solutions never block you. Seeing the full scaffold or solution is recorded as assisted, so it won't count as independent evidence.</p>

      <div className="feedback" aria-live="polite">
        {result?.status === 'invalid' && <div className="callout bad"><Markdown text={result.message} inline /></div>}
        {graded && (
          <div className={`callout ${graded.selfAssessed ? '' : graded.correct ? 'ok' : 'bad'}`}>
            <strong>{graded.selfAssessed ? (graded.correct ? '✓ Self-check recorded (self-assessed)' : '… Self-check recorded — review the model answer') : graded.correct ? '✓ Correct' : '✗ Not yet'}</strong>
            <p><Markdown text={graded.message} inline /></p>
            {graded.conceptTags.length > 0 && <p className="small">Concepts: {graded.conceptTags.join(', ')}</p>}
            {!graded.correct && !graded.selfAssessed && <p className="small">Next action: {hintLevel < maxHint ? 'ask for a hint, or ' : ''}re-read the step the feedback points to and try again. <button type="button" className="ghost small" onClick={retry}>Try again</button></p>}
            {a.feedback.followUp && graded.correct && <p><strong>Follow-up to think about:</strong> <Markdown text={a.feedback.followUp} inline /></p>}
            {(spec.type === 'explain' || spec.type === 'reflection') && <details className="opt"><summary>Model answer</summary><Markdown text={spec.modelAnswer} /></details>}
            <fieldset>
              <legend className="small">How confident were you? (optional)</legend>
              <div className="row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="inline"><input type="radio" name={`${a.id}-conf`} checked={ap?.confidence === n} onChange={() => store.setConfidence(a.id, n as 1 | 2 | 3 | 4 | 5)} /> {n}</label>
                ))}
                <span className="small muted">1 = guessing, 5 = certain</span>
              </div>
            </fieldset>
          </div>
        )}
        {showSolution && (
          <div className="callout">
            <strong>Worked solution</strong>
            <ol>{a.feedback.solutionSteps.map((s, i) => <li key={i}><Markdown text={s} inline /></li>)}</ol>
            {a.answerSpec.type === 'circuit' && <p className="small">One valid circuit: {a.answerSpec.solution.map((g) => `${g.gate}(${g.targets.join(',')})`).join(' → ')}</p>}
            {a.answerSpec.type === 'code' && <pre className="code">{a.answerSpec.solutionSource}</pre>}
            {a.feedback.followUp && <p><strong>Think next:</strong> <Markdown text={a.feedback.followUp} inline /></p>}
          </div>
        )}
      </div>
      {ap && ap.attempts.length > 0 && (
        <p className="small muted">Your record on this item: {ap.attempts.length} attempt{ap.attempts.length > 1 ? 's' : ''}; last {lastAttempt!.correct ? 'correct' : 'incorrect'}{lastAttempt!.hintLevel ? ` with hint level ${lastAttempt!.hintLevel}` : ' without hints'}{lastAttempt!.selfAssessed ? ' (self-assessed)' : ''}.</p>
      )}
    </article>
  );
}

function CircuitInput({ spec, gates, setGates, disabled, idp }: { spec: Extract<Activity['answerSpec'], { type: 'circuit' }>; gates: GateStep[]; setGates: (g: GateStep[]) => void; disabled: boolean; idp: string }) {
  const [gate, setGate] = useState(spec.allowedGates[0]);
  const [t0, setT0] = useState(0);
  const [t1, setT1] = useState(spec.numQubits > 1 ? 1 : 0);
  const def = GATES[gate];
  const state = useMemo(() => { try { return gates.length ? simulate(spec.numQubits, gates) : simulate(spec.numQubits, []); } catch { return null; } }, [gates, spec.numQubits]);
  const probs = state ? probabilities(state) : [];
  const qOpts = Array.from({ length: spec.numQubits }, (_, i) => i);
  const add = () => {
    if (gates.length >= 12) return;
    const targets = def.arity === 1 ? [t0] : [t0, t1];
    if (def.arity === 2 && t0 === t1) return;
    setGates([...gates, { gate, targets }]);
  };
  return (
    <div className="stack">
      <p className="small"><strong>Target:</strong> {spec.targetLabel}. Start state |{'0'.repeat(spec.numQubits)}⟩; gates apply left to right. At most {spec.maxGates} gates.</p>
      <div className="row">
        <label htmlFor={`${idp}-g`}>Gate</label>
        <select id={`${idp}-g`} value={gate} onChange={(e) => setGate(e.target.value)} disabled={disabled}>{spec.allowedGates.map((g) => <option key={g} value={g}>{g}</option>)}</select>
        <label htmlFor={`${idp}-q0`}>{def.arity === 2 ? 'Control / first qubit' : 'Qubit'}</label>
        <select id={`${idp}-q0`} value={t0} onChange={(e) => setT0(+e.target.value)} disabled={disabled}>{qOpts.map((q) => <option key={q} value={q}>q{q}</option>)}</select>
        {def.arity === 2 && (<><label htmlFor={`${idp}-q1`}>Target / second qubit</label><select id={`${idp}-q1`} value={t1} onChange={(e) => setT1(+e.target.value)} disabled={disabled}>{qOpts.map((q) => <option key={q} value={q}>q{q}</option>)}</select></>)}
        <button type="button" className="secondary small" onClick={add} disabled={disabled || (def.arity === 2 && t0 === t1)}>Add gate</button>
        <button type="button" className="ghost small" onClick={() => setGates(gates.slice(0, -1))} disabled={disabled || !gates.length}>Remove last</button>
        <button type="button" className="ghost small" onClick={() => setGates([])} disabled={disabled || !gates.length}>Clear</button>
      </div>
      <div>
        <strong>Your circuit:</strong> {gates.length ? <ol className="circuit-list">{gates.map((g, i) => <li key={i}>{g.gate} on q{g.targets.join(', q')}</li>)}</ol> : <span className="muted">empty</span>}
      </div>
      {state && (
        <div className="table-wrap"><table>
          <caption className="small muted">Statevector after your circuit (amplitude, probability)</caption>
          <thead><tr><th scope="col">Basis</th><th scope="col">Amplitude</th><th scope="col">Probability</th></tr></thead>
          <tbody>{state.map((amp, i) => <tr key={i}><td>|{bitString(i, spec.numQubits)}⟩</td><td>{fmt(amp, 3)}</td><td>{probs[i].toFixed(3)}</td></tr>)}</tbody>
        </table></div>
      )}
    </div>
  );
}
