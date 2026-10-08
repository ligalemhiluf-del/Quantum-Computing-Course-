import { useRef, useState } from 'react';
import { useProgress, useSession, useStore } from '../../app/state';
import { PageTitle } from '../components/Common';
import { buildRemotePayload, isSafeEndpoint } from '../../domain/tutor/remote';
import type { TutorMode } from '../../domain/tutor/types';
import { SCHEMA_VERSION } from '../../domain/progress/schema';

const MODES: [TutorMode, string][] = [['tutor-me', 'Tutor me (default)'], ['check-reasoning', 'Check my reasoning'], ['explain-directly', 'Explain directly'], ['exam-practice', 'Exam practice']];

export function SettingsPage() {
  const p = useProgress();
  const store = useStore();
  const session = useSession();
  const pref = p.preferences;
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<'none' | 'reset' | 'resetall'>('none');
  const file = useRef<HTMLInputElement>(null);
  const rt = pref.remoteTutor;
  const endpointOk = isSafeEndpoint(rt.endpoint);
  const sample = buildRemotePayload({ action: 'ask', mode: pref.tutorMode, text: 'Why is global phase unobservable?', lessonId: 'b1-qubits-bloch', attempted: false, hintLevel: 0, solutionRequests: 0, weakPrerequisites: [{ moduleId: 'A1', title: 'Complex vector spaces', mastery: 0.2 }] });

  function exportData() {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-tutor-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: 'Exported. The file contains your attempts, notes, lab runs and preferences (schema version ' + SCHEMA_VERSION + ').' });
  }
  async function importData(f: File | undefined) {
    if (!f) return;
    if (f.size > 5_000_000) { setMsg({ ok: false, text: 'That file is larger than 5 MB; it is not a progress export.' }); return; }
    const res = store.importJSON(await f.text());
    setMsg(res.ok ? { ok: true, text: `Imported successfully.${res.warnings.length ? ' Notes: ' + res.warnings.join(' ') : ''}` } : { ok: false, text: 'Import rejected, nothing was changed: ' + res.errors.join(' ') });
    if (file.current) file.current.value = '';
  }

  return (
    <div className="stack">
      <PageTitle sub="Everything is stored in this browser. Nothing is sent anywhere unless you explicitly configure a remote tutor endpoint.">Settings</PageTitle>

      <section className="card" aria-labelledby="tut-h">
        <h2 id="tut-h" style={{ marginTop: 0 }}>Tutor</h2>
        <fieldset><legend>Default tutor mode</legend>
          {MODES.map(([id, label]) => <label className="inline" key={id} style={{ display: 'flex', margin: '4px 0' }}><input type="radio" name="mode" checked={pref.tutorMode === id} onChange={() => store.setPreferences({ tutorMode: id })} /> {label}</label>)}
        </fieldset>
        <h3>Provider and disclosure</h3>
        <p><strong>Active provider:</strong> {session.provider.info.label}.</p>
        <p>{session.provider.disclosure}</p>
        <details className="opt"><summary>Remote tutor (advanced, optional, off by default)</summary>
          <div className="callout misc"><strong>Honest status:</strong> this app ships an <em>adapter seam</em> only. No model server is included or verified here. If you run your own server-side proxy that returns <code>{'{ "response": { message, responseType, conceptTags, sourceRefs, … } }'}</code>, replies are validated against a strict schema and fall back to the local tutor on any failure. API keys belong on that server — never in this browser app.</div>
          <label className="inline" style={{ display: 'flex', margin: '6px 0' }}><input type="checkbox" checked={rt.enabled} onChange={(e) => store.setPreferences({ remoteTutor: { ...rt, enabled: e.target.checked } })} /> Enable the remote tutor adapter</label>
          <label htmlFor="ep">Endpoint URL (https, or http on localhost)</label><br />
          <input id="ep" type="url" value={rt.endpoint} placeholder="https://your-server.example/tutor" style={{ width: '100%' }} onChange={(e) => store.setPreferences({ remoteTutor: { ...rt, endpoint: e.target.value } })} aria-invalid={rt.endpoint !== '' && !endpointOk} />
          {rt.endpoint !== '' && !endpointOk && <p role="alert" className="small" style={{ color: 'var(--bad)' }}>Not accepted: use https:// (or http://localhost).</p>}
          <label className="inline" style={{ display: 'flex', margin: '6px 0' }}><input type="checkbox" checked={rt.consent} onChange={(e) => store.setPreferences({ remoteTutor: { ...rt, consent: e.target.checked } })} /> I understand that, when enabled, my tutor questions and the current item's text are sent to the endpoint above.</label>
          <p className="small">Status: {rt.enabled && rt.consent && endpointOk ? <strong>active</strong> : 'inactive (needs enabled + consent + valid endpoint)'}.</p>
          <p className="small">Exactly what one request would contain (an example):</p>
          <pre className="code">{JSON.stringify(sample, null, 2)}</pre>
          <p className="small muted">Never included: notes, saved runs, progress history, preferences, identifiers, or your code-cell contents.</p>
        </details>
      </section>

      <section className="card" aria-labelledby="disp-h">
        <h2 id="disp-h" style={{ marginTop: 0 }}>Display</h2>
        <div className="row">
          <label htmlFor="ts">Text size</label>
          <select id="ts" value={pref.textSize} onChange={(e) => store.setPreferences({ textSize: e.target.value as typeof pref.textSize })}><option value="sm">Small</option><option value="md">Medium (default)</option><option value="lg">Large</option><option value="xl">Extra large</option></select>
          <label htmlFor="th">Theme</label>
          <select id="th" value={pref.theme} onChange={(e) => store.setPreferences({ theme: e.target.value as typeof pref.theme })}><option value="system">Follow system</option><option value="light">Light</option><option value="dark">Dark</option></select>
          <label htmlFor="rm">Motion</label>
          <select id="rm" value={pref.reducedMotion} onChange={(e) => store.setPreferences({ reducedMotion: e.target.value as typeof pref.reducedMotion })}><option value="system">Follow system setting</option><option value="on">Always reduce motion</option></select>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <label htmlFor="wk2">Weekly target (activity attempts per week, optional)</label>
          <input id="wk2" type="number" min={1} max={1000} value={pref.weeklyTarget ?? ''} placeholder="none" style={{ width: '6rem' }} onChange={(e) => store.setPreferences({ weeklyTarget: e.target.value === '' ? null : Math.max(1, Math.floor(+e.target.value || 1)) })} />
        </div>
      </section>

      <section className="card" aria-labelledby="data-h">
        <h2 id="data-h" style={{ marginTop: 0 }}>Your data</h2>
        <p>Stored locally under the key <code>qtutor.progress.v1</code> (schema version {SCHEMA_VERSION}). {store.storageError ? <strong>{store.storageError}</strong> : 'Browser storage is working.'}</p>
        <div className="row">
          <button type="button" onClick={exportData}>Export progress (JSON)</button>
          <label className="btn secondary" htmlFor="imp" style={{ fontWeight: 400 }}>Import progress…</label>
          <input id="imp" ref={file} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => importData(e.target.files?.[0])} />
        </div>
        {msg && <div className={`callout ${msg.ok ? 'ok' : 'bad'}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div>}
        <p className="small muted">Import validates the file (schema version, field types) before replacing anything; malformed files are rejected without changing your data. Mastery levels are recomputed from the imported attempts.</p>
        <h3>Reset</h3>
        {confirm === 'none' && <div className="row"><button type="button" className="ghost" onClick={() => setConfirm('reset')}>Reset learning data…</button><button type="button" className="ghost" onClick={() => setConfirm('resetall')}>Reset everything including preferences…</button></div>}
        {confirm !== 'none' && (
          <div className="callout bad" role="alertdialog" aria-labelledby="rc">
            <p id="rc"><strong>This permanently deletes {confirm === 'reset' ? 'your attempts, lesson and lab progress, notes and research worksheet' : 'all of that plus your preferences'} from this browser.</strong> Export first if you might want it back.</p>
            <div className="row"><button type="button" className="danger" onClick={() => { store.reset(confirm === 'resetall'); setConfirm('none'); setMsg({ ok: true, text: 'Data reset.' }); session.announce('Data reset.'); }}>Yes, delete</button><button type="button" className="ghost" onClick={() => setConfirm('none')}>Cancel</button></div>
          </div>
        )}
      </section>
    </div>
  );
}
