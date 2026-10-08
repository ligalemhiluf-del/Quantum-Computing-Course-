// Browser smoke test (optional): drives the built app in headless Chromium and fails on console errors.
// Usage:  npm run build && npx vite preview --port 4173 &   then   NODE_PATH=<dir containing playwright> node scripts/smoke.mjs [outDir]
// Requires Playwright to be resolvable (it is not a dependency of this project).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
const OUT = process.argv[2] ?? '/tmp/smoke';
mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
const go = async (hash) => { await page.goto(`${BASE}#${hash}`); await page.waitForSelector('h1'); };

// 1. all routes render
const routes = ['/', '/curriculum', '/curriculum?view=graph', '/module/B2', '/module/D3', '/module/C3', '/labs', '/review', '/tutor', '/research', '/settings', '/conventions', '/nope',
  '/lesson/a0-diagnostic', '/lesson/a1-linear-algebra', '/lesson/a2-tensor-products', '/lesson/b1-qubits-bloch', '/lesson/b2-measurement', '/lesson/b3-gates', '/lesson/b4-entanglement', '/lesson/b5-density', '/lesson/b6-noise',
  '/lab/lab-bloch', '/lab/lab-bell', '/lab/lab-noise', '/lab/lab-physics'];
for (const r of routes) {
  const before = errors.length;
  await go(r);
  await page.waitForTimeout(150);
  const h1 = await page.locator('h1').first().innerText();
  check(`route ${r}`, h1.length > 0 && errors.length === before, h1 + (errors.length > before ? ' ' + errors.slice(before).join(' | ') : ''));
  const katexErrors = await page.locator('.katex-error').count();
  if (katexErrors) check(`no KaTeX errors on ${r}`, false, `${katexErrors} errors`);
}
await go('/lesson/b4-entanglement'); await page.screenshot({ path: `${OUT}/lesson-b4.png`, fullPage: false });
await go('/curriculum?view=graph'); await page.screenshot({ path: `${OUT}/graph.png`, fullPage: true });

// 2. keyboard: first Tab lands on the skip link
await go('/');
await page.reload(); await page.waitForSelector('h1'); // a fresh load, not an in-app navigation
await page.keyboard.press('Tab');
check('first Tab focuses the skip link', (await page.evaluate(() => document.activeElement?.className)) === 'skip');

// 3. diagnostic flow, feedback, hints, persistence
await go('/lesson/a0-diagnostic');
await page.locator('#act-a0-q1 input[type=text]').fill('2');
await page.locator('#act-a0-q1').getByRole('button', { name: 'Check answer' }).click();
check('numeric correct feedback', await page.locator('#act-a0-q1').getByText('✓ Correct').isVisible());
await page.locator('#act-a0-q4 input[type=text]').fill('0.5');
await page.locator('#act-a0-q4').getByRole('button', { name: 'Check answer' }).click();
check('misconception-specific numeric feedback', await page.locator('#act-a0-q4').getByText('probability for a single coin').isVisible());
await page.locator('#act-a0-q4').getByRole('button', { name: 'Give me a hint' }).click();
check('hint ladder shows hint 1', await page.locator('#act-a0-q4').getByText('Hint 1:').isVisible());
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('qtutor.progress.v1')));
check('progress persisted to localStorage', stored.schemaVersion === 1 && stored.activities['a0-q1'].attempts.length === 1 && stored.activities['a0-q4'].attempts[0].hintLevel === 0);
await page.reload(); await page.waitForSelector('h1');
check('progress survives reload (attempt note visible)', await page.locator('#act-a0-q1').getByText('Your record on this item: 1 attempt').isVisible());

// 4. tutor panel: staged hints and honest labelling
await page.locator('#act-a0-q3').getByRole('button', { name: 'Ask the tutor about this item' }).click();
await page.getByRole('button', { name: 'Hint', exact: true }).click();
await page.waitForSelector('.msg.tutor');
check('tutor labels itself local scripted', await page.locator('.msg.tutor .meta').first().innerText().then((t) => /Local scripted tutor/.test(t)));
check('tutor hint level 1 reply', await page.locator('.msg.tutor').first().innerText().then((t) => /Hint 1\/3/.test(t)));
await page.getByRole('button', { name: 'Hint', exact: true }).click();
await page.waitForFunction(() => document.querySelectorAll('.msg.tutor').length >= 2);
check('tutor escalates to hint 2', await page.locator('.msg.tutor').nth(1).innerText().then((t) => /Hint 2\/3/.test(t)));
check('card shows tutor-given hints too', await page.locator('#act-a0-q3').getByText('Hint 2:').isVisible());
await page.locator('textarea[id^=ask-]').fill('I think global phase is observable by interference');
await page.getByRole('button', { name: 'Ask', exact: true }).click();
await page.waitForFunction(() => document.querySelectorAll('.msg.tutor').length >= 3);
check('misconception diagnosed in free text', await page.locator('.msg.tutor').nth(2).innerText().then((t) => /cancels in every probability/.test(t) && /Your turn/.test(t)));
await page.getByRole('button', { name: 'Clear conversation' }).click();
check('clear conversation works', (await page.locator('.msg').count()) === 0);
await page.screenshot({ path: `${OUT}/diagnostic-tutor.png` });

