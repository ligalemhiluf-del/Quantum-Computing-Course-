import { useState } from 'react';
import { Link } from 'react-router-dom';
import { courseData as d } from '../../content';
import { useProgress, useStore } from '../../app/state';
import { PageTitle } from '../components/Common';

const PAPER: [string, string][] = [
  ['claim', 'I can state the central claim in one sentence, and what would falsify it.'],
  ['system', 'I know the system, size (qubits / spins / shots) and regime studied.'],
  ['evidence', 'I have matched each claim to a figure, table or derivation that supports it.'],
  ['baseline', 'I know which classical or exact baseline is used, and whether it is tuned fairly.'],
  ['assump', 'I have listed assumptions: noise model, access model (oracle / data loading), idealisations.'],
  ['errors', 'Error bars, number of shots / seeds, and statistics are reported and sensible.'],
  ['scaling', 'Claims about scaling are separated from claims at the sizes actually run.'],
  ['hardware', 'I know whether results are simulated, emulated or from hardware, and what was mitigated.'],
  ['limits', 'I have noted limitations the authors state — and any they don\'t.'],
  ['cite', 'I verified the citation details (authors, venue, year) against the actual publication.'],
];
const REPRO: [string, string][] = [
  ['inputs', 'All inputs (Hamiltonian terms, circuit, parameters, units) are written down.'],
  ['seed', 'Random seeds are fixed and recorded.'],
  ['env', 'Software versions and the environment are recorded.'],
  ['baseline', 'An exact or classical baseline is computed on the same instance.'],
  ['tests', 'A unit test checks a case with a known analytic answer.'],
  ['tol', 'Numerical tolerances are justified (not just "close enough").'],
  ['plots', 'Plots can be regenerated from saved data by one command.'],
  ['crit', 'Success criteria were written before running the experiment.'],
  ['neg', 'Negative or inconclusive results are recorded as well.'],
];
const SCOPE: [string, string, string][] = [
  ['question', 'Research question', 'One sentence. What exactly will you find out?'],
  ['why', 'Why it matters', 'Which physics or computational question does it serve?'],
  ['have', 'Prerequisites I have', 'Modules and skills you can already use.'],
  ['need', 'Prerequisites I need', 'What you must learn first (link to course modules).'],
  ['method', 'Method and tools', 'Simulator, model, system size, software.'],
  ['baseline', 'Classical or exact baseline', 'What will you compare against?'],
  ['success', 'Success criteria', 'What result would count as success, partial success, or failure?'],
  ['plan', 'Milestones (8–12 weeks)', 'Week-by-week or fortnightly milestones.'],
  ['risks', 'Risks and fallbacks', 'What could go wrong and what you will do then.'],
  ['super', 'Questions for my supervisor', 'Topic fit, data, compute, expectations. Alignment must be validated with them.'],
];
const FEAS = ['Interest', 'Feasible in 8–12 weeks', 'Compute / data available', 'Supervisor fit (to be confirmed)'];
const PATHWAYS: [string, string, string[]][] = [
  ['Quantum dynamics and simulation', 'Hamiltonians, product formulas, exact baselines', ['D1', 'D2', 'D3', 'D4']],
  ['Open quantum systems', 'Noise channels, master equations, decoherence', ['B6', 'D5', 'D6']],
  ['Quantum information', 'Entanglement, channels, protocols', ['B4', 'B5', 'B7']],
  ['Variational methods', 'Parameterised circuits and optimisation', ['C6', 'E2']],
  ['Quantum machine learning and reservoir computing', 'Encodings, kernels, baselines', ['E3', 'E4']],
  ['Nuclear / subnuclear toy models', 'Effective Hamiltonians and what extra domain knowledge is needed', ['D7']],
];

