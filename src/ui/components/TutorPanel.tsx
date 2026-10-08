import { useMemo, useRef, useState } from 'react';
import { courseData as d } from '../../content';
import { useProgress, useSession, useStore, type TutorMessage } from '../../app/state';
import type { TutorAction, TutorMode, TutorRequest, PrereqNote } from '../../domain/tutor/types';
import { prerequisiteReport } from '../../domain/progress/selectors';
import { Markdown } from './Markdown';

const MODES: { id: TutorMode; label: string; help: string }[] = [
  { id: 'tutor-me', label: 'Tutor me', help: 'Cue first, then hints, then a scaffolded solution. One question at a time.' },
  { id: 'check-reasoning', label: 'Check my reasoning', help: 'Paste your steps; I look for known pitfalls and the step that fails.' },
  { id: 'explain-directly', label: 'Explain directly', help: 'Straight explanation and worked steps, no Socratic detour.' },
  { id: 'exam-practice', label: 'Exam practice', help: 'No hints or solutions until you have submitted an attempt.' },
];

export function TutorPanel({ scope, lessonId, activityIds = [], moduleId, initialOpen = true }: { scope: string; lessonId?: string; activityIds?: string[]; moduleId?: string; initialOpen?: boolean }) {
  const prog = useProgress();
  const store = useStore();
  const session = useSession();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(initialOpen);
  const logRef = useRef<HTMLDivElement>(null);
  const mode = prog.preferences.tutorMode;
  const focusId = session.focus[scope] ?? null;
  const activity = focusId ? d.activities.find((a) => a.id === focusId) : undefined;
  const msgs = session.messages[scope] ?? [];
  const provider = session.provider;

  const weak: PrereqNote[] = useMemo(() => {
    const mid = moduleId ?? (lessonId ? d.lessons.find((l) => l.id === lessonId)?.moduleId : undefined);
    const m = d.modules.find((x) => x.id === mid);
    if (!m) return [];
    return prerequisiteReport(d, m, prog).filter((r) => r.status === 'unmet' || r.status === 'partial').slice(0, 2).map((r) => ({ moduleId: r.module.id, title: r.module.title, mastery: r.mastery, lessonId: r.suggestion?.lessonId }));
  }, [moduleId, lessonId, prog]);

  async function send(action: TutorAction, userText: string, label?: string) {
    if (busy) return;
    const req: TutorRequest = {
      action, mode, text: userText, lessonId, activity,
      attempted: !!activity && (prog.activities[activity.id]?.attempts.length ?? 0) > 0,
      lastResult: activity ? session.lastResults[activity.id] : undefined,
      hintLevel: activity ? (session.hintLevels[activity.id] ?? 0) : 0,
      solutionRequests: activity ? (session.solutionRequests[activity.id] ?? 0) : 0,
      weakPrerequisites: weak,
    };
    session.addMessage(scope, { role: 'user', text: label ?? (userText || ACTION_LABEL[action]) });
    setBusy(true);
    try {
      const reply = await provider.respond(req);
      if (activity && reply.hintLevel) session.setHintLevel(activity.id, reply.hintLevel);
      if (activity && action === 'solution') session.bumpSolutionRequests(activity.id);
      session.addMessage(scope, { role: 'tutor', text: reply.message, reply });
      session.announce('The tutor replied.');
    } catch {
      session.addMessage(scope, { role: 'tutor', text: 'Something went wrong while generating a reply. Nothing was lost; please try again.' });
    } finally {
      setBusy(false);
      setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }), 0);
    }
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    send(mode === 'check-reasoning' && activity ? 'check' : 'ask', t);
  };

  return (
    <section className="tutor" aria-labelledby={`tutor-h-${scope}`}>
      <div className="head">
        <div className="row between">
          <h2 id={`tutor-h-${scope}`} style={{ margin: 0, fontSize: '1.1rem' }}>Tutor</h2>
          <button type="button" className="ghost small" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`tutor-body-${scope}`}>{open ? 'Collapse' : 'Open tutor'}</button>
        </div>
        <p className="small" style={{ margin: '4px 0 0' }}>
          <span className={`pill ${provider.info.kind === 'local-scripted' ? '' : 'warn'}`}>{provider.info.label}</span>
        </p>
      </div>
      <div id={`tutor-body-${scope}`} hidden={!open}>
        <div className="head">
          <label htmlFor={`mode-${scope}`} className="small">Mode</label>{' '}
          <select id={`mode-${scope}`} value={mode} onChange={(e) => store.setPreferences({ tutorMode: e.target.value as TutorMode })}>
            {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <p className="small muted" style={{ margin: '4px 0' }}>{MODES.find((m) => m.id === mode)!.help}</p>
          {activityIds.length > 0 && (
            <div>
              <label htmlFor={`focus-${scope}`} className="small">Focus</label>{' '}
              <select id={`focus-${scope}`} value={focusId ?? ''} onChange={(e) => session.setFocus(scope, e.target.value || null)}>
                <option value="">Whole lesson (concept questions)</option>
                {activityIds.map((id) => { const a = d.activities.find((x) => x.id === id)!; return <option key={id} value={id}>{a.role === 'checkpoint' ? 'Checkpoint' : a.role === 'exit' ? 'Exit check' : 'Practice'}: {id}</option>; })}
              </select>
            </div>
          )}
        </div>
        <div className="log" ref={logRef} role="log" aria-live="polite" aria-label="Tutor conversation" tabIndex={0}>
          {msgs.length === 0 && <p className="muted small">Ask a question in your own words, or use a button below. The more you tell me about what you tried, the more specific I can be. {provider.disclosure}</p>}
          {msgs.map((m) => <Message key={m.id} m={m} />)}
          {busy && <p className="muted small">Thinking…</p>}
        </div>
        <div className="actions" role="group" aria-label="Tutor shortcuts">
          <button type="button" className="secondary small" disabled={!activity || busy} onClick={() => send('hint', '')}>Hint</button>
          <button type="button" className="secondary small" disabled={!activity || busy} onClick={() => send('stuck', '')}>I'm stuck</button>
          <button type="button" className="secondary small" disabled={!activity || busy} onClick={() => send('solution', '')}>Worked solution</button>
          <button type="button" className="secondary small" disabled={busy} onClick={() => send('next', '')}>Quiz me</button>
          <button type="button" className="ghost small" disabled={msgs.length === 0} onClick={() => { session.clearMessages(scope); session.announce('Conversation cleared.'); }}>Clear conversation</button>
        </div>
        {!activity && activityIds.length > 0 && <p className="small muted" style={{ padding: '0 12px' }}>Choose a focus item above (or use "Ask the tutor about this item") to enable hints and solutions.</p>}
        <form onSubmit={submit}>
          <label htmlFor={`ask-${scope}`} className="small">{mode === 'check-reasoning' ? 'Your reasoning (steps, not just the answer)' : 'Your question or what you tried'}</label>
          <textarea id={`ask-${scope}`} value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          <div className="row" style={{ marginTop: 6 }}>
            <button type="submit" disabled={busy || !text.trim()}>{mode === 'check-reasoning' ? 'Check my reasoning' : 'Ask'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

const ACTION_LABEL: Record<TutorAction, string> = { ask: 'Question', hint: 'Can I have a hint?', stuck: "I'm stuck.", solution: 'Please show the worked solution.', check: 'Please check my reasoning.', next: 'Quiz me with one question.' };
const TYPE_LABEL: Record<string, string> = { cue: 'conceptual cue', question: 'question', hint: 'hint', diagnosis: 'diagnosis', explanation: 'explanation', solution: 'solution', clarify: 'clarifying question', practice: 'practice', info: 'note' };

function Message({ m }: { m: TutorMessage }) {
  if (m.role === 'user') return <div className="msg user"><div className="meta">You</div><div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div></div>;
  const r = m.reply;
  if (!r) return <div className="msg tutor"><div className="meta">Tutor</div><p>{m.text}</p></div>;
  return (
    <div className="msg tutor">
      <div className="meta">
        <span>{r.provider.kind === 'local-scripted' ? 'Local scripted tutor' : 'Remote model (via your endpoint)'}</span>
        <span className="pill">{TYPE_LABEL[r.responseType] ?? r.responseType}</span>
        {r.hintLevel && <span className="pill">hint level {r.hintLevel}</span>}
        {r.confidence && <span className="pill">confidence: {r.confidence}</span>}
      </div>
      <Markdown text={r.message} />
      {r.diagnosis && !r.message.includes(r.diagnosis) && <div className="callout bad"><strong>Diagnosis:</strong> <Markdown text={r.diagnosis} inline /></div>}
      {r.solutionSteps && r.solutionSteps.length > 0 && <ol>{r.solutionSteps.map((s, i) => <li key={i}><Markdown text={s} inline /></li>)}</ol>}
      {r.nextQuestion && <div className="nextq"><strong>Your turn:</strong> <Markdown text={r.nextQuestion} inline /></div>}
      {r.conceptTags.length > 0 && <p className="small muted">Concepts: {r.conceptTags.join(', ')}</p>}
      {r.sourceRefs.length > 0 && <p className="small muted">Sources: {r.sourceRefs.join('; ')} — check against your edition.</p>}
      {r.notice && <p className="small"><em>{r.notice}</em></p>}
    </div>
  );
}
