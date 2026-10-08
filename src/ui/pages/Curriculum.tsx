import { Link, useSearchParams } from 'react-router-dom';
import { courseData as d } from '../../content';
import { useProgress } from '../../app/state';
import { moduleStatus, prerequisiteReport } from '../../domain/progress/selectors';
import { moduleMastery } from '../../domain/progress/mastery';
import { depths, topologicalOrder } from '../../domain/curriculum/graph';
import { PageTitle, ModuleStatusPill, PrereqPill, Meter } from '../components/Common';

export function Curriculum() {
  const p = useProgress();
  const [sp, setSp] = useSearchParams();
  const track = sp.get('track') ?? 'all';
  const view = sp.get('view') ?? 'list';
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); n.set(k, v); setSp(n, { replace: true }); };
  const mods = d.modules.filter((m) => track === 'all' || m.trackId === track);
  return (
    <div className="stack">
      <PageTitle sub="Follow the recommended sequence or browse freely. Missing prerequisites are flagged, never enforced.">Curriculum explorer</PageTitle>
      <div className="row" role="group" aria-label="Track filter">
        {['all', ...d.tracks.map((t) => t.id)].map((t) => <button key={t} type="button" className={track === t ? '' : 'secondary'} aria-pressed={track === t} onClick={() => set('track', t)}>{t === 'all' ? 'All tracks' : `Track ${t}`}</button>)}
        <span style={{ flex: 1 }} />
        <div role="group" aria-label="View">
          <button type="button" className={view === 'list' ? '' : 'secondary'} aria-pressed={view === 'list'} onClick={() => set('view', 'list')}>Module cards</button>{' '}
          <button type="button" className={view === 'graph' ? '' : 'secondary'} aria-pressed={view === 'graph'} onClick={() => set('view', 'graph')}>Prerequisite graph</button>
        </div>
      </div>
      {track !== 'all' && <p className="muted">{d.tracks.find((t) => t.id === track)?.description}</p>}
      {view === 'graph' ? <Graph track={track} /> : (
        <div className="grid cols-2">
          {mods.map((m) => {
            const rep = prerequisiteReport(d, m, p);
            const st = moduleStatus(m, p);
            return (
              <article className="card" key={m.id} aria-labelledby={`m-${m.id}`}>
                <div className="row between"><h2 id={`m-${m.id}`} style={{ margin: 0, fontSize: '1.15rem' }}><Link to={`/module/${m.id}`}>{m.id} · {m.title}</Link></h2><ModuleStatusPill status={st} labOnly={m.labIds.length > 0 && m.lessonIds.length === 0} /></div>
                <p>{m.summary}</p>
                <p className="small muted">{m.level} · about {m.estimatedMinutes} min · {m.objectives.length} objectives{m.lessonIds.length ? ` · ${m.lessonIds.length} lesson${m.lessonIds.length > 1 ? 's' : ''}` : ''}{m.labIds.length ? ` · ${m.labIds.length} lab` : ''}</p>
                {m.lessonIds.length > 0 && <><Meter value={moduleMastery(m, p.objectives)} label={`${m.id} mastery estimate`} /><p className="small muted">Mastery estimate {Math.round(moduleMastery(m, p.objectives) * 100)}%</p></>}
                {rep.length > 0 ? (
                  <div><strong className="small">Prerequisites:</strong>
                    <ul className="small" style={{ margin: '4px 0' }}>{rep.map((r) => <li key={r.module.id}><Link to={`/module/${r.module.id}`}>{r.module.id}</Link> <PrereqPill status={r.status} /></li>)}</ul></div>
                ) : <p className="small muted">No prerequisites.</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Graph({ track }: { track: string }) {
  const p = useProgress();
  const dp = depths(d.modules);
  const order = topologicalOrder(d.modules);
  const cols = Math.max(...Object.values(dp)) + 1;
  const byCol: string[][] = Array.from({ length: cols }, () => []);
  for (const id of [...d.modules].sort((a, b) => a.trackId.localeCompare(b.trackId) || order.indexOf(a.id) - order.indexOf(b.id)).map((m) => m.id)) byCol[dp[id]].push(id);
  const NW = 112, NH = 34, GX = 54, GY = 14;
  const pos: Record<string, { x: number; y: number }> = {};
  byCol.forEach((ids, c) => ids.forEach((id, r) => { pos[id] = { x: 12 + c * (NW + GX), y: 12 + r * (NH + GY) }; }));
  const W = 24 + cols * (NW + GX), H = 24 + Math.max(...byCol.map((c) => c.length)) * (NH + GY);
  const shown = (id: string) => track === 'all' || d.modules.find((m) => m.id === id)!.trackId === track;
  return (
    <div>
      <p className="muted small">Arrows point from a prerequisite to the module that builds on it. Solid boxes are available modules; dashed boxes are planned previews. Each box shows its track letter and, for available modules, a status. The list below gives the same information as text.</p>
      <div className="graph-wrap">
        <svg width={W} height={H} role="group" aria-label="Prerequisite graph of all modules">
          <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" /></marker></defs>
          {d.modules.flatMap((m) => m.prerequisiteModuleIds.map((pr) => {
            const a = pos[pr], b = pos[m.id];
            const dim = !(shown(pr) && shown(m.id));
            return <path key={`${pr}-${m.id}`} d={`M${a.x + NW},${a.y + NH / 2} C${a.x + NW + GX / 2},${a.y + NH / 2} ${b.x - GX / 2},${b.y + NH / 2} ${b.x},${b.y + NH / 2}`} fill="none" stroke="var(--muted)" strokeWidth="1.2" opacity={dim ? 0.15 : 0.8} markerEnd="url(#arr)" />;
          }))}
          {d.modules.map((m) => {
            const st = moduleStatus(m, p);
            const { x, y } = pos[m.id];
            return (
              <Link key={m.id} to={`/module/${m.id}`} aria-label={`${m.id} ${m.title}. ${st === 'preview' ? 'Planned preview' : st}.`}>
                <g opacity={shown(m.id) ? 1 : 0.25}>
                  <rect x={x} y={y} width={NW} height={NH} rx="7" fill={st === 'completed' ? 'var(--ok-soft)' : st === 'in-progress' ? 'var(--warn-soft)' : 'var(--surface)'} stroke={st === 'preview' ? 'var(--muted)' : 'var(--accent)'} strokeWidth={st === 'preview' ? 1.2 : 2.2} strokeDasharray={st === 'preview' ? '4 3' : undefined} />
                  <text x={x + 8} y={y + 15} fontWeight="700">{m.id}</text>
                  <text x={x + 8} y={y + 28} fontSize="10">{m.title.length > 17 ? m.title.slice(0, 16) + '…' : m.title}</text>
                  {st === 'completed' && <text x={x + NW - 16} y={y + 15}>✓</text>}
                </g>
              </Link>
            );
          })}
        </svg>
      </div>
      <details className="opt"><summary>Prerequisites as text</summary>
        <ul>{d.modules.filter((m) => shown(m.id)).map((m) => <li key={m.id}><strong>{m.id}</strong> {m.title}: {m.prerequisiteModuleIds.length ? m.prerequisiteModuleIds.join(', ') : 'none'}</li>)}</ul></details>
    </div>
  );
}
