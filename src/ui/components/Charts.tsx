import type { Bloch } from '../../domain/quantum';

export function BarRows({ rows, caption }: { rows: { label: string; value: number }[]; caption: string }) {
  return (
    <div role="group" aria-label={caption}>
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className="meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(1, r.value)) * 100}%` }} /></div>
          <span>{r.value.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Bloch sphere (orthographic projection, numbers always shown beside it) ---------------- */
type V3 = [number, number, number];
function project([x, y, z]: V3, az: number, el: number) {
  const xr = x * Math.cos(az) - y * Math.sin(az);
  const yr = x * Math.sin(az) + y * Math.cos(az);
  return { sx: xr, sy: z * Math.cos(el) + yr * Math.sin(el), depth: yr * Math.cos(el) - z * Math.sin(el) };
}
export function BlochSphere({ bloch, azimuthDeg = 30, size = 280, label }: { bloch: Bloch; azimuthDeg?: number; size?: number; label: string }) {
  const R = size * 0.38, cx = size / 2, cy = size / 2;
  const az = (azimuthDeg * Math.PI) / 180, el = (20 * Math.PI) / 180;
  const P = (v: V3) => { const p = project(v, az, el); return { x: cx + R * p.sx, y: cy - R * p.sy, d: p.depth }; };
  const circle = (f: (t: number) => V3) => {
    let front = '', back = '';
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const p = P(f((i / N) * 2 * Math.PI));
      const seg = `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
      if (p.d <= 0) front += seg; else back += seg;
    }
    return { front, back };
  };
  const eq = circle((t) => [Math.cos(t), Math.sin(t), 0]);
  const mx = circle((t) => [Math.cos(t), 0, Math.sin(t)]);
  const my = circle((t) => [0, Math.cos(t), Math.sin(t)]);
  const axes: { v: V3; text: string }[] = [
    { v: [1.18, 0, 0], text: 'x' }, { v: [0, 1.18, 0], text: 'y' }, { v: [0, 0, 1.2], text: 'z (|0⟩)' }, { v: [0, 0, -1.22], text: '−z (|1⟩)' },
  ];
  const o = P([0, 0, 0]);
  const tip = P([bloch.x, bloch.y, bloch.z]);
  const foot = P([bloch.x, bloch.y, 0]);
  const len = Math.hypot(bloch.x, bloch.y, bloch.z);
  const desc = `Bloch sphere. Vector (x, y, z) = (${bloch.x.toFixed(3)}, ${bloch.y.toFixed(3)}, ${bloch.z.toFixed(3)}), length ${len.toFixed(3)}. ${label}`;
  return (
    <svg className="bloch" viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={desc}>
      <title>{desc}</title>
      <circle cx={cx} cy={cy} r={R} className="outline" strokeWidth="1.5" />
      {[eq, mx, my].map((c, i) => (<g key={i}><polyline points={c.back} className="outline back" strokeWidth="1" /><polyline points={c.front} className="outline" strokeWidth="1" /></g>))}
      {axes.map((a) => { const p = P(a.v); return (<g key={a.text}><line x1={o.x} y1={o.y} x2={p.x} y2={p.y} stroke="var(--muted)" strokeWidth="1" strokeDasharray={p.d > 0 ? '2 3' : undefined} /><text x={p.x + 4} y={p.y - 4}>{a.text}</text></g>); })}
      <line x1={o.x} y1={o.y} x2={foot.x} y2={foot.y} stroke="var(--c3)" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1={foot.x} y1={foot.y} x2={tip.x} y2={tip.y} stroke="var(--c3)" strokeWidth="1" strokeDasharray="1 3" />
      <line x1={o.x} y1={o.y} x2={tip.x} y2={tip.y} stroke="var(--c2)" strokeWidth="3" />
      <rect x={tip.x - 5} y={tip.y - 5} width="10" height="10" fill="var(--c2)" stroke="var(--text)" transform={`rotate(45 ${tip.x} ${tip.y})`} />
    </svg>
  );
}

/* ---------------- Line chart (colour + dash + marker so it never relies on colour alone) ---------------- */
export type Series = { name: string; points: [number, number][]; color?: string; dash?: string; marker?: 'circle' | 'square' | 'triangle' | 'none' };
const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)'];
const DASHES = [undefined, '6 4', '2 3', '10 3 2 3'];
const MARKS: Series['marker'][] = ['circle', 'square', 'triangle', 'none'];

export function LineChart({ series, xLabel, yLabel, xDomain, yDomain, logX = false, logY = false, width = 560, height = 300, title }: { series: Series[]; xLabel: string; yLabel: string; xDomain?: [number, number]; yDomain?: [number, number]; logX?: boolean; logY?: boolean; width?: number; height?: number; title: string }) {
  const m = { l: 52, r: 14, t: 12, b: 42 };
  const W = width - m.l - m.r, H = height - m.t - m.b;
  const all = series.flatMap((s) => s.points).filter(([x, y]) => (!logX || x > 0) && (!logY || y > 0));
  const tx = (v: number) => (logX ? Math.log10(v) : v), ty = (v: number) => (logY ? Math.log10(v) : v);
  const xs = all.map((p) => tx(p[0])), ys = all.map((p) => ty(p[1]));
  const [x0, x1] = xDomain ? [tx(xDomain[0]), tx(xDomain[1])] : [Math.min(...xs, 0), Math.max(...xs, 1)];
  let [y0, y1] = yDomain ? [ty(yDomain[0]), ty(yDomain[1])] : [Math.min(...ys), Math.max(...ys)];
  if (!Number.isFinite(y0) || !Number.isFinite(y1)) { y0 = 0; y1 = 1; }
  if (y1 - y0 < 1e-9) { y0 -= 0.5; y1 += 0.5; }
  const X = (v: number) => m.l + ((tx(v) - x0) / (x1 - x0 || 1)) * W;
  const Y = (v: number) => m.t + H - ((ty(v) - y0) / (y1 - y0)) * H;
  const ticks = (a: number, b: number) => Array.from({ length: 5 }, (_, i) => a + ((b - a) * i) / 4);
  const fmtT = (v: number, log: boolean) => (log ? `1e${Math.round(v)}` : Math.abs(v) >= 100 || (Math.abs(v) < 0.01 && v !== 0) ? v.toExponential(0) : +v.toFixed(2) + '');
  const marker = (mk: Series['marker'], x: number, y: number, c: string, i: number) => {
    if (mk === 'square') return <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill={c} />;
    if (mk === 'triangle') return <polygon key={i} points={`${x},${y - 4} ${x - 4},${y + 3} ${x + 4},${y + 3}`} fill={c} />;
    if (mk === 'circle') return <circle key={i} cx={x} cy={y} r="3" fill={c} />;
    return null;
  };
  return (
    <figure style={{ margin: '8px 0' }}>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width }} role="img" aria-label={title}>
        <title>{title}</title>
        <g className="grid">{ticks(y0, y1).map((t, i) => <line key={i} x1={m.l} x2={m.l + W} y1={m.t + H - ((t - y0) / (y1 - y0)) * H} y2={m.t + H - ((t - y0) / (y1 - y0)) * H} />)}</g>
        <line className="axis" x1={m.l} y1={m.t + H} x2={m.l + W} y2={m.t + H} /><line className="axis" x1={m.l} y1={m.t} x2={m.l} y2={m.t + H} />
        {ticks(y0, y1).map((t, i) => <text key={i} x={m.l - 6} y={m.t + H - ((t - y0) / (y1 - y0)) * H + 4} textAnchor="end">{fmtT(t, logY)}</text>)}
        {ticks(x0, x1).map((t, i) => <text key={i} x={m.l + ((t - x0) / (x1 - x0 || 1)) * W} y={m.t + H + 16} textAnchor="middle">{fmtT(t, logX)}</text>)}
        <text x={m.l + W / 2} y={height - 6} textAnchor="middle">{xLabel}</text>
        <text transform={`translate(12 ${m.t + H / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
        {series.map((s, si) => {
          const c = s.color ?? COLORS[si % 4];
          const pts = s.points.filter(([x, y]) => (!logX || x > 0) && (!logY || y > 0));
          return (
            <g key={s.name}>
              <polyline fill="none" stroke={c} strokeWidth="2" strokeDasharray={s.dash ?? DASHES[si % 4]} points={pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ')} />
              {(s.marker ?? MARKS[si % 4]) !== 'none' && pts.length <= 40 && pts.map(([x, y], i) => marker(s.marker ?? MARKS[si % 4], X(x), Y(y), c, i))}
            </g>
          );
        })}
      </svg>
      <figcaption className="legend" aria-hidden="true">
        {series.map((s, si) => (
          <span key={s.name}><svg width="30" height="10" aria-hidden="true"><line x1="0" y1="5" x2="30" y2="5" stroke={s.color ?? COLORS[si % 4]} strokeWidth="2" strokeDasharray={s.dash ?? DASHES[si % 4]} /></svg> {s.name}</span>
        ))}
      </figcaption>
    </figure>
  );
}
