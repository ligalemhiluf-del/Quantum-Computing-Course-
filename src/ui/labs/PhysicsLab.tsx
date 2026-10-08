import { useMemo, useState } from 'react';
import { buildHamiltonian, spectrum, exactPropagator, trotterPropagator, trotterError, logLogSlope, radPerUsToMHz, radPerUsToNeV, ket, simulate, apply, expectation, Z, I2, kron, MAX_HAMILTONIAN_QUBITS, type PauliTerm, type Vec } from '../../domain/quantum';
import { LineChart } from '../components/Charts';
import { ErrorNote } from '../components/Common';
import { Slider, Stat, SaveRun, type SaveFn } from './shared';

type Row = { id: number; coeff: string; pauli: string };
type Preset = { name: string; n: 1 | 2; terms: [number, string][]; note: string };
const PRESETS: Preset[] = [
  { name: 'Single spin in a field (Larmor), H/ħ = π·Z rad/μs', n: 1, terms: [[Math.PI, 'Z']], note: 'ω = 2π rad/μs, a 1 MHz transition. One term, so Trotter is trivially exact.' },
  { name: 'Single spin, field + drive: 1.0·Z + 0.5·X', n: 1, terms: [[1, 'Z'], [0.5, 'X']], note: 'Z and X do not commute: Trotter error appears.' },
  { name: 'Two-spin transverse-field Ising: −ZZ − 0.7(XI+IX)', n: 2, terms: [[-1, 'ZZ'], [-0.7, 'XI'], [-0.7, 'IX']], note: 'ZZ and XI do not commute: first-order error ∝ 1/steps.' },
  { name: 'Two-spin Heisenberg: 0.5(XX+YY+ZZ)', n: 2, terms: [[0.5, 'XX'], [0.5, 'YY'], [0.5, 'ZZ']], note: 'XX, YY and ZZ mutually commute: Trotter is exact up to rounding.' },
  { name: 'Commuting Ising + longitudinal fields: −ZZ + 0.6·ZI + 0.3·IZ', n: 2, terms: [[-1, 'ZZ'], [0.6, 'ZI'], [0.3, 'IZ']], note: 'All terms are diagonal in Z: exact.' },
];
let rid = 1;
const toRows = (t: [number, string][]): Row[] => t.map(([c, p]) => ({ id: rid++, coeff: String(+c.toFixed(4)), pauli: p }));
const STEP_LIST = [1, 2, 4, 8, 16, 32, 64];
const human = (b: number) => (b < 1e3 ? `${b.toFixed(0)} B` : b < 1e6 ? `${(b / 1e3).toFixed(1)} kB` : b < 1e9 ? `${(b / 1e6).toFixed(1)} MB` : b < 1e12 ? `${(b / 1e9).toFixed(1)} GB` : b < 1e15 ? `${(b / 1e12).toFixed(1)} TB` : `${(b / 1e15).toExponential(1)} PB`);

function initialKet(kind: string, n: number): Vec {
  if (kind === 'ones') return ket('1'.repeat(n));
  if (kind === 'plus') return simulate(n, Array.from({ length: n }, (_, q) => ({ gate: 'H', targets: [q] })));
  return ket('0'.repeat(n));
}

