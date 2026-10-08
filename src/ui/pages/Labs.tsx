import { useState, type ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseData as d } from '../../content';
import { useProgress, useSession, useStore } from '../../app/state';
import { unmetPrerequisites } from '../../domain/progress/selectors';
import { Crumbs, PageTitle } from '../components/Common';
import { Markdown } from '../components/Markdown';
import { ActivityCard } from '../components/ActivityCard';
import { BlochLab } from '../labs/BlochLab';
import { BellLab } from '../labs/BellLab';
import { NoiseLab } from '../labs/NoiseLab';
import { PhysicsLab } from '../labs/PhysicsLab';
import type { SaveFn } from '../labs/shared';
import { NotFound } from './NotFound';

const LABS: Record<string, ComponentType<{ onSave: SaveFn }>> = { 'lab-bloch': BlochLab, 'lab-bell': BellLab, 'lab-noise': NoiseLab, 'lab-physics': PhysicsLab };

export function LabsIndex() {
  const p = useProgress();
  return (
    <div className="stack">
      <PageTitle sub="Four simulator-first labs. They run entirely in your browser; no quantum hardware or network backend is involved.">Labs</PageTitle>
      <div className="grid cols-2">
        {d.labs.map((l) => (
          <article className="card" key={l.id}>
            <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}><Link to={`/lab/${l.id}`}>{l.title}</Link></h2>
            <p>{l.summary}</p>
            <p className="small muted">Module {l.moduleId} · about {l.estimatedMinutes} min · {p.labs[l.id]?.completed ? '✓ completed' : p.labs[l.id]?.runs ? `${p.labs[l.id].runs} saved run(s)` : 'not started'}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function LabPage() {
  const { id } = useParams();
  const lab = d.labs.find((l) => l.id === id);
  if (!lab) return <NotFound what="lab" />;
  return <LabView key={lab.id} labId={lab.id} />;
}

function LabView({ labId }: { labId: string }) {
  const lab = d.labs.find((l) => l.id === labId)!;
  const m = d.modules.find((x) => x.id === lab.moduleId)!;
  const p = useProgress();
  const store = useStore();
  const session = useSession();
  const Comp = LABS[lab.id];
  const lp = p.labs[lab.id];
  const unmet = lab.prerequisiteModuleIds.map((pid) => d.modules.find((x) => x.id === pid)!).filter((pm) => pm.availability === 'preview' || unmetPrerequisites(d, { ...m, prerequisiteModuleIds: [pm.id] }, p).length > 0);
  const [msg, setMsg] = useState('');
  const acts = lab.activityIds.map((a) => d.activities.find((x) => x.id === a)!);
  const allAttempted = acts.every((a) => (p.activities[a.id]?.attempts.length ?? 0) > 0);
  const canComplete = (lp?.runs ?? 0) >= 1 && allAttempted;
  const onSave: SaveFn = (label, params, summary) => {
    store.recordLabRun(lab.id);
    store.saveLabArtifact(lab.id, { label, params, summary });
    setMsg(`Saved: ${label}`);
    session.announce('Run saved to your lab record.');
  };
  return (
    <div className="stack">
      <Crumbs items={[{ to: '/labs', label: 'Labs' }, { label: lab.title }]} />
      <PageTitle sub={<><Markdown text={lab.summary} inline /> (module <Link to={`/module/${m.id}`}>{m.id}</Link>, about {lab.estimatedMinutes} min)</>}>{lab.title}</PageTitle>
      {unmet.length > 0 && <div className="callout" role="note"><strong>Heads-up, not a gate:</strong> this lab builds on {unmet.map((u) => `${u.id} (${u.title}${u.availability === 'preview' ? ', preview' : ''})`).join(', ')}. You can explore it now; the prerequisite ideas are summarised in the physics notes below.</div>}
      <div className="grid cols-2">
        <section className="card" aria-labelledby="inst-h">
          <h2 id="inst-h" style={{ marginTop: 0, fontSize: '1.15rem' }}>What to do</h2>
          <ol>{lab.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <p><strong>Learning outcomes:</strong></p>
          <ul>{lab.objectives.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>
        <section className="card" aria-labelledby="phys-h">
          <h2 id="phys-h" style={{ marginTop: 0, fontSize: '1.15rem' }}>What it means</h2>
          <p>{lab.physicsMeaning}</p>
          <details className="opt" open><summary>Assumptions and limits of this simulator</summary><ul>{lab.assumptions.map((s, i) => <li key={i}>{s}</li>)}</ul></details>
        </section>
      </div>
      <section aria-label="Lab workspace"><Comp onSave={onSave} /></section>
      {msg && <div className="toast" role="status">{msg}</div>}

      <section aria-labelledby="chk-h">
        <h2 id="chk-h">Check your understanding</h2>
        {acts.map((a, i) => <ActivityCard key={a.id} activity={a} index={i + 1} context="lab" />)}
      </section>

      <section className="card" aria-labelledby="rec-h">
        <h2 id="rec-h" style={{ marginTop: 0 }}>Your lab record</h2>
        <label htmlFor="lab-notes">Notes (saved when you leave the box)</label>
        <textarea id="lab-notes" defaultValue={lp?.notes ?? ''} onBlur={(e) => store.setLabNotes(lab.id, e.target.value)} />
        <h3>Saved runs ({lp?.artifacts.length ?? 0})</h3>
        {(lp?.artifacts.length ?? 0) === 0 ? <p className="muted">No saved runs yet. Use “Save this run” inside the lab to keep inputs, method assumptions and a result summary.</p> : (
          <ul>{lp!.artifacts.map((a) => (
            <li key={a.id}><strong>{a.label}</strong> <span className="small muted">({new Date(a.savedAt).toLocaleString()})</span><br /><span className="small">{a.summary}</span><br /><span className="small muted">inputs: {Object.entries(a.params).map(([k, v]) => `${k}=${v}`).join(', ')}</span> <button type="button" className="ghost small" onClick={() => store.deleteLabArtifact(lab.id, a.id)}>Delete</button></li>
          ))}</ul>
        )}
        <div className="row">
          {lp?.completed ? <><span className="pill ok">✓ Lab completed</span><button type="button" className="ghost" onClick={() => store.setLabCompleted(lab.id, false)}>Mark as not completed</button></> : <button type="button" disabled={!canComplete} onClick={() => store.setLabCompleted(lab.id, true)}>Mark lab complete</button>}
        </div>
        {!lp?.completed && <p className="small muted">To complete: save at least one run and attempt every check question above (right or wrong). Currently: {lp?.runs ?? 0} saved run(s), {acts.filter((a) => (p.activities[a.id]?.attempts.length ?? 0) > 0).length}/{acts.length} questions attempted.</p>}
      </section>
    </div>
  );
}
