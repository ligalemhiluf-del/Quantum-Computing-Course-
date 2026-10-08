import { useMemo, useState } from 'react';
import { simulate, GATES, probabilities, bitString, reducedState, purity, vonNeumannEntropy, schmidtCoefficients, entanglementEntropy, expectation, kron, X, Y, Z, I2, matAdd, matSub, matScale, sampleCounts, makeRng, fmt, type Op } from '../../domain/quantum';
import { BarRows } from '../components/Charts';
import { MatrixView, Stat, SaveRun, type SaveFn } from './shared';

const PRESETS: { name: string; ops: Op[] }[] = [
  { name: 'Φ+ = (|00⟩+|11⟩)/√2', ops: [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }] },
  { name: 'Φ− = (|00⟩−|11⟩)/√2', ops: [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }, { gate: 'Z', targets: [0] }] },
  { name: 'Ψ+ = (|01⟩+|10⟩)/√2', ops: [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }, { gate: 'X', targets: [1] }] },
  { name: 'Ψ− = (|01⟩−|10⟩)/√2', ops: [{ gate: 'H', targets: [0] }, { gate: 'CNOT', targets: [0, 1] }, { gate: 'X', targets: [1] }, { gate: 'Z', targets: [0] }] },
  { name: 'Product |+⟩|0⟩ (H on q0 only)', ops: [{ gate: 'H', targets: [0] }] },
];
const GATE_LIST = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'CZ', 'SWAP'];
const P1 = { X, Y, Z } as const;
const label = (o: Op) => `${o.gate}(${o.targets.join(',')})`;

