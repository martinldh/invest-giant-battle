const { chromium } = require('playwright');

(async () => {
  const base = 'https://invest-giant-frontend.onrender.com';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  const t0 = Date.now();
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const tDom = Date.now();
  await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {});
  const tIdle = Date.now();

  await page.waitForSelector('#backendStatus', { timeout: 30000 });
  const backendStatus = (await page.locator('#backendStatus').innerText()).trim();

  const healthProbe = await page.evaluate(async () => {
    const s = performance.now();
    try {
      const r = await fetch('https://invest-giant-battle.onrender.com/api/health');
      const txt = await r.text();
      return { ok: r.ok, status: r.status, ms: Math.round(performance.now() - s), len: txt.length };
    } catch (e) {
      return { ok: false, error: String(e), ms: Math.round(performance.now() - s) };
    }
  });

  const debate = await page.evaluate(async () => {
    const s = performance.now();
    try {
      const r = await fetch('https://invest-giant-battle.onrender.com/api/debate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker: 'AAPL' })
      });
      if (!r.body) return { ok: false, status: r.status, ms: Math.round(performance.now() - s), noBody: true };
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let firstEventMs = null;
      let doneMs = null;
      let masterCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) { doneMs = Math.round(performance.now() - s); break; }
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          if (firstEventMs == null) firstEventMs = Math.round(performance.now() - s);
          try {
            const e = JSON.parse(line);
            if (e.type === 'master_opinion') masterCount++;
          } catch {}
        }
      }
      return { ok: r.ok, status: r.status, firstEventMs, doneMs, masterCount };
    } catch (e) {
      return { ok: false, error: String(e), ms: Math.round(performance.now() - s) };
    }
  });

  console.log(JSON.stringify({
    domMs: tDom - t0,
    idleMs: tIdle - t0,
    backendStatus,
    healthProbe,
    debate
  }, null, 2));

  await browser.close();
})();
