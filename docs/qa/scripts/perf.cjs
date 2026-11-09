const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:4174/';
(async () => {
  const browser = await chromium.launch();
  const res = [];
  for (let i = 0; i < 6; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__lcp = 0; window.__long = 0; window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long += e.duration; }).observe({ type: 'longtask', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    let bytes = 0, reqs = 0;
    page.on('response', async (r) => { reqs++; const h = r.headers(); bytes += Number(h['content-length'] || 0); });
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'load' });
    await page.getByText('Usar sem conta neste aparelho').waitFor();
    const tInter = Date.now() - t0;
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
      return { ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, fcp, lcp: window.__lcp, long: window.__long, cls: window.__cls, transfer: performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || 0), 0), recursos: performance.getEntriesByType('resource').length };
    });
    res.push({ ...m, tInter });
    await ctx.close();
  }
  const med = (k) => { const v = res.map(r => r[k]).filter(x => x != null).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  for (const k of ['ttfb', 'fcp', 'lcp', 'dcl', 'load', 'tInter', 'long', 'cls', 'transfer', 'recursos']) console.log(k.padEnd(9), 'mediana', Number(med(k)).toFixed(k === 'cls' ? 3 : 0), '| min', Math.min(...res.map(r => r[k] ?? 1e9)).toFixed(0), '| max', Math.max(...res.map(r => r[k] ?? 0)).toFixed(0));
  await browser.close();
})();
