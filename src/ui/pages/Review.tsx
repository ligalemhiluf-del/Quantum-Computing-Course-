import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseData as d } from '../../content';
import { useProgress } from '../../app/state';
import { dueObjectives, reviewQueue, unitQuiz } from '../../domain/progress/selectors';
import type { Activity } from '../../domain/curriculum/types';
import { PageTitle, Meter } from '../components/Common';
import { ActivityCard } from '../components/ActivityCard';
import { Markdown } from '../components/Markdown';

type Session = { kind: 'review' | 'quiz'; items: Activity[]; label: string };

export function ReviewPage() {
  const p = useProgress();
  const due = dueObjectives(d, p);
  const [session, setSession] = useState<Session | null>(null);
  const quizModules = d.modules.filter((m) => unitQuiz(d, m.id, 1).length > 0);
  const [qm, setQm] = useState(quizModules[0]?.id ?? '');
  const start = (s: Session) => setSession(s);
  return (
    <div className="stack">
      <PageTitle sub="Retrieval practice and short quizzes. Low stakes: no grades, no penalties, and hints never block you.">Review and quiz</PageTitle>
      {session ? <Runner key={session.label + session.items.length} s={session} onExit={() => setSession(null)} /> : (
        <div className="grid cols-2">
          <section className="card" aria-labelledby="due-h">
            <h2 id="due-h" style={{ marginTop: 0 }}>Due review ({due.length})</h2>
            {due.length === 0 ? <p className="muted">Nothing is due yet. After you answer practice items, objectives come back for review: missed ones after a day, correct ones at growing intervals (1, 3, 7, 21, 60 days). A correct review answer at least 20 hours after you first became "practiced" can upgrade an objective to <em>secure</em>.</p> : (
              <>
                <ul>{due.slice(0, 6).map((x) => <li key={x.objectiveId}><strong>{x.module.id}</strong>: {x.text}</li>)}</ul>
                <button type="button" onClick={() => { const items = reviewQueue(d, p, 8); if (items.length) start({ kind: 'review', items, label: 'Due review' }); }} disabled={reviewQueue(d, p, 1).length === 0}>Start review ({Math.min(8, reviewQueue(d, p, 8).length)} questions)</button>
              </>
            )}
          </section>
          <section className="card" aria-labelledby="quiz-h">
            <h2 id="quiz-h" style={{ marginTop: 0 }}>Unit quiz</h2>
            <p className="muted">Six gradable items from a unit, easiest first.</p>
            <div className="row"><label htmlFor="qm">Unit</label>
              <select id="qm" value={qm} onChange={(e) => setQm(e.target.value)}>{quizModules.map((m) => <option key={m.id} value={m.id}>{m.id} {m.title}</option>)}</select>
              <button type="button" onClick={() => start({ kind: 'quiz', items: unitQuiz(d, qm, 6), label: `Unit quiz ${qm}` })} disabled={!qm}>Start quiz</button></div>
          </section>
          <section className="card" aria-labelledby="diag-h">
            <h2 id="diag-h" style={{ marginTop: 0 }}>Diagnostic</h2>
            <p>Six short questions on complex numbers, matrices, probability and NumPy. It never blocks you; it tells you which refreshers to prioritise.</p>
            <Link className="btn" to="/lesson/a0-diagnostic">Open the diagnostic</Link>
          </section>
          <section className="card" aria-labelledby="miss-h">
            <h2 id="miss-h" style={{ marginTop: 0 }}>Concepts to revisit</h2>
            <Missed />
          </section>
        </div>
      )}
    </div>
  );
}

function Missed() {
  const p = useProgress();
  const tags = new Map<string, number>();
  for (const a of d.activities) { const last = p.activities[a.id]?.attempts.slice(-1)[0]; if (last && !last.correct) a.conceptTags.forEach((t) => tags.set(t, (tags.get(t) ?? 0) + 1)); }
  if (tags.size === 0) return <p className="muted">No missed items on record. Missed concepts will be listed here as practice prompts, never as a score.</p>;
  return <ul>{[...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => <li key={t}>{d.tutorConcepts.find((c) => c.tag === t)?.title ?? t} <span className="small muted">({n} item{n > 1 ? 's' : ''} to retry)</span></li>)}</ul>;
}

function Runner({ s, onExit }: { s: Session; onExit: () => void }) {
  const p = useProgress();
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const items = useMemo(() => s.items, [s]);
  const done = i >= items.length;
  if (done) {
    const correct = Object.values(results).filter(Boolean).length;
    const missed = items.filter((a) => results[a.id] === false);
    return (
      <section className="card" aria-labelledby="sum-h">
        <h2 id="sum-h" style={{ marginTop: 0 }}>{s.label} finished</h2>
        <p>You answered {Object.keys(results).length} of {items.length} items; {correct} correct on the last try. That is information, not a grade.</p>
        {missed.length > 0 ? (<><p>Worth another look:</p><ul>{missed.map((a) => <li key={a.id}>{a.conceptTags.join(', ')} — see <Link to={`/lesson/${a.ownerId}`}>the lesson</Link></li>)}</ul></>) : <p>Nothing missed this round — nice retrieval.</p>}
        <button type="button" onClick={onExit}>Back to review</button>
      </section>
    );
  }
  const a = items[i];
  const attempted = (p.activities[a.id]?.attempts.length ?? 0) > 0 && results[a.id] !== undefined;
  return (
    <section aria-labelledby="run-h">
      <div className="row between"><h2 id="run-h" style={{ margin: 0 }}>{s.label}: question {i + 1} of {items.length}</h2><button type="button" className="ghost small" onClick={onExit}>Stop</button></div>
      <Meter value={i / items.length} label="Quiz progress" />
      <ActivityCard key={a.id} activity={a} context={s.kind} onGraded={(r) => r.status === 'graded' && setResults((x) => ({ ...x, [a.id]: r.correct }))} />
      <div className="row"><button type="button" onClick={() => setI(i + 1)}>{attempted ? (i + 1 === items.length ? 'Finish' : 'Next question') : 'Skip for now'}</button></div>
      <p className="small muted">Source: <Markdown text={`${a.ownerId}`} inline /></p>
    </section>
  );
}