// 5. circuit + code activities
await go('/lesson/b4-entanglement');
const circ = page.locator('#act-b4-p1');
await circ.locator('select').nth(0).selectOption('H'); await circ.getByRole('button', { name: 'Add gate' }).click();
await circ.locator('select').nth(0).selectOption('CNOT'); await circ.locator('select').nth(1).selectOption('0'); await circ.locator('select').nth(2).selectOption('1'); await circ.getByRole('button', { name: 'Add gate' }).click();
await circ.getByRole('button', { name: 'Check answer' }).click();
check('circuit activity graded correct (Bell state)', await circ.getByText('✓ Correct').isVisible());
await go('/lesson/b3-gates');
const codeBox = page.locator('#act-b3-p6 textarea.codearea');
await page.locator('#act-b3-p6').getByRole('button', { name: 'Run tests' }).click();
await page.waitForSelector('#act-b3-p6 .callout.bad');
check('starter code fails tests in the Web Worker', await page.locator('#act-b3-p6').getByText('✗ Not yet').isVisible());
await codeBox.fill('function solve(theta) {\n  const out = Q.apply(Q.ry(theta), Q.ket("0"));\n  return Q.probabilities(out)[1];\n}');
await page.locator('#act-b3-p6').getByRole('button', { name: 'Run tests' }).click();
await page.waitForSelector('#act-b3-p6 .callout.ok');
check('correct code passes all tests', await page.locator('#act-b3-p6').getByText('✓ Correct').isVisible());
await codeBox.fill('function solve(t){ while(true){} }');
await page.locator('#act-b3-p6').getByRole('button', { name: 'Run tests' }).click();
await page.waitForSelector('#act-b3-p6 .callout.bad:has-text("stopped")', { timeout: 8000 });
check('infinite loop is stopped by the worker timeout', true);

// 6. labs
await go('/lab/lab-bloch');
await page.locator('#bl-theta').fill('90'); await page.locator('#bl-phi').fill('90');
check('Bloch lab: +y state gives <Y>=1', (await page.locator('.stat').allInnerTexts()).some((t) => /y = ⟨Y⟩\s*1\.000/.test(t)));
await page.screenshot({ path: `${OUT}/lab-bloch.png`, fullPage: true });
await go('/lab/lab-bell');
await page.getByRole('button', { name: 'Sample' }).click();
check('Bell lab: sampled counts shown', await page.locator('text=Joint counts (Z basis)').isVisible());
check('Bell lab: CHSH ≈ 2.828 shown', await page.locator('text=2.828').first().isVisible());
await page.getByRole('button', { name: 'Save this run to my lab record' }).click();
await page.screenshot({ path: `${OUT}/lab-bell.png`, fullPage: true });
await go('/lab/lab-noise'); await page.screenshot({ path: `${OUT}/lab-noise.png`, fullPage: true });
check('Noise lab renders chart', (await page.locator('svg.chart').count()) === 1);
await go('/lab/lab-physics');
check('Physics lab: slope text present', await page.locator('text=Fitted log-log slopes').isVisible());
await page.screenshot({ path: `${OUT}/lab-physics.png`, fullPage: true });

// 7. export / import / reset
await go('/settings');
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export progress (JSON)' }).click()]);
const path = `${OUT}/export.json`; await dl.saveAs(path);
const exported = JSON.parse(readFileSync(path, 'utf8'));
check('export has schema version and data', exported.schemaVersion === 1 && Object.keys(exported.activities).length > 3);
await page.getByRole('button', { name: 'Reset learning data…' }).click();
await page.getByRole('button', { name: 'Yes, delete' }).click();
check('reset clears attempts', (await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('qtutor.progress.v1')).activities).length)) === 0);
await page.setInputFiles('#imp', path);
await page.waitForSelector('text=Imported successfully');
check('import restores attempts', (await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('qtutor.progress.v1')).activities).length)) > 3);
writeFileSync(`${OUT}/bad.json`, '{"schemaVersion": 1, "learnerId": "nope"}');
await page.setInputFiles('#imp', `${OUT}/bad.json`);
await page.waitForSelector('text=Import rejected');
check('malformed import rejected with message', true);
await page.screenshot({ path: `${OUT}/settings.png` });

// 8. mobile layout: no horizontal scroll, tutor collapsible
const m = await browser.newContext({ viewport: { width: 375, height: 800 } });
const mp = await m.newPage();
mp.on('pageerror', (e) => errors.push(`mobile pageerror: ${e.message}`));
for (const r of ['/', '/curriculum', '/lesson/b4-entanglement', '/lab/lab-bell', '/lab/lab-physics', '/module/B2', '/review', '/research', '/settings', '/tutor']) {
  await mp.goto(`${BASE}#${r}`); await mp.waitForSelector('h1'); await mp.waitForTimeout(100);
  const over = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`mobile ${r}: no horizontal page scroll`, over <= 1, `overflow ${over}px`);
}
await mp.goto(`${BASE}#/lesson/b4-entanglement`); await mp.waitForSelector('h1');
await mp.screenshot({ path: `${OUT}/mobile-lesson.png` });
const toggle = mp.getByRole('button', { name: /Collapse|Open tutor/ });
check('tutor panel collapsible on mobile', (await toggle.count()) === 1);

check('no console or page errors during the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
