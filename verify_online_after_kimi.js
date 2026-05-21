const { chromium } = require('playwright');

(async () => {
  const front = 'https://invest-giant-frontend.onrender.com';
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();

  const t0 = Date.now();
  await page.goto(front, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1200);

  const inputLogoVisible = await page.locator('#inputLogoPreview img').count();

  await page.fill('#tickerInput', 'AAPL');
  await page.click('#btnDebate');

  const streamStart = Date.now();
  await page.waitForSelector('#debateSection.show', { timeout: 180000 });
  const firstCardAt = Date.now();

  await page.waitForSelector('#stockInfoBar.show .stock-logo', { timeout: 120000 }).catch(() => {});
  const stockLogoCount = await page.locator('#stockInfoBar .stock-logo').count();

  await page.waitForSelector('#summarySection.show', { timeout: 300000 });
  const doneAt = Date.now();

  console.log(JSON.stringify({
    pageDomMs: streamStart - t0,
    inputLogoVisible,
    firstCardMs: firstCardAt - streamStart,
    fullDebateMs: doneAt - streamStart,
    stockLogoCount
  }, null, 2));

  await browser.close();
})();
