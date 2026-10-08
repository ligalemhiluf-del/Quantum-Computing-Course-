import { PageTitle } from '../components/Common';
import { Markdown } from '../components/Markdown';
import { md } from '../../content/helpers';

export function ConventionsPage() {
  return (
    <div className="stack">
      <PageTitle sub="Fixed throughout the course; where software differs, the lessons say so.">Notation and conventions</PageTitle>
      <div className="card">
        <Markdown text={md`
- **Dirac notation.** Kets $|\psi\rangle$ are column vectors, bras $\langle\psi|$ their conjugate transposes; $\langle\phi|\psi\rangle=\sum_k\phi_k^*\psi_k$.
- **Computational basis.** $|0\rangle=(1,0)^T$, $|1\rangle=(0,1)^T$; $Z|0\rangle=+|0\rangle$.
- **Qubit ordering.** In $|q_0q_1\cdots q_{n-1}\rangle$ the leftmost bit is qubit 0 and the most significant. $A\otimes B$ acts with $A$ on qubit 0. Some libraries (for example Qiskit) use the opposite order.
- **Bloch sphere.** $|\psi\rangle=\cos\tfrac\theta2|0\rangle+e^{i\varphi}\sin\tfrac\theta2|1\rangle$; $\vec n=(\langle X\rangle,\langle Y\rangle,\langle Z\rangle)$.
- **Gates.** $R_{\hat n}(\alpha)=e^{-i\alpha\,\hat n\cdot\vec\sigma/2}$; $H=(X+Z)/\sqrt2$; $S=\mathrm{diag}(1,i)$; $T=\mathrm{diag}(1,e^{i\pi/4})$. Circuit diagrams read left to right; operator products read right to left.
- **CNOT.** First listed qubit is the control, the second the target.
- **Entropy and logs.** Entropies are in bits ($\log_2$).
- **Units.** $\hbar=1$ internally; Hamiltonians are $H/\hbar$ in rad/μs and time in μs. Conversions to SI: $\nu=\omega/2\pi$ (MHz), $E=\hbar\omega$ (neV; $1\,\mathrm{rad/\mu s}\leftrightarrow0.6582$ neV, $1\,\mathrm{MHz}\leftrightarrow4.136$ neV).
- **Probability.** Probabilities are $|\langle m|\psi\rangle|^2$; shot noise in labs comes from a seeded pseudo-random generator so runs are reproducible.
- **Simulator limits.** Statevector simulation up to 10 qubits; the physics lab uses at most 2 spins; no hardware noise models are claimed to match real devices.
`} />
      </div>
    </div>
  );
}