export function ResearchPage() {
  const p = useProgress();
  const store = useStore();
  const r = p.research;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const ideas = p.notes.filter((n) => n.context === 'idea');
  const toggle = (k: 'paperChecklist' | 'reproChecklist', id: string) => store.setResearch((x) => ({ ...x, [k]: { ...x[k], [id]: !x[k][id] } }));
  const setWs = (k: string, v: string) => store.setResearch((x) => ({ ...x, worksheet: { ...x.worksheet, [k]: v } }));
  return (
    <div className="stack">
      <PageTitle sub="Tools for the move from guided exercises to reading papers, reproducing a modest result and scoping a project. Saved in this browser only.">Research transition</PageTitle>
      <div className="callout misc" role="note"><strong>Flexible pathway, not an endorsement.</strong> The pathways below show how this course's modules could connect to possible interests. They are not claims that any particular professor, lab or thesis project will supervise or endorse them. Validate topics with your eventual supervisor.</div>

      <section className="card" aria-labelledby="path-h">
        <h2 id="path-h" style={{ marginTop: 0 }}>Possible pathways</h2>
        <div className="table-wrap"><table><thead><tr><th scope="col">Interest</th><th scope="col">Focus</th><th scope="col">Course modules</th></tr></thead>
          <tbody>{PATHWAYS.map(([a, b, mods]) => <tr key={a}><td>{a}</td><td>{b}</td><td>{mods.map((m, i) => <span key={m}>{i > 0 && ', '}<Link to={`/module/${m}`}>{m}</Link> <span className="small muted">({d.modules.find((x) => x.id === m)?.availability === 'available' ? 'available' : 'preview'})</span></span>)}</td></tr>)}</tbody></table></div>
      </section>

      <div className="grid cols-2">
        <section className="card" aria-labelledby="pc-h">
          <h2 id="pc-h" style={{ marginTop: 0 }}>Paper-reading checklist</h2>
          {PAPER.map(([id, t]) => <label className="inline" key={id} style={{ display: 'flex', margin: '6px 0' }}><input type="checkbox" checked={!!r.paperChecklist[id]} onChange={() => toggle('paperChecklist', id)} /> {t}</label>)}
          <p className="small muted">{Object.values(r.paperChecklist).filter(Boolean).length}/{PAPER.length} ticked for the current paper. <button type="button" className="ghost small" onClick={() => store.setResearch((x) => ({ ...x, paperChecklist: {} }))}>Clear for next paper</button></p>
        </section>
        <section className="card" aria-labelledby="rc-h">
          <h2 id="rc-h" style={{ marginTop: 0 }}>Reproducibility checklist</h2>
          {REPRO.map(([id, t]) => <label className="inline" key={id} style={{ display: 'flex', margin: '6px 0' }}><input type="checkbox" checked={!!r.reproChecklist[id]} onChange={() => toggle('reproChecklist', id)} /> {t}</label>)}
          <p className="small muted">{Object.values(r.reproChecklist).filter(Boolean).length}/{REPRO.length} ticked. <button type="button" className="ghost small" onClick={() => store.setResearch((x) => ({ ...x, reproChecklist: {} }))}>Clear</button></p>
        </section>
      </div>

      <section className="card" aria-labelledby="idea-h">
        <h2 id="idea-h" style={{ marginTop: 0 }}>Idea notebook</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (!title.trim() && !body.trim()) return; store.addNote(title.trim() || 'Untitled idea', body, 'idea'); setTitle(''); setBody(''); }}>
          <label htmlFor="idea-t">Title</label><br /><input id="idea-t" type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
          <label htmlFor="idea-b">Idea, question or observation</label><textarea id="idea-b" value={body} onChange={(e) => setBody(e.target.value)} />
          <button type="submit" style={{ marginTop: 6 }} disabled={!title.trim() && !body.trim()}>Add to notebook</button>
        </form>
        {ideas.length === 0 ? <p className="muted">No ideas yet. Capture questions that arise while working through the labs — they are the raw material for a project.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>{ideas.map((n) => (
            <li key={n.id} className="card" style={{ margin: '8px 0' }}>
              <label htmlFor={`n-${n.id}`}><strong>{n.title}</strong></label> <span className="small muted">{new Date(n.updatedAt).toLocaleDateString()}</span>
              <textarea id={`n-${n.id}`} defaultValue={n.body} onBlur={(e) => e.target.value !== n.body && store.updateNote(n.id, { body: e.target.value })} />
              <button type="button" className="ghost small" onClick={() => store.deleteNote(n.id)}>Delete</button>
            </li>))}</ul>
        )}
      </section>

      <section className="card" aria-labelledby="ws-h">
        <h2 id="ws-h" style={{ marginTop: 0 }}>Project-scope worksheet (8–12 week mini-project)</h2>
        <p className="muted">Fill in what you can; each box saves when you leave it.</p>
        {SCOPE.map(([k, label, hint]) => (
          <div key={k} style={{ margin: '10px 0' }}>
            <label htmlFor={`ws-${k}`}>{label}</label> <span className="small muted">{hint}</span>
            <textarea id={`ws-${k}`} defaultValue={r.worksheet[k] ?? ''} onBlur={(e) => e.target.value !== (r.worksheet[k] ?? '') && setWs(k, e.target.value)} />
          </div>
        ))}
        <fieldset><legend>Feasibility matrix (your own 1–5 ratings; 5 = best)</legend>
          <div className="row">{FEAS.map((f, i) => (
            <span key={f} className="row"><label htmlFor={`feas-${i}`}>{f}</label>
              <select id={`feas-${i}`} value={r.worksheet[`feas${i}`] ?? ''} onChange={(e) => setWs(`feas${i}`, e.target.value)}><option value="">–</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n}</option>)}</select></span>
          ))}</div>
        </fieldset>
      </section>
    </div>
  );
}
