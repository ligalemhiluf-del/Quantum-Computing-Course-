import { describe, it, expect, beforeAll } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../src/App';
import { courseData as d } from '../src/content';
import { ProgressStore } from '../src/domain/progress/store';
import { setStore } from '../src/app/state';

const render = (path: string) => renderToString(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>).replaceAll('<!-- -->', '');
const has = (html: string, re: RegExp) => re.test(html); // boolean assertions keep failures short (no HTML dump)

describe('every route renders without runtime errors (server render, fresh state)', () => {
  beforeAll(() => setStore(new ProgressStore(d, null)));
  const routes: [string, RegExp][] = [
    ['/', /Quantum Computing for Physicists/],
    ['/curriculum', /Curriculum explorer/],
    ['/curriculum?track=B', /Track B|Quantum information foundations/],
    ['/curriculum?view=graph', /Prerequisite graph of all modules/],
    ['/labs', /Four simulator-first labs/],
    ['/review', /Review and quiz/],
    ['/tutor', /local scripted tutor/i],
    ['/research', /Flexible pathway, not an endorsement/],
    ['/settings', /Provider and disclosure/],
    ['/conventions', /qubit 0 and the most significant|Qubit ordering/i],
    ['/definitely-not-a-route', /was not found/],
    ['/module/does-not-exist', /module was not found/],
    ['/lesson/does-not-exist', /lesson was not found/],
    ['/lab/does-not-exist', /lab was not found/],
    ...d.modules.map((m): [string, RegExp] => [`/module/${m.id}`, new RegExp(m.title.replace(/[()/]/g, '.'))]),
    ...d.lessons.map((l): [string, RegExp] => [`/lesson/${l.id}`, /Exit check|Diagnostic questions/]),
    ...d.labs.map((l): [string, RegExp] => [`/lab/${l.id}`, /Check your understanding/]),
  ];
  for (const [path, re] of routes) {
    it(`renders ${path}`, () => {
      const html = render(path);
      expect(html.length).toBeGreaterThan(500);
      expect(has(html, re), `${path} should match ${re}`).toBe(true);
      expect(has(html, /Something went wrong on this page/)).toBe(false);
    });
  }
  it('marks preview modules honestly and never shows fake metrics', () => {
    const html = render('/module/C3');
    expect(has(html, /Preview module/)).toBe(true);
    expect(has(html, /not written yet/)).toBe(true);
    const dash = render('/');
    expect(has(dash, /0 of 4 completed/)).toBe(true);
    expect(has(dash, /Nothing is due/)).toBe(true);
    expect(has(dash, /D3.{0,200}Preview — lab only/)).toBe(true);
    expect(has(render('/module/D3'), /A simulator lab related to this module is available/)).toBe(true);
  });
  it('lesson pages contain rendered math and accessible structure', () => {
    const html = render('/lesson/b4-entanglement');
    expect(html).toContain('class="katex"');
    expect(html).toContain('<math'); // MathML for screen readers
    expect(has(html, /aria-live/)).toBe(true);
    expect(has(html, /Skip to main content/)).toBe(true);
    expect(has(html, /Local scripted tutor/)).toBe(true);
  });
});
