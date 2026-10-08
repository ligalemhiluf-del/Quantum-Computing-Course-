import { Link } from 'react-router-dom';
import { courseData as d } from '../../content';
import { useProgress, useStore } from '../../app/state';
import { recommendNext, dueObjectives, trackProgress, lessonStatus } from '../../domain/progress/selectors';
import { attemptsThisWeek } from '../../domain/progress/mastery';
import { Meter, PageTitle, ModuleStatusPill } from '../components/Common';
import { moduleStatus } from '../../domain/progress/selectors';

export function Dashboard() {
  const p = useProgress();
  const store = useStore();
  const rec = recommendNext(d, p);
  const due = dueObjectives(d, p);
  const week = attemptsThisWeek(p);
  const target = p.preferences.weeklyTarget;
  const labsDone = d.labs.filter((l) => p.labs[l.id]?.completed);
  const touched = Object.keys(p.activities).length > 0 || Object.values(p.lessons).some((l) => l.status !== 'not-started');
  const authored = d.lessons.length;
  return (
    <div className="stack">
      <PageTitle sub="A physics-first, self-paced graduate course for an MSc Physics student coming from nuclear / subnuclear physics.">Quantum Computing for Physicists</PageTitle>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Your goal</h2>
        <p>Translate quantum mechanics into the language of quantum information, derive and simulate small systems, connect circuits to spin Hamiltonians and open systems, and prepare to read papers and scope a thesis-level question. Research interests (dynamics, simulation, open systems, information, variational methods, machine learning) are a flexible pathway — please validate topics with your eventual supervisor.</p>
      </div>

      <div className="grid cols-2">
        <section className="card" aria-labelledby="next-h">
          <h2 id="next-h" style={{ marginTop: 0 }}>{touched ? 'Resume learning' : 'Start here'}</h2>
          {rec.kind === 'lesson' ? (
            <>
              <p><strong>{rec.module.id}: {rec.lesson.title}</strong></p>
              <p className="muted">{rec.reason}</p>
              <p className="small muted">About {rec.lesson.estimatedMinutes} minutes · {rec.lesson.kind === 'diagnostic' ? 'low-stakes diagnostic, never blocks you' : `${rec.lesson.activityIds.length} activities`}</p>
              <Link className="btn" to={`/lesson/${rec.lesson.id}`}>{rec.resume ? 'Resume lesson' : touched ? 'Start next lesson' : 'Begin with the diagnostic'}</Link>
            </>
          ) : <p>{rec.reason}</p>}
        </section>
        <section className="card" aria-labelledby="rev-h">
          <h2 id="rev-h" style={{ marginTop: 0 }}>Review due</h2>
          {due.length === 0 ? <p className="muted">Nothing is due. Reviews are scheduled automatically once you have answered questions: missed ones come back after a day, successful ones at growing intervals.</p> : (
            <><p><strong>{due.length}</strong> objective{due.length > 1 ? 's' : ''} due for retrieval practice:</p>
              <ul>{due.slice(0, 3).map((x) => <li key={x.objectiveId}>{x.module.id}: {x.text}</li>)}</ul>
              <Link className="btn" to="/review">Start review</Link></>
          )}
        </section>
        <section className="card" aria-labelledby="wk-h">
          <h2 id="wk-h" style={{ marginTop: 0 }}>Weekly target</h2>
          {target ? (<><p>{week} of {target} activity attempts in the last 7 days.</p><Meter value={week / target} label="Weekly target progress" /></>) : <p className="muted">Optional: set a target number of activity attempts per week. ({week} attempt{week === 1 ? '' : 's'} in the last 7 days.)</p>}
          <div className="row" style={{ marginTop: 8 }}>
            <label htmlFor="wk">Target (attempts/week)</label>
            <input id="wk" type="number" min={1} max={1000} value={target ?? ''} placeholder="none" style={{ width: '6rem' }} onChange={(e) => store.setPreferences({ weeklyTarget: e.target.value === '' ? null : Math.max(1, Math.floor(+e.target.value || 1)) })} />
          </div>
          <p className="small muted">Attempts, not minutes: time spent never counts as evidence of learning.</p>
        </section>
        <section className="card" aria-labelledby="lab-h">
          <h2 id="lab-h" style={{ marginTop: 0 }}>Labs</h2>
          <p>{labsDone.length} of {d.labs.length} completed.</p>
          <ul>{d.labs.map((l) => <li key={l.id}><Link to={`/lab/${l.id}`}>{l.title}</Link> {p.labs[l.id]?.completed ? <span className="pill ok">✓ completed</span> : p.labs[l.id]?.runs ? <span className="pill warn">in progress</span> : null}</li>)}</ul>
        </section>
      </div>

      <section aria-labelledby="trk-h">
        <h2 id="trk-h">Progress by track</h2>
        <p className="muted">{authored} lessons are fully authored (tracks A and B so far); the other modules appear as planned previews with honest labels.</p>
        <div className="grid cols-3">
          {d.tracks.map((t) => {
            const tp = trackProgress(d, t, p);
            return (
              <div className="card" key={t.id}>
                <h3 style={{ marginTop: 0 }}>Track {t.id}: {t.title}</h3>
                {tp.lessons > 0 ? (
                  <>
                    <p className="small">{tp.completedLessons} / {tp.lessons} authored lessons completed · {tp.authoredModules} of {tp.modules} modules available</p>
                    <Meter value={tp.completedLessons / tp.lessons} label={`Track ${t.id} lessons completed`} />
                    <p className="small muted">Mastery estimate across available modules: {Math.round(tp.mastery * 100)}% (from evidence, not time spent)</p>
                  </>
                ) : <p className="small muted">All {tp.modules} modules are planned previews: objectives and prerequisites only.</p>}
                <Link to={`/curriculum?track=${t.id}`}>Open track</Link>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="map-h">
        <h2 id="map-h">Curriculum map</h2>
        <div className="grid cols-2">
          {d.tracks.map((t) => (
            <div className="card" key={t.id}>
              <strong>Track {t.id}</strong>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                {t.moduleIds.map((id) => { const m = d.modules.find((x) => x.id === id)!; const lessonsDone = m.lessonIds.filter((l) => lessonStatus(p, l) === 'completed').length; return (
                  <li key={id} className="row" style={{ margin: '4px 0' }}><Link to={`/module/${id}`}>{id} {m.title}</Link> <ModuleStatusPill status={moduleStatus(m, p)} labOnly={m.labIds.length > 0 && m.lessonIds.length === 0} />{m.lessonIds.length > 0 && <span className="small muted">{lessonsDone}/{m.lessonIds.length}</span>}</li>); })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