export function BellLab({ onSave }: { onSave: SaveFn }) {
  const [ops, setOps] = useState<Op[]>(PRESETS[0].ops);
  const [gate, setGate] = useState('H');
  const [t0, setT0] = useState(0);
  const [t1, setT1] = useState(1);
  const [shots, setShots] = useState(1000);
  const [seed, setSeed] = useState(7);
  const [counts, setCounts] = useState<number[] | null>(null);
  const arity = GATES[gate].arity;

  const o = useMemo(() => {
    const psi = simulate(2, ops);
    const rhoA = reducedState(psi, [0]);
    const rhoB = reducedState(psi, [1]);
    const E = (a: ReturnType<typeof kron>, b: ReturnType<typeof kron>) => expectation(kron(a, b), psi);
    const b0 = matScale(matAdd(Z, X), Math.SQRT1_2);
    const b1 = matScale(matSub(Z, X), Math.SQRT1_2);
    const chsh = E(Z, b0) + E(Z, b1) + E(X, b0) - E(X, b1);
    return {
      psi, probs: probabilities(psi), rhoA, rhoB, purA: purity(rhoA), entA: vonNeumannEntropy(rhoA), schmidt: schmidtCoefficients(psi, 1), entS: entanglementEntropy(psi, 1),
      corr: (['X', 'Y', 'Z'] as const).map((p) => (['X', 'Y', 'Z'] as const).map((q) => E(P1[p], P1[q]))),
      locA: (['X', 'Y', 'Z'] as const).map((p) => E(P1[p], I2)), locB: (['X', 'Y', 'Z'] as const).map((q) => E(I2, P1[q])), chsh,
    };
  }, [ops]);

  const sample = () => setCounts(sampleCounts(o.probs, shots, makeRng(seed)));
  const add = () => { if (arity === 2 && t0 === t1) return; if (ops.length < 12) { setOps([...ops, { gate, targets: arity === 1 ? [t0] : [t0, t1] }]); setCounts(null); } };
  const marg = counts ? { a: [counts[0] + counts[1], counts[2] + counts[3]], b: [counts[0] + counts[2], counts[1] + counts[3]] } : null;
  const summary = `circuit ${ops.map(label).join(' ')}; purity(q0)=${o.purA.toFixed(3)}, S=${o.entS.toFixed(3)} bits, ⟨ZZ⟩=${o.corr[2][2].toFixed(3)}, ⟨XX⟩=${o.corr[0][0].toFixed(3)}, CHSH=${o.chsh.toFixed(3)}`;
  const axes = ['X', 'Y', 'Z'];
  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Circuit builder (start: |00⟩)</h3>
        <div role="group" aria-label="Preset circuits" className="stack">{PRESETS.map((p) => <button key={p.name} type="button" className="ghost small" onClick={() => { setOps(p.ops); setCounts(null); }}>{p.name}</button>)}</div>
        <div className="row" style={{ marginTop: 10 }}>
          <label htmlFor="bell-g">Gate</label>
          <select id="bell-g" value={gate} onChange={(e) => setGate(e.target.value)}>{GATE_LIST.map((g) => <option key={g} value={g}>{g}</option>)}</select>
          <label htmlFor="bell-t0">{arity === 2 ? 'Control' : 'Qubit'}</label>
          <select id="bell-t0" value={t0} onChange={(e) => setT0(+e.target.value)}><option value={0}>q0</option><option value={1}>q1</option></select>
          {arity === 2 && (<><label htmlFor="bell-t1">Target</label><select id="bell-t1" value={t1} onChange={(e) => setT1(+e.target.value)}><option value={0}>q0</option><option value={1}>q1</option></select></>)}
          <button type="button" className="secondary small" onClick={add} disabled={arity === 2 && t0 === t1}>Add</button>
        </div>
        <p><strong>Gates (time order):</strong> {ops.length ? ops.map(label).join(' → ') : 'none (|00⟩)'}</p>
        <div className="row"><button type="button" className="ghost small" onClick={() => { setOps(ops.slice(0, -1)); setCounts(null); }} disabled={!ops.length}>Remove last</button><button type="button" className="ghost small" onClick={() => { setOps([]); setCounts(null); }}>Clear</button><button type="button" className="ghost small" onClick={() => { setOps(PRESETS[0].ops); setCounts(null); }}>Reset lab</button></div>
        <p className="small muted">q0 is the leftmost bit. CNOT(0,1): control q0, target q1. Max 12 gates.</p>
      </div>
      <div className="card">
        <h3>Statevector</h3>
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Basis</th><th scope="col">Amplitude</th><th scope="col">Probability</th></tr></thead>
          <tbody>{o.psi.map((a, i) => <tr key={i}><td>|{bitString(i, 2)}⟩</td><td>{fmt(a, 4)}</td><td>{o.probs[i].toFixed(4)}</td></tr>)}</tbody>
        </table></div>
        <BarRows caption="Joint outcome probabilities" rows={o.probs.map((p, i) => ({ label: bitString(i, 2), value: p }))} />
      </div>
      <div className="card">
        <h3>Reduced states and entanglement</h3>
        <MatrixView m={o.rhoA} label="ρ for qubit 0 (tr over qubit 1)" /><MatrixView m={o.rhoB} label="ρ for qubit 1" />
        <div><Stat k="purity tr(ρ²)" v={o.purA.toFixed(3)} /><Stat k="S(ρ₀) [bits]" v={o.entA.toFixed(3)} /><Stat k="Schmidt rank" v={o.schmidt.length} /><Stat k="entanglement entropy [bits]" v={o.entS.toFixed(3)} /></div>
        <p className="small muted">Schmidt coefficients: {o.schmidt.map((s) => s.toFixed(4)).join(', ')}. Purity 1 ⇔ product state; purity ½ ⇔ maximally entangled pair.</p>
      </div>
      <div className="card">
        <h3>Correlations ⟨P⊗Q⟩</h3>
        <div className="table-wrap"><table>
          <caption className="small muted">Rows: Pauli on qubit 0; columns: Pauli on qubit 1</caption>
          <thead><tr><th scope="col">q0 \ q1</th>{axes.map((a) => <th scope="col" key={a}>{a}</th>)}<th scope="col">⟨P⊗I⟩</th></tr></thead>
          <tbody>{axes.map((p, i) => <tr key={p}><th scope="row">{p}</th>{o.corr[i].map((v, j) => <td key={j}>{v.toFixed(3)}</td>)}<td>{o.locA[i].toFixed(3)}</td></tr>)}<tr><th scope="row">⟨I⊗Q⟩</th>{o.locB.map((v, j) => <td key={j}>{v.toFixed(3)}</td>)}<td /></tr></tbody>
        </table></div>
        <p><Stat k="CHSH value S" v={o.chsh.toFixed(3)} /> <span className="small muted">Classical bound |S| ≤ 2; quantum bound 2√2 ≈ 2.828. Settings: a₀=Z, a₁=X, b₀,₁=(Z±X)/√2.</span></p>
        <p className="small muted">Data, not signalling: S is computed from the statevector — a statement about correlations, not about influence at a distance.</p>
      </div>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3>Sampled shots (seeded, reproducible)</h3>
        <div className="row">
          <label htmlFor="bell-shots">Shots</label><input id="bell-shots" type="number" min={1} max={100000} value={shots} onChange={(e) => setShots(Math.min(100000, Math.max(1, Math.floor(+e.target.value || 1))))} style={{ width: '7rem' }} />
          <label htmlFor="bell-seed">Seed</label><input id="bell-seed" type="number" min={0} value={seed} onChange={(e) => setSeed(Math.max(0, Math.floor(+e.target.value || 0)))} style={{ width: '7rem' }} />
          <button type="button" onClick={sample}>Sample</button>
        </div>
        {counts && marg ? (
          <div className="grid cols-2" style={{ marginTop: 8 }}>
            <div className="table-wrap"><table><caption className="small muted">Joint counts (Z basis)</caption><thead><tr><th scope="col">q0q1</th><th scope="col">Count</th><th scope="col">Frequency</th></tr></thead><tbody>{counts.map((c, i) => <tr key={i}><td>{bitString(i, 2)}</td><td>{c}</td><td>{(c / shots).toFixed(3)}</td></tr>)}</tbody></table></div>
            <div className="table-wrap"><table><caption className="small muted">Single-qubit marginals</caption><thead><tr><th scope="col">Qubit</th><th scope="col">P(0)</th><th scope="col">P(1)</th></tr></thead><tbody><tr><td>q0</td><td>{(marg.a[0] / shots).toFixed(3)}</td><td>{(marg.a[1] / shots).toFixed(3)}</td></tr><tr><td>q1</td><td>{(marg.b[0] / shots).toFixed(3)}</td><td>{(marg.b[1] / shots).toFixed(3)}</td></tr></tbody></table><p className="small muted">Statistical error on each frequency ≈ {(Math.sqrt(0.25 / shots)).toFixed(3)}.</p></div>
          </div>
        ) : <p className="muted small">Press “Sample” to draw shots from the current state.</p>}
        <div className="row" style={{ marginTop: 8 }}><SaveRun onSave={onSave} label={`Bell: ${ops.map(label).join(' ')}`} params={{ gates: ops.length, shots, seed }} summary={summary} /></div>
      </div>
    </div>
  );
}
