import { useMemo, useState } from 'react';
import { CHANNELS, type ChannelName, applyChannel, blochFromRho, blochToState, densityFromKet, purity, vonNeumannEntropy, ket, ketPlus, ketPlusI } from '../../domain/quantum';
import { LineChart } from '../components/Charts';
import { Slider, Stat, SaveRun, type SaveFn } from './shared';

const STATES: Record<string, () => ReturnType<typeof ket>> = { '|0⟩': () => ket('0'), '|1⟩': () => ket('1'), '|+⟩': () => ketPlus(), '|+i⟩': () => ketPlusI() };
const NOTES: Record<ChannelName, string> = {
  bitFlip: 'Pauli-X errors: x is untouched; y and z shrink by (1−2p). At p = ½ the y–z plane collapses.',
  phaseFlip: 'Pauli-Z errors (pure dephasing): z is untouched; x and y shrink by (1−2p). Populations never change.',
  depolarizing: 'ρ → (1−p)ρ + pI/2: the whole Bloch ball shrinks uniformly by (1−p).',
  amplitudeDamping: 'T1-type relaxation: z → (1−γ)z + γ (towards |0⟩), x and y shrink by √(1−γ). Not symmetric; the fixed point is |0⟩.',
  phaseDamping: 'Alternative dephasing model: x and y shrink by √(1−λ), z untouched.',
};

export function NoiseLab({ onSave }: { onSave: SaveFn }) {
  const [stateKey, setStateKey] = useState('|+⟩');
  const [custom, setCustom] = useState(false);
  const [theta, setTheta] = useState(60);
  const [phi, setPhi] = useState(0);
  const [channel, setChannel] = useState<ChannelName>('phaseFlip');
  const [p, setP] = useState(0.3);
  const [n, setN] = useState(1);
  const ch = CHANNELS[channel];

  const run = useMemo(() => {
    const psi = custom ? blochToState((theta * Math.PI) / 180, (phi * Math.PI) / 180) : STATES[stateKey]();
    const rho0 = densityFromKet(psi);
    const evolve = (strength: number) => { let r = rho0; const k = ch.make(strength); for (let i = 0; i < n; i++) r = applyChannel(r, k); return r; };
    const grid = Array.from({ length: 51 }, (_, i) => i / 50);
    const rows = grid.map((s) => { const r = evolve(s); const b = blochFromRho(r); return { s, ...b, pur: purity(r) }; });
    const cur = evolve(p);
    return { rows, bloch: blochFromRho(cur), pur: purity(cur), ent: vonNeumannEntropy(cur), start: blochFromRho(rho0) };
  }, [stateKey, custom, theta, phi, channel, p, n, ch]);

  const series = [
    { name: 'x', points: run.rows.map((r) => [r.s, r.x] as [number, number]) },
    { name: 'y', points: run.rows.map((r) => [r.s, r.y] as [number, number]) },
    { name: 'z', points: run.rows.map((r) => [r.s, r.z] as [number, number]) },
    { name: 'purity tr(ρ²)', points: run.rows.map((r) => [r.s, r.pur] as [number, number]) },
  ];
  const sym = ch.param === 'gamma' ? 'γ' : ch.param === 'lambda' ? 'λ' : 'p';
  const summary = `${ch.label}, ${sym}=${p}, n=${n}, initial ${custom ? `θ=${theta}° φ=${phi}°` : stateKey}: Bloch (${run.bloch.x.toFixed(3)}, ${run.bloch.y.toFixed(3)}, ${run.bloch.z.toFixed(3)}), purity ${run.pur.toFixed(3)}`;
  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Controls</h3>
        <div className="row">
          <label htmlFor="nz-state">Initial state</label>
          <select id="nz-state" value={custom ? 'custom' : stateKey} onChange={(e) => { if (e.target.value === 'custom') setCustom(true); else { setCustom(false); setStateKey(e.target.value); } }}>
            {Object.keys(STATES).map((k) => <option key={k} value={k}>{k}</option>)}<option value="custom">custom (θ, φ)</option>
          </select>
        </div>
        {custom && (<><Slider id="nz-th" label="θ" value={theta} min={0} max={180} unit="°" onChange={setTheta} /><Slider id="nz-ph" label="φ" value={phi} min={0} max={360} unit="°" onChange={setPhi} /></>)}
        <div className="row"><label htmlFor="nz-ch">Channel</label>
          <select id="nz-ch" value={channel} onChange={(e) => setChannel(e.target.value as ChannelName)}>{(Object.keys(CHANNELS) as ChannelName[]).map((k) => <option key={k} value={k}>{CHANNELS[k].label}</option>)}</select></div>
        <Slider id="nz-p" label={`Noise strength ${sym}`} value={p} min={0} max={1} step={0.01} onChange={setP} />
        <Slider id="nz-n" label="Apply the channel n times" value={n} min={1} max={10} step={1} onChange={(v) => setN(Math.round(v))} />
        <p className="small">{NOTES[channel]}</p>
        <div className="row"><button type="button" className="ghost" onClick={() => { setStateKey('|+⟩'); setCustom(false); setChannel('phaseFlip'); setP(0.3); setN(1); }}>Reset</button>
          <SaveRun onSave={onSave} label={`${ch.label} ${sym}=${p}`} params={{ channel, strength: p, repeats: n }} summary={summary} /></div>
      </div>
      <div className="card">
        <h3>Result at {sym} = {p}</h3>
        <div><Stat k="x" v={run.bloch.x.toFixed(3)} /><Stat k="y" v={run.bloch.y.toFixed(3)} /><Stat k="z" v={run.bloch.z.toFixed(3)} /></div>
        <div><Stat k="|r|" v={Math.hypot(run.bloch.x, run.bloch.y, run.bloch.z).toFixed(3)} /><Stat k="purity" v={run.pur.toFixed(3)} /><Stat k="entropy [bits]" v={run.ent.toFixed(3)} /></div>
        <p className="small muted">Start: ({run.start.x.toFixed(3)}, {run.start.y.toFixed(3)}, {run.start.z.toFixed(3)}). Purity = (1+|r|²)/2.</p>
      </div>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3>Bloch coordinates and purity versus {sym} (after {n} application{n > 1 ? 's' : ''})</h3>
        <LineChart title={`Bloch coordinates and purity versus ${sym} for ${ch.label}`} series={series} xLabel={`noise strength ${sym}`} yLabel="value" xDomain={[0, 1]} yDomain={[-1, 1]} />
        <details className="opt"><summary>Data table</summary>
          <div className="table-wrap"><table><thead><tr><th scope="col">{sym}</th><th scope="col">x</th><th scope="col">y</th><th scope="col">z</th><th scope="col">purity</th></tr></thead>
            <tbody>{run.rows.filter((_, i) => i % 5 === 0).map((r) => <tr key={r.s}><td>{r.s.toFixed(2)}</td><td>{r.x.toFixed(3)}</td><td>{r.y.toFixed(3)}</td><td>{r.z.toFixed(3)}</td><td>{r.pur.toFixed(3)}</td></tr>)}</tbody></table></div></details>
      </div>
    </div>
  );
}
