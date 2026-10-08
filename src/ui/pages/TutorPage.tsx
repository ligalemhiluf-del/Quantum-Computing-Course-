import { courseData as d } from '../../content';
import { useSession } from '../../app/state';
import { TutorPanel } from '../components/TutorPanel';
import { PageTitle } from '../components/Common';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export function TutorPage() {
  const session = useSession();
  const [lessonId, setLessonId] = useState('');
  const info = session.provider.info;
  return (
    <div className="stack">
      <PageTitle sub="Ask about any concept in the course, in your own words. Say what you already tried — the tutor asks before it answers.">Ask the tutor</PageTitle>
      <div className="callout" role="note">
        <strong>Who is answering?</strong> {info.kind === 'local-scripted'
          ? <>A <strong>local scripted tutor</strong>: deterministic rules and authored hints, misconception patterns and explanations that run in your browser. It is <em>not</em> an AI model, it cannot verify free-form derivations, and it only knows the topics listed below. Nothing you type leaves your device.</>
          : <>A <strong>remote model behind your own server endpoint</strong> (configured in <Link to="/settings">Settings</Link>). Replies are validated against a safe schema and fall back to the local tutor on any problem. Such replies are unverified; check them against a textbook.</>}
      </div>
      <div className="lesson-layout">
        <div className="stack">
          <div className="card">
            <label htmlFor="ctx">Optional context: which lesson are you working on?</label>{' '}
            <select id="ctx" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="">No specific lesson</option>
              {d.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            <p className="small muted">Choosing a lesson lets the tutor focus on its items and mention weak prerequisites. Only the lesson, the item, your text, your hint level and your selected mode are used.</p>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Topics with authored help</h2>
            <ul className="row" style={{ listStyle: 'none', padding: 0 }}>{d.tutorConcepts.map((c) => <li key={c.tag}><span className="pill info">{c.title}</span></li>)}</ul>
            <p className="small muted">Examples to try: "why can't entanglement be used to send messages?", "I think global phase is observable", "how do I take a partial trace?"</p>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Modes</h2>
            <ul>
              <li><strong>Tutor me</strong> (default): conceptual cue → specific hint → scaffolded steps → solution when requested or still stuck.</li>
              <li><strong>Check my reasoning</strong>: paste your steps; the tutor flags known pitfalls (and says plainly when it can't verify).</li>
              <li><strong>Explain directly</strong>: a straight explanation with worked steps.</li>
              <li><strong>Exam practice</strong>: no hints or solutions until you've submitted an attempt.</li>
            </ul>
          </div>
        </div>
        <aside className="tutor-col"><TutorPanel key={lessonId} scope={lessonId ? `lesson-${lessonId}` : 'global'} lessonId={lessonId || undefined} activityIds={lessonId ? d.lessons.find((l) => l.id === lessonId)!.activityIds : []} /></aside>
      </div>
    </div>
  );
}
