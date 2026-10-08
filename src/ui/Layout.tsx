import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useSession, useStore } from '../app/state';

const NAV: [string, string][] = [['/', 'Dashboard'], ['/curriculum', 'Curriculum'], ['/labs', 'Labs'], ['/review', 'Review & quiz'], ['/tutor', 'Ask the tutor'], ['/research', 'Research transition'], ['/settings', 'Settings']];

export function Layout() {
  const { pathname } = useLocation();
  const session = useSession();
  const store = useStore();
  const first = useRef(true);
  useEffect(() => {
    // Move focus to the page title on navigation so keyboard and screen-reader users land on new content.
    // (Not on the very first load, so the skip link remains the first Tab stop.)
    if (first.current) { first.current = false; return; }
    const h = document.getElementById('page-title');
    if (h) h.focus({ preventScroll: false }); else window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to main content</a>
      <header className="site">
        <div className="wrap bar">
          <Link to="/" className="brand">
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" /><ellipse cx="16" cy="16" rx="13" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="16" cy="16" r="3" fill="currentColor" /></svg>
            Quantum Computing Tutor
          </Link>
          <nav className="main" aria-label="Main">
            <ul>{NAV.map(([to, label]) => <li key={to}><NavLink to={to} end={to === '/'}>{label}</NavLink></li>)}</ul>
          </nav>
          <span className="mode-badge" title={session.provider.disclosure}>Tutor: {session.provider.info.kind === 'local-scripted' ? 'local scripted (not an AI model)' : 'remote model via your endpoint'}</span>
        </div>
      </header>
      {(store.loadWarning || store.storageError) && <div className="wrap"><div className="callout bad" role="alert">{store.loadWarning ?? store.storageError}</div></div>}
      <main id="main" tabIndex={-1}><div className="wrap"><Outlet /></div></main>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{session.announcement}</div>
      <footer className="site">
        <div className="wrap">
          <p>Progress is stored only in this browser (local storage). Export it from <Link to="/settings">Settings</Link> to keep or move it.</p>
          <p>Research topics shown here are flexible learning pathways, not claims of affiliation with, or endorsement by, any university, professor or research group. Validate topic choices with your eventual supervisor. Simulators are idealised; nothing here is a statement about current hardware.</p>
          <p><Link to="/conventions">Notation and conventions</Link></p>
        </div>
      </footer>
    </>
  );
}
