import type { ReactNode } from 'react';
import { fmt, type Mat } from '../../domain/quantum';

export type SaveFn = (label: string, params: Record<string, string | number>, summary: string) => void;

export function Slider({ id, label, value, min, max, step = 1, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="stack" style={{ margin: '8px 0' }}>
      <div className="row between">
        <label htmlFor={id}>{label}</label>
        <span className="row">
          <input type="number" aria-label={`${label} value`} value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step} style={{ width: '6.5rem' }} onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v))); }} />
          {unit && <span className="muted">{unit}</span>}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={`${value}${unit ? ' ' + unit : ''}`} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export function MatrixView({ m, label, digits = 3 }: { m: Mat; label: string; digits?: number }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'inline-block', margin: '4px 8px 4px 0' }}>
      <div className="small muted">{label}</div>
      <div className="matrix" style={{ gridTemplateColumns: `repeat(${m[0].length}, auto)` }}>
        {m.flatMap((r, i) => r.map((x, j) => <span key={`${i}-${j}`}>{fmt(x, digits)}</span>))}
      </div>
    </div>
  );
}

export function Stat({ k, v }: { k: string; v: ReactNode }) { return <span className="stat"><span className="muted small">{k}</span> <strong>{v}</strong></span>; }

export function SaveRun({ onSave, label, params, summary }: { onSave: SaveFn; label: string; params: Record<string, string | number>; summary: string }) {
  return <button type="button" className="secondary" onClick={() => onSave(label, params, summary)}>Save this run to my lab record</button>;
}
