#!/usr/bin/env node
// Check a built guide in headless Chrome: every page × widths × light/dark.
// Reports console errors, horizontal overflow, network requests, and diagrams
// that do not open their details panel. Optional screenshots.
//
//   node check.mjs GUIDE.html [--shots DIR] [--widths 1440,375,320]
//
// Needs Node 22+ (global WebSocket) and Google Chrome (or CHROME=/path/to/chrome).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--') && !/^\d/.test(a) && args[args.indexOf(a) - 1] !== '--shots');
if (!file) { console.error('usage: node check.mjs GUIDE.html [--shots DIR] [--widths 1440,375,320]'); process.exit(2); }
const opt = k => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
const shots = opt('--shots'); const widths = (opt('--widths') || '1440,375,320').split(',').map(Number);
if (shots) fs.mkdirSync(shots, { recursive: true });
const URL0 = 'file://' + path.resolve(file);
const CHROME = process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
const port = 9400 + Math.floor(Math.random() * 400);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'bro-check-'));
const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver; for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
if (!ver) { console.error('Chrome did not start. Set CHROME=/path/to/chrome.'); ch.kill(); process.exit(2); }
const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); let logs = []; const net = new Set();
ws.onmessage = m => { const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) logs.push(d.params.type + ': ' + d.params.args.map(a => a.value ?? a.description).join(' '));
  else if (d.method === 'Runtime.exceptionThrown') logs.push('exception: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  else if (d.method === 'Log.entryAdded' && d.params.entry.level !== 'info' && d.params.entry.level !== 'verbose') logs.push('log ' + d.params.entry.level + ': ' + d.params.entry.text);
  else if (d.method === 'Network.requestWillBeSent') { const u = d.params.request.url; if (!/^(data|file|about|blob):/.test(u)) net.add(u); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed'); return r.result.result.value; };
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable');

const problems = []; let checks = 0;
await send('Page.navigate', { url: URL0 }); await sleep(800);
const pages = await ev('FLAT.slice()');
for (const scheme of ['light', 'dark']) for (const w of widths) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w > 800 ? 900 : 780, deviceScaleFactor: 1, mobile: w < 800 });
  await ev(`localStorage.setItem('guide.theme', '${scheme}')`); /* guides open in light; dark is the reader's choice */
  for (const p of pages) {
    logs = []; checks++;
    await send("Page.navigate", { url: `${URL0}?r=${checks}#/${p}` }); await sleep(500); /* query forces a real reload: load-time errors are caught */
    const r = await ev(`(async () => {
      const over = document.documentElement.scrollWidth - innerWidth;
      const theme = document.documentElement.dataset.theme;
      const mr = document.querySelector('#main')?.getBoundingClientRect(); /* main includes its padding: small intentional bleeds are fine */
      const clipped = mr ? [...document.querySelectorAll('#main .page *')].filter(el => !el.closest('pre,.tbl-wrap,.dg,.otp,.sr') && el.getBoundingClientRect().right > mr.right + 1 && el.getBoundingClientRect().width > 0)
        .slice(0, 3).map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) : [];
      const dg = [];
      for (const root of document.querySelectorAll('#main .dg')) {
        const n = root.querySelector('.dg-n'); if (!n) { dg.push('diagram without nodes'); continue; }
        n.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 120)); n.click(); await new Promise(r => setTimeout(r, 250));
        const pn = root.querySelector('.dg-panel'); if (!pn || pn.hidden) dg.push('panel did not open for ' + n.dataset.id);
        root.querySelector('.pn-x')?.click();
      }
      for (const root of document.querySelectorAll('#main .dv')) {
        const it = [...root.querySelectorAll('.dv-item')].find(b => b.offsetParent); if (!it) { dg.push('panel diagram without visible items'); continue; }
        it.scrollIntoView({ block: 'center' }); it.click(); await new Promise(r => setTimeout(r, 200));
        const pn = root.querySelector('.dv-pn'); if (!pn || pn.hidden) dg.push('panel did not open for a ' + root.className.split(' ')[1]);
        pn?.querySelector('.pn-x')?.click();
      }
      window.scrollTo(0, 0);
      const h1 = document.querySelector('#main h1');
      return { over, theme, dg, h1: !!h1, clipped };
    })()`);
    const tag = `${p} @${w} ${scheme}`;
    if (r.over > 0) problems.push(`${tag}: horizontal overflow ${r.over}px`);
    if (r.clipped.length) problems.push(`${tag}: content wider than the page column (clipped): ${r.clipped.join(', ')}`);
    if (r.theme !== scheme) problems.push(`${tag}: theme is ${r.theme}, expected ${scheme}`);
    if (!r.h1) problems.push(`${tag}: page has no h1`);
    r.dg.forEach(x => problems.push(`${tag}: ${x}`));
    logs.forEach(x => problems.push(`${tag}: ${x}`));
    if (shots && (p === pages[0] || p === pages[1] || w === widths[0])) {
      await sleep(150); const s = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(shots, `${p}-${w}-${scheme}.png`), Buffer.from(s.result.data, 'base64'));
    }
  }
}
net.forEach(u => problems.push(`network request: ${u}`));
ch.kill(); await new Promise(r => { ch.once('exit', r); setTimeout(r, 3000); });
try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
console.log(`${pages.length} pages × ${widths.length} widths × 2 themes = ${checks} checks`);
if (problems.length) { console.log(`${problems.length} problem(s):`); problems.forEach(p => console.log('  - ' + p)); process.exit(1); }
console.log('OK: no console errors, no overflow, no network requests, every diagram opens its details.');
process.exit(0);
