import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { MasteryLevel } from '../../domain/progress/schema';
import type { PrereqStatus } from '../../domain/progress/mastery';
import type { LessonStatus } from '../../domain/progress/schema';
import type { ModuleStatus } from '../../domain/progress/selectors';

export const LEVEL_TEXT: Record<MasteryLevel, string> = { none: 'No evidence yet', developing: 'Developing', practiced: 'Practiced', secure: 'Secure' };
export const LEVEL_ICON: Record<MasteryLevel, string> = { none: '○', developing: '◔', practiced: '◑', secure: '●' };
export function LevelPill({ level }: { level: MasteryLevel }) {
  return <span className={`pill ${level === 'secure' ? 'ok' : level === 'practiced' ? 'info' : level === 'developing' ? 'warn' : ''}`}><span aria-hidden="true">{LEVEL_ICON[level]} </span>{LEVEL_TEXT[level]}</span>;
}
export const PREREQ_TEXT: Record<PrereqStatus, string> = { met: 'Met', partial: 'Partly met', unmet: 'No evidence yet', unavailable: 'Not yet written (preview)' };
export const PREREQ_ICON: Record<PrereqStatus, string> = { met: '✓', partial: '◐', unmet: '○', unavailable: '–' };
export function PrereqPill({ status }: { status: PrereqStatus }) {
  return <span className={`pill ${status === 'met' ? 'ok' : status === 'partial' ? 'warn' : status === 'unmet' ? 'bad' : ''}`}><span aria-hidden="true">{PREREQ_ICON[status]} </span>{PREREQ_TEXT[status]}</span>;
}
export function LessonStatusPill({ status }: { status: LessonStatus }) {
  const t = status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In progress' : 'Not started';
  return <span className={`pill ${status === 'completed' ? 'ok' : status === 'in-progress' ? 'warn' : ''}`}><span aria-hidden="true">{status === 'completed' ? '✓ ' : status === 'in-progress' ? '… ' : ''}</span>{t}</span>;
}
export function ModuleStatusPill({ status, labOnly }: { status: ModuleStatus; labOnly?: boolean }) {
  if (status === 'preview') return <span className="pill">Preview — {labOnly ? 'lab only' : 'planned'}</span>;
  const t = status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In progress' : 'Available';
  return <span className={`pill ${status === 'completed' ? 'ok' : status === 'in-progress' ? 'warn' : 'info'}`}>{t}</span>;
}
export function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return <div className="meter" role="img" aria-label={`${label}: ${pct} percent`}><span style={{ width: `${pct}%` }} /></div>;
}
export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return <div><h1 tabIndex={-1} id="page-title">{children}</h1>{sub && <p className="muted">{sub}</p>}</div>;
}
export function Crumbs({ items }: { items: { to?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="small muted">
      {items.map((it, i) => <span key={i}>{it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}{i < items.length - 1 ? ' › ' : ''}</span>)}
    </nav>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="card" role="status"><h3>{title}</h3>{children}</div>;
}
export function ErrorNote({ children }: { children: ReactNode }) {
  return <div className="callout bad" role="alert">{children}</div>;
}
