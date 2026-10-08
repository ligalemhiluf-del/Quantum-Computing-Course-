import { useMemo, useState } from 'react';
import { H, Sdg, S, T, X, Y, Z, apply, blochAngles, blochFromKet, blochToState, expi, mul, probabilities, fmt, abs, arg, type Mat } from '../../domain/quantum';
import { BarRows, BlochSphere } from '../components/Charts';
import { Slider, Stat, SaveRun, type SaveFn } from './shared';

const PRESETS: [string, number, number][] = [['|0⟩', 0, 0], ['|1⟩', 180, 0], ['|+⟩', 90, 0], ['|−⟩', 90, 180], ['|+i⟩', 90, 90], ['|−i⟩', 90, 270]];
const GATE_BTNS: [string, Mat][] = [['H', H], ['X', X], ['Y', Y], ['Z', Z], ['S', S], ['S†', Sdg], ['T', T]];
const deg = (r: number) => (r * 180) / Math.PI;

export function BlochLab({ onSave }: { onSave: SaveFn }) {
  const [theta, setTheta] = useState(60);
  const [phi, setPhi] = useState(45);
  const [gp, setGp] = useState(0);
  const [view, setView] = useState(30);
  const out = useMemo(() => {
    const psi0 = blochToState((theta * Math.PI) / 180, (phi * Math.PI) / 180);
    const g = expi((gp * Math.PI) / 180);
    const psi = psi0.map((a) => mul(a, g));
    return {
      psi,
      z: probabilities(psi),
      x: probabilities(apply(H, psi)),
      y: probabilities(apply(H, apply(Sdg, psi))),
      bloch: blochFromKet(psi),
    };
  }, [theta, phi, gp]);
  const applyGate = (m: Mat) => {
    const next = apply(m, out.psi);
    const a = blochAngles(blochFromKet(next));
    setTheta(Math.round(deg(a.theta) * 10) / 10);
    setPhi(Math.round(((deg(a.phi) + 360) % 360) * 10) / 10);
  };
  const reset = () => { setTheta(60); setPhi(45); setGp(0); };
  const summary = `θ=${theta}°, φ=${phi}°, global phase ${gp}°; P(0)=${out.z[0].toFixed(3)}, P(+)=${out.x[0].toFixed(3)}, P(+i)=${out.y[0].toFixed(3)}; Bloch (${out.bloch.x.toFixed(3)}, ${out.bloch.y.toFixed(3)}, ${out.bloch.z.toFixed(3)})`;
  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Controls</h3>
        <p className="small muted">State: |ψ⟩ = e<sup>iγ</sup>(cos(θ/2)|0⟩ + e<sup>iφ</sup> sin(θ/2)|1⟩)</p>
        <Slider id="bl-theta" label="Polar angle θ" value={theta} min={0} max={180} step={1} unit="°" onChange={setTheta} />
        <Slider id="bl-phi" label="Relative phase φ" value={phi} min={0} max={360} step={1} unit="°" onChange={setPhi} />
        <Slider id="bl-gp" label="Global phase γ" value={gp} min={0} max={360} step={1} unit="°" onChange={setGp} />
        <div role="group" aria-label="Preset states" className="row">{PRESETS.map(([n, t, p]) => <button key={n} type="button" className="ghost small" onClick={() => { setTheta(t); setPhi(p); }}>{n}</button>)}</div>
        <div role="group" aria-label="Apply a gate to the current state" className="row" style={{ marginTop: 8 }}>
          <span className="small muted">Apply gate:</span>{GATE_BTNS.map(([n, m]) => <button key={n} type="button" className="secondary small" onClick={() => applyGate(m)}>{n}</button>)}
        </div>
        <p className="small muted">Applying a gate re-expresses the result in the (θ, φ) convention, which discards its global phase.</p>
        <div className="row"><button type="button" className="ghost" onClick={reset}>Reset</button><SaveRun onSave={onSave} label={`Bloch θ=${theta}° φ=${phi}°`} params={{ theta, phi, globalPhase: gp }} summary={summary} /></div>
      </div>
      <div className="card">
        <h3>Output</h3>
        <BlochSphere bloch={out.bloch} azimuthDeg={view} label={`θ=${theta} degrees, φ=${phi} degrees`} />
        <Slider id="bl-view" label="Viewing azimuth (display only)" value={view} min={0} max={360} step={5} unit="°" onChange={setView} />
        <div>
          <Stat k="x = ⟨X⟩" v={out.bloch.x.toFixed(3)} /><Stat k="y = ⟨Y⟩" v={out.bloch.y.toFixed(3)} /><Stat k="z = ⟨Z⟩" v={out.bloch.z.toFixed(3)} />
        </div>
      </div>
      <div className="card">
        <h3>Amplitudes</h3>
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Basis</th><th scope="col">Amplitude</th><th scope="col">|amp|</th><th scope="col">Phase</th></tr></thead>
          <tbody>{out.psi.map((a, i) => <tr key={i}><td>|{i}⟩</td><td>{fmt(a, 4)}</td><td>{abs(a).toFixed(4)}</td><td>{abs(a) < 1e-9 ? '—' : `${deg(arg(a)).toFixed(1)}°`}</td></tr>)}</tbody>
        </table></div>
        <p className="small muted">Change γ: the phases move, but nothing in the next panel does.</p>
      </div>
      <div className="card">
        <h3>Measurement probabilities in three bases</h3>
        <BarRows caption="Z basis" rows={[{ label: 'P(0)', value: out.z[0] }, { label: 'P(1)', value: out.z[1] }]} />
        <BarRows caption="X basis" rows={[{ label: 'P(+)', value: out.x[0] }, { label: 'P(−)', value: out.x[1] }]} />
        <BarRows caption="Y basis" rows={[{ label: 'P(+i)', value: out.y[0] }, { label: 'P(−i)', value: out.y[1] }]} />
        <p className="small muted">Check: P(+) = (1+⟨X⟩)/2 = {((1 + out.bloch.x) / 2).toFixed(3)}.</p>
      </div>
    </div>
  );
}
