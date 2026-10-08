import { Link, useParams } from 'react-router-dom';
import { courseData as d } from '../../content';
import { useProgress, useSession, useStore } from '../../app/state';
import { lessonStatus, unmetPrerequisites } from '../../domain/progress/selectors';
import type { LessonSection } from '../../domain/curriculum/types';
import { Crumbs, PageTitle, LessonStatusPill, LevelPill } from '../components/Common';
import { Markdown } from '../components/Markdown';
import { ActivityCard } from '../components/ActivityCard';
import { TutorPanel } from '../components/TutorPanel';
import { NotFound } from './NotFound';

const KIND_TITLE: Partial<Record<LessonSection['kind'], string>> = { motivation: 'Motivating question', misconception: 'Watch out', derivation: 'Optional depth', extension: 'Optional extension', conventions: 'Conventions' };

export function LessonPage() {
  const { id } = useParams();
  const l = d.lessons.find((x) => x.id === id);
  if (!l) return <NotFound what="lesson" />;
  return <LessonView key={l.id} lessonId={l.id} />;
}

function LessonView({ lessonId }: { lessonId: string }) {
  const l = d.lessons.find((x) => x.id === lessonId)!;
  const m = d.modules.find((x) => x.id === l.moduleId)!;
  const p = useProgress();
  const store = useStore();
  const session = useSession();
  const acts = l.activityIds.map((a) => d.activities.find((x) => x.id === a)!);
  const practice = acts.filter((a) => a.role === 'practice');
  const exit = acts.find((a) => a.role === 'exit');
  const status = lessonStatus(p, l.id);
  const unmet = unmetPrerequisites(d, m, p).filter((r) => r.status === 'unmet');
  const attempted = (id: string) => (p.activities[id]?.attempts.length ?? 0) > 0;
  const exitDone = l.kind === 'diagnostic' ? practice.every((a) => attempted(a.id)) : !!exit && attempted(exit.id);
  const read = p.lessons[l.id]?.sectionsRead ?? [];
  const askTutor = (aid: string) => { session.setFocus(l.id, aid); document.getElementById(`ask-${l.id}`)?.focus(); session.announce('Tutor focused on this item. Type your question or use the hint buttons.'); };
  const wide = typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(min-width: 961px)').matches;

  return (
    <div className="stack">
      <Crumbs items={[{ to: '/curriculum', label: 'Curriculum' }, { to: `/module/${m.id}`, label: `${m.id} ${m.title}` }, { label: l.title }]} />
      <PageTitle sub={<>About {l.estimatedMinutes} minutes · <LessonStatusPill status={status} /></>}>{l.title}</PageTitle>
      <div className="lesson-layout">
        <div className="stack" style={{ minWidth: 0 }}>
          <section className="card" aria-labelledby="obj-h">
            <h2 id="obj-h" style={{ marginTop: 0 }}>Objectives and prerequisites</h2>
            <p><strong>Motivating question.</strong> <Markdown text={l.question} inline /></p>
            <ul>{l.objectives.map((oid) => { const o = m.objectives.find((x) => x.id === oid)!; return <li key={oid}>{o.text} <LevelPill level={p.objectives[oid]?.level ?? 'none'} /></li>; })}</ul>
            <p className="small muted">Prerequisite lessons: {l.prerequisiteLessonIds.length ? l.prerequisiteLessonIds.map((pid, i) => <span key={pid}>{i > 0 && ', '}<Link to={`/lesson/${pid}`}>{d.lessons.find((x) => x.id === pid)?.title}</Link></span>) : 'none'}</p>
            {unmet.length > 0 && <div className="callout" role="note"><strong>Heads-up:</strong> {unmet.map((r) => `${r.module.id} (${r.module.title})`).join(', ')} {unmet.length > 1 ? 'have' : 'has'} no practice evidence yet. You can continue; if you get stuck, {unmet[0].suggestion ? <>review <Link to={`/lesson/${unmet[0].suggestion.lessonId}`}>{unmet[0].suggestion.title}</Link> or </> : ''}take the <Link to="/lesson/a0-diagnostic">diagnostic</Link>.</div>}
          </section>

          <p className="small"><a href="#lesson-tutor" onClick={(e) => { e.preventDefault(); document.getElementById(`ask-${l.id}`)?.focus(); }}>Jump to the tutor panel</a></p>

          {l.sections.map((s) => s.kind === 'checkpoint' ? (
            <section key={s.id} aria-labelledby={`s-${s.id}`}>
              <h2 id={`s-${s.id}`}>{s.title}</h2>
              <p className="muted">{s.body}</p>
              <ActivityCard activity={d.activities.find((a) => a.id === s.activityId)!} onAskTutor={askTutor} />
            </section>
          ) : s.collapsed ? (
            <details className="opt" key={s.id}><summary>{KIND_TITLE[s.kind] ?? ''}{KIND_TITLE[s.kind] ? ': ' : ''}<Markdown text={s.title} inline /></summary><Markdown text={s.body} /></details>
          ) : (
            <section key={s.id} aria-labelledby={`s-${s.id}`} className={s.kind === 'misconception' ? 'callout misc' : s.kind === 'motivation' ? 'callout' : ''}>
              <h2 id={`s-${s.id}`} style={s.kind === 'misconception' || s.kind === 'motivation' ? { marginTop: 0, fontSize: '1.15rem' } : undefined}>{KIND_TITLE[s.kind] && s.kind !== 'conventions' ? `${KIND_TITLE[s.kind]}: ` : ''}<Markdown text={s.title} inline /></h2>
              <Markdown text={s.body} />
              <label className="inline small"><input type="checkbox" checked={read.includes(s.id)} onChange={() => store.markSectionRead(l.id, s.id)} disabled={read.includes(s.id)} /> {read.includes(s.id) ? 'Marked as read' : 'Mark as read'}</label>
            </section>
          ))}

          <section aria-labelledby="prac-h">
            <h2 id="prac-h">{l.kind === 'diagnostic' ? 'Diagnostic questions' : 'Practice'}</h2>
            <p className="muted">{l.kind === 'diagnostic' ? 'Answer from memory. Nothing here blocks you.' : `${practice.length} items with graduated difficulty. Solutions stay hidden until you ask.`}</p>
            {practice.map((a, i) => <ActivityCard key={a.id} activity={a} index={i + 1} onAskTutor={askTutor} />)}
          </section>

          {exit && (
            <section aria-labelledby="exit-h">
              <h2 id="exit-h">Exit check</h2>
              <p className="muted">One short question mapped to this lesson's objectives ({exit.objectiveIds.join(', ')}).</p>
              <ActivityCard activity={exit} onAskTutor={askTutor} />
            </section>
          )}

          <section className="card" aria-labelledby="done-h">
            <h2 id="done-h" style={{ marginTop: 0 }}>Finish this lesson</h2>
            <p>{exitDone ? 'You have attempted the exit check. Completing the lesson records only that you finished; mastery comes from your answers and later review.' : l.kind === 'diagnostic' ? 'Attempt each question (right or wrong), then mark the diagnostic complete.' : 'Attempt the exit check (right or wrong — hints never block you) to enable completion.'}</p>
            <div className="row">
              {status !== 'completed' ? <button type="button" disabled={!exitDone} onClick={() => { store.completeLesson(l.id); session.announce('Lesson marked complete.'); }}>Mark lesson complete</button> : <><span className="pill ok">✓ Completed</span><button type="button" className="ghost" onClick={() => store.reopenLesson(l.id)}>Reopen</button></>}
              {status === 'completed' && nextLesson(l.id) && <Link className="btn" to={`/lesson/${nextLesson(l.id)}`}>Next lesson</Link>}
            </div>
          </section>

          <section aria-labelledby="ref-h">
            <h2 id="ref-h">References and further reading</h2>
            <ul>{l.references.map((r, i) => <li key={i}>{r.url ? <a href={r.url} target="_blank" rel="noreferrer noopener">{r.citation}</a> : r.citation}{r.note ? <span className="small muted"> — {r.note}</span> : null}</li>)}</ul>
            <p className="small muted">Citation details are given from memory of well-known sources and should be verified against the actual publication before you cite them.</p>
          </section>
        </div>
        <aside className="tutor-col" id="lesson-tutor" aria-label="Lesson tutor">
          <TutorPanel scope={l.id} lessonId={l.id} activityIds={l.activityIds} initialOpen={wide} />
        </aside>
      </div>
    </div>
  );
}

function nextLesson(id: string): string | null {
  const order = d.course.recommendedOrder.flatMap((mid) => d.modules.find((m) => m.id === mid)!.lessonIds);
  const i = order.indexOf(id);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}