export function PhysicsLab({ onSave }: { onSave: SaveFn }) {
  const [pi, setPi] = useState(2);
  const [n, setN] = useState<1 | 2>(PRESETS[2].n);
  const [rows, setRows] = useState<Row[]>(() => toRows(PRESETS[2].terms));
  const [init, setInit] = useState('zeros');
  const [T, setT] = useState(2);
  const [steps, setSteps] = useState(8);

  const parsed = useMemo(() => {
    try {
      const terms: PauliTerm[] = rows.map((r) => {
        const c = Number(r.coeff);
        if (r.coeff.trim() === '' || !Number.isFinite(c)) throw new Error(`Coefficient "${r.coeff}" is not a number.`);
        return { coeff: c, pauli: r.pauli.toUpperCase() };
      });
      buildHamiltonian(terms, n);
      return { terms, error: null as string | null };
    } catch (e) { return { terms: [] as PauliTerm[], error: (e as Error).message }; }
  }, [rows, n]);

  const calc = useMemo(() => {
    if (parsed.error) return null;
    const { terms } = parsed;
    const psi0 = initialKet(init, n);
    const obs = n === 1 ? Z : kron(Z, I2);
    const z0 = (u: ReturnType<typeof exactPropagator>) => expectation(obs, apply(u, psi0));
    const ev = spectrum(terms, n);
    const dense = Array.from({ length: 61 }, (_, i) => { const t = (T * i) / 60; return [t, z0(exactPropagator(terms, n, t))] as [number, number]; });
    const trot = (order: 1 | 2) => Array.from({ length: steps + 1 }, (_, k) => { const t = (T * k) / steps; return [t, k === 0 ? z0(exactPropagator(terms, n, 0)) : z0(trotterPropagator(terms, n, t, k, order))] as [number, number]; });
    const errs = STEP_LIST.map((s) => ({ s, e1: trotterError(terms, n, T, s, 1), e2: trotterError(terms, n, T, s, 2) }));
    const maxErr = Math.max(...errs.flatMap((x) => [x.e1, x.e2]));
    const ok = (k: 'e1' | 'e2') => errs.filter((x) => x[k] > 1e-12);
    const slope = (k: 'e1' | 'e2') => { const o = ok(k); return o.length >= 3 ? logLogSlope(o.map((x) => x.s), o.map((x) => x[k])) : null; };
    const U = exactPropagator(terms, n, T);
    const fin = apply(U, psi0);
    const fid = (order: 1 | 2) => { const a = apply(trotterPropagator(terms, n, T, steps, order), psi0); const ov = fin.reduce((s, x, i) => ({ re: s.re + x.re * a[i].re + x.im * a[i].im, im: s.im + x.re * a[i].im - x.im * a[i].re }), { re: 0, im: 0 }); return 1 - (ov.re ** 2 + ov.im ** 2); };
    return { ev, dense, t1: trot(1), t2: trot(2), errs, maxErr, s1: slope('e1'), s2: slope('e2'), infid1: fid(1), infid2: fid(2), gates1: steps * terms.length, gates2: steps * (2 * terms.length - 1) };
  }, [parsed, n, init, T, steps]);

  const setPreset = (i: number) => { setPi(i); setN(PRESETS[i].n); setRows(toRows(PRESETS[i].terms)); };
  const upd = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const hStr = parsed.error ? '' : parsed.terms.map((t) => `${t.coeff >= 0 ? '+' : '−'}${Math.abs(t.coeff)}·${t.pauli}`).join(' ');
  const summary = calc ? `H/ħ = ${hStr} rad/μs (${n} spin${n > 1 ? 's' : ''}); ground energy ${calc.ev[0].toFixed(4)} rad/μs; T=${T} μs, ${steps} steps: ‖U−U₁‖=${calc.errs.find((x) => x.s === steps)?.e1.toExponential(2) ?? 'n/a'}; fitted slopes ${calc.s1?.toFixed(2) ?? 'n/a'} (1st), ${calc.s2?.toFixed(2) ?? 'n/a'} (2nd)` : 'invalid Hamiltonian';

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Hamiltonian from Pauli terms</h3>
        <p className="small muted">H/ħ = Σ c<sub>k</sub> P<sub>k</sub>, with c in rad/μs, time in μs (ħ = 1 internally). Strings use I, X, Y, Z; qubit 0 is the leftmost letter.</p>
        <div className="row"><label htmlFor="ph-pre">Preset</label>
          <select id="ph-pre" value={pi} onChange={(e) => setPreset(+e.target.value)}>{PRESETS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}</select></div>
        <p className="small">{PRESETS[pi].note}</p>
        <div className="row"><label htmlFor="ph-n">Spins</label>
          <select id="ph-n" value={n} onChange={(e) => { const v = +e.target.value as 1 | 2; setN(v); setRows(toRows(v === 1 ? [[1, 'Z']] : [[-1, 'ZZ'], [-0.7, 'XI']])); }}><option value={1}>1</option><option value={2}>2</option></select>
          <span className="small muted">(limit {MAX_HAMILTONIAN_QUBITS} in the library, 2 here)</span></div>
        <table><thead><tr><th scope="col">Coefficient c (rad/μs)</th><th scope="col">Pauli string</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.id}>
              <td><input aria-label={`Coefficient of term ${i + 1}`} type="text" inputMode="decimal" value={r.coeff} onChange={(e) => upd(r.id, { coeff: e.target.value })} style={{ width: '7rem' }} /></td>
              <td><input aria-label={`Pauli string of term ${i + 1}`} type="text" value={r.pauli} maxLength={n} onChange={(e) => upd(r.id, { pauli: e.target.value.toUpperCase() })} style={{ width: '5rem' }} /></td>
              <td><button type="button" className="ghost small" onClick={() => setRows(rows.filter((x) => x.id !== r.id))} disabled={rows.length <= 1} aria-label={`Remove term ${i + 1}`}>Remove</button></td>
            </tr>))}</tbody></table>
        <div className="row" style={{ marginTop: 6 }}><button type="button" className="secondary small" onClick={() => setRows([...rows, { id: rid++, coeff: '0.5', pauli: 'I'.repeat(n) }])} disabled={rows.length >= 8}>Add term</button></div>
        {parsed.error && <ErrorNote>{parsed.error}</ErrorNote>}
        <div className="row"><label htmlFor="ph-init">Initial state</label>
          <select id="ph-init" value={init} onChange={(e) => setInit(e.target.value)}><option value="zeros">|0…0⟩</option><option value="ones">|1…1⟩</option><option value="plus">|+…+⟩</option></select></div>
        <Slider id="ph-T" label="Total time T" value={T} min={0.2} max={10} step={0.1} unit="μs" onChange={setT} />
        <Slider id="ph-steps" label="Trotter steps n (time step Δt = T/n)" value={steps} min={1} max={64} step={1} onChange={(v) => setSteps(Math.round(v))} />
        <div className="row"><button type="button" className="ghost" onClick={() => { setPreset(2); setInit('zeros'); setT(2); setSteps(8); }}>Reset</button>{calc && <SaveRun onSave={onSave} label={`Physics: ${PRESETS[pi].name.split(':')[0].slice(0, 40)}`} params={{ spins: n, T, steps }} summary={summary} />}</div>
      </div>
      {calc && (
        <>
          <div className="card">
            <h3>Spectrum and units</h3>
            <p className="small muted">Eigenvalues of H/ħ (rad/μs). Level differences convert to frequency ν = Δω/2π and energy ΔE = ħΔω.</p>
            <div className="table-wrap"><table>
              <thead><tr><th scope="col">Level</th><th scope="col">E/ħ (rad/μs)</th><th scope="col">Δ from ground (rad/μs)</th><th scope="col">Δν (MHz)</th><th scope="col">ΔE (neV)</th></tr></thead>
              <tbody>{calc.ev.map((e, i) => { const d = e - calc.ev[0]; return <tr key={i}><td>{i}</td><td>{e.toFixed(4)}</td><td>{d.toFixed(4)}</td><td>{radPerUsToMHz(d).toFixed(4)}</td><td>{radPerUsToNeV(d).toFixed(4)}</td></tr>; })}</tbody>
            </table></div>
            <p className="small muted">ħ = 1.054571817×10⁻³⁴ J·s; 1 rad/μs ↔ 0.1592 MHz ↔ 0.6582 neV. Nuclear Zeeman splittings are of this order or smaller in laboratory fields.</p>
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3>⟨Z₀⟩(t): exact evolution versus product formulas</h3>
            <LineChart title="Expectation of Z on spin 0 versus time: exact, first-order Trotter and second-order Trotter" xLabel="time t (μs)" yLabel="⟨Z₀⟩" xDomain={[0, T]} yDomain={[-1, 1]}
              series={[{ name: 'exact (dense)', points: calc.dense, marker: 'none' }, { name: `Trotter 1st order, n=${steps}`, points: calc.t1, marker: 'square' }, { name: `Trotter 2nd order, n=${steps}`, points: calc.t2, marker: 'triangle' }]} />
            <div><Stat k="1 − fidelity at T (1st)" v={calc.infid1.toExponential(2)} /><Stat k="1 − fidelity at T (2nd)" v={calc.infid2.toExponential(2)} /><Stat k="exponentials (1st / 2nd)" v={`${calc.gates1} / ${calc.gates2}`} /></div>
            <p className="small muted">Each exponential e<sup>−i c P Δt</sup> is exactly implementable because P² = I, so cost ∝ steps × terms.</p>
          </div>
          <div className="card">
            <h3>Operator-norm error versus step count (at T = {T} μs)</h3>
            {calc.maxErr < 1e-10 ? <div className="callout ok">All terms commute: product formulas are exact up to rounding (max error {calc.maxErr.toExponential(1)}).</div> : (
              <>
                <LineChart title="Trotter operator-norm error versus number of steps, log-log" xLabel="steps n" yLabel="‖U_exact − U_Trotter‖" logX logY width={520} height={280}
                  series={[{ name: `1st order (slope ${calc.s1?.toFixed(2) ?? 'n/a'})`, points: calc.errs.map((x) => [x.s, x.e1] as [number, number]) }, { name: `2nd order (slope ${calc.s2?.toFixed(2) ?? 'n/a'})`, points: calc.errs.map((x) => [x.s, x.e2] as [number, number]) }]} />
                <p className="small">Fitted log-log slopes: <strong>{calc.s1?.toFixed(2) ?? 'n/a'}</strong> (1st order, expect ≈ −1) and <strong>{calc.s2?.toFixed(2) ?? 'n/a'}</strong> (2nd order, expect ≈ −2, asymptotically). Small n can be pre-asymptotic.</p>
              </>
            )}
            <div className="table-wrap"><table><thead><tr><th scope="col">Steps n</th><th scope="col">1st-order error</th><th scope="col">2nd-order error</th></tr></thead>
              <tbody>{calc.errs.map((x) => <tr key={x.s}><td>{x.s}</td><td>{x.e1.toExponential(3)}</td><td>{x.e2.toExponential(3)}</td></tr>)}</tbody></table></div>
          </div>
          <div className="card">
            <h3>The exact-diagonalisation baseline and its limit</h3>
            <p>This lab stores a {2 ** n}×{2 ** n} matrix. For N spins a dense Hamiltonian has 4<sup>N</sup> complex entries (16 bytes each) and a statevector 2<sup>N</sup>:</p>
            <div className="table-wrap"><table><thead><tr><th scope="col">N spins</th><th scope="col">Statevector</th><th scope="col">Dense H</th></tr></thead>
              <tbody>{[10, 20, 30].map((N) => <tr key={N}><td>{N}</td><td>{human(16 * 2 ** N)}</td><td>{human(16 * 4 ** N)}</td></tr>)}</tbody></table></div>
            <p className="small muted">Sparse methods and symmetries push exact methods further, but the exponential wall is why simulation circuits are interesting at all. This is a numerical illustration, not a resource estimate for hardware.</p>
          </div>
        </>
      )}
    </div>
  );
}
