import { Link, useParams } from 'react-router-dom';
import { courseData as d } from '../../content';
import { useProgress } from '../../app/state';
import { lessonStatus, moduleStatus, prerequisiteReport } from '../../domain/progress/selectors';
import { moduleMastery, PREREQ_THRESHOLD } from '../../domain/progress/mastery';
import { Crumbs, PageTitle, LevelPill, LessonStatusPill, ModuleStatusPill, PrereqPill, Meter } from '../components/Common';
import { Markdown } from '../components/Markdown';
import { NotFound } from './NotFound';

export function ModulePage() {
  const { id } = useParams();
  const p = useProgress();
  const m = d.modules.find((x) => x.id === id);
  if (!m) return <NotFound what="module" />;
  const track = d.tracks.find((t) => t.id === m.trackId)!;
  const rep = prerequisiteReport(d, m, p);
  const unmet = rep.filter((r) => r.status === 'unmet' || r.status === 'partial');
  const dependents = d.modules.filter((x) => x.prerequisiteModuleIds.includes(m.id));
  const mastery = moduleMastery(m, p.objectives);
  return (
    <div className="stack">
      <Crumbs items={[{ to: '/curriculum', label: 'Curriculum' }, { to: `/curriculum?track=${track.id}`, label: `Track ${track.id}` }, { label: m.id }]} />
      <PageTitle sub={m.summary}>{m.id} · {m.title}</PageTitle>
      <div className="row"><ModuleStatusPill status={moduleStatus(m, p)} labOnly={m.labIds.length > 0 && m.lessonIds.length === 0} /><span className="pill">{m.level}</span><span className="pill">about {m.estimatedMinutes} min</span></div>
      {m.availability === 'preview' && (
        <div className="callout misc"><strong>Preview module.</strong> Lessons for this module are <em>not written yet</em> in this MVP. The objectives and prerequisites below are accurate planning information so you can see where it fits; nothing here is fabricated course content.{m.labIds.length > 0 && ' A simulator lab related to this module is available.'}</div>
      )}
      {unmet.length > 0 && (
        <div className="callout" role="note">
          <strong>Heads-up — not a gate:</strong> you can open this module any time, but it builds on material you have little evidence for yet.
          <ul>{unmet.map((r) => <li key={r.module.id}><strong>{r.module.id} ({r.module.title})</strong>: {r.status === 'partial' ? 'partly practised' : 'no evidence yet'}{r.suggestion && <> — review <Link to={`/lesson/${r.suggestion.lessonId}`}>{r.suggestion.title}</Link></>}. Not sure? The <Link to="/lesson/a0-diagnostic">short diagnostic</Link> shows which refreshers matter.</li>)}</ul>
        </div>
      )}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Prerequisites</h2>
        {rep.length === 0 ? <p>None.</p> : <ul>{rep.map((r) => <li key={r.module.id}><Link to={`/module/${r.module.id}`}>{r.module.id} {r.module.title}</Link> <PrereqPill status={r.status} /> {r.status !== 'unavailable' && <span className="small muted">mastery estimate {Math.round(r.mastery * 100)}% (counts as met at {Math.round(PREREQ_THRESHOLD * 100)}%)</span>}</li>)}</ul>}
        {dependents.length > 0 && <p className="small muted">Leads to: {dependents.map((x, i) => <span key={x.id}>{i > 0 && ', '}<Link to={`/module/${x.id}`}>{x.id}</Link></span>)}</p>}
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Learning objectives</h2>
        {m.lessonIds.length > 0 && <><Meter value={mastery} label="Module mastery estimate" /><p className="small muted">Mastery estimate {Math.round(mastery * 100)}% — the average of objective levels (developing 0.3, practiced 0.7, secure 1.0). Opening pages and time spent are never counted.</p></>}
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {m.objectives.map((o) => {
            const op = p.objectives[o.id];
            return (
              <li key={o.id} style={{ margin: '10px 0' }}>
                <div className="row"><strong>{o.id}</strong> <span>{o.text}</span> <LevelPill level={op?.level ?? 'none'} /></div>
                {o.assessmentActivityIds.length === 0 && <span className="small muted">No activities yet (preview).</span>}
                {op && (
                  <details className="opt"><summary>Evidence ({op.evidence.length} attempt{op.evidence.length > 1 ? 's' : ''})</summary>
                    <div className="table-wrap"><table><thead><tr><th scope="col">When</th><th scope="col">Item</th><th scope="col">Result</th><th scope="col">Independent?</th><th scope="col">Context</th></tr></thead>
                      <tbody>{op.evidence.slice(-10).map((e, i) => <tr key={i}><td>{new Date(e.at).toLocaleString()}</td><td>{e.activityId}</td><td>{e.correct ? 'correct' : 'incorrect'}{e.selfAssessed ? ' (self-assessed)' : ''}</td><td>{e.independent ? 'yes' : e.correct ? 'no (full solution seen)' : '—'}</td><td>{e.context}</td></tr>)}</tbody></table></div>
                    <p className="small muted">Rules: developing = any attempt; practiced = independent correct answers on 2 distinct items; secure = practiced + a later auto-graded correct retrieval in review at least 20 hours afterwards.</p>
                    {op.nextReviewAt && <p className="small">Next review due: {new Date(op.nextReviewAt).toLocaleDateString()}</p>}
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      {m.lessonIds.length > 0 && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Lessons</h2>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>{m.lessonIds.map((lid) => { const l = d.lessons.find((x) => x.id === lid)!; return <li key={lid} className="row" style={{ margin: '8px 0' }}><Link to={`/lesson/${lid}`}><strong>{l.title}</strong></Link><span className="small muted">{l.estimatedMinutes} min</span><LessonStatusPill status={lessonStatus(p, lid)} /></li>; })}</ul>
        </section>
      )}
      {m.labIds.length > 0 && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Labs</h2>
          <ul>{m.labIds.map((lid) => { const l = d.labs.find((x) => x.id === lid)!; return <li key={lid}><Link to={`/lab/${lid}`}>{l.title}</Link> — <Markdown text={l.summary} inline /></li>; })}</ul>
        </section>
      )}
    </div>
  );
}
