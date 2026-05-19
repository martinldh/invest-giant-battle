const { chromium } = require('playwright');

(async()=>{
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:8080', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  results.push(['title', await page.title()]);
  results.push(['backendStatus', (await page.locator('#backendStatus').innerText()).trim()]);

  await page.click('.header-badge');
  await page.waitForTimeout(200);
  const sidebarOpen = await page.locator('#sidebar').evaluate(el => el.classList.contains('show'));
  await page.click('.sidebar-close');
  const sidebarClosed = !(await page.locator('#sidebar').evaluate(el => el.classList.contains('show')));
  results.push(['sidebarToggle', sidebarOpen && sidebarClosed]);

  await page.click(".quick-pick:text('MSFT')");
  results.push(['quickPickMSFT', await page.inputValue('#tickerInput')]);

  await page.fill('#tickerInput', '@@@@');
  await page.click('#btnDebate');
  await page.waitForTimeout(300);
  results.push(['invalidInputErrorVisible', await page.locator('#inputError').evaluate(el => el.classList.contains('show'))]);
  results.push(['invalidInputErrorText', (await page.locator('#inputError').innerText()).trim()]);

  await page.fill('#tickerInput', 'AAPL');
  await page.click('#btnDebate');
  await page.waitForSelector('#debateSection.show', { timeout: 120000 });
  await page.waitForSelector('#summarySection.show', { timeout: 180000 });

  results.push(['counts', JSON.stringify({
    bullish: await page.locator('#countBullish').innerText(),
    bearish: await page.locator('#countBearish').innerText(),
    neutral: await page.locator('#countNeutral').innerText(),
  })]);

  results.push(['summary', (await page.locator('#overallVerdict').innerText()).replace(/\s+/g,' ').trim().slice(0,120)]);

  await page.click('#resetSection .btn-reset');
  await page.waitForTimeout(300);
  results.push(['resetState', JSON.stringify({
    debateHidden: !(await page.locator('#debateSection').evaluate(el => el.classList.contains('show'))),
    summaryHidden: !(await page.locator('#summarySection').evaluate(el => el.classList.contains('show'))),
    stockInfoHidden: !(await page.locator('#stockInfoBar').evaluate(el => el.classList.contains('show'))),
  })]);

  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mctx.newPage();
  await mpage.goto('http://127.0.0.1:8080', { waitUntil: 'domcontentloaded' });
  await mpage.waitForTimeout(1200);
  results.push(['mobileMetrics', JSON.stringify(await mpage.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    canScrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  })))]);

  await browser.close();
  for (const [k,v] of results) console.log(`${k}: ${v}`);
})();
