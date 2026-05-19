const { chromium } = require('playwright');

(async()=>{
  const browser = await chromium.launch({ headless: true });

  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8080', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'qa-desktop-initial.jpg', type: 'jpeg', quality: 85 });

  await page.fill('#tickerInput', 'AAPL');
  await page.click('#btnDebate');
  await page.waitForSelector('#debateSection.show', { timeout: 120000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'qa-desktop-debating.jpg', type: 'jpeg', quality: 85 });

  await page.waitForSelector('#summarySection.show', { timeout: 180000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'qa-desktop-summary.jpg', type: 'jpeg', quality: 85, fullPage: true });

  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mctx.newPage();
  await mpage.goto('http://127.0.0.1:8080', { waitUntil: 'domcontentloaded' });
  await mpage.waitForTimeout(1200);
  await mpage.screenshot({ path: 'qa-mobile-initial.jpg', type: 'jpeg', quality: 85 });

  await browser.close();
  console.log('saved');
})();
