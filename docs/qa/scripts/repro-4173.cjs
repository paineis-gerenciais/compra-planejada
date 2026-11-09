const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
  const page = await ctx.newPage();
  page.on('console', (m) => console.log('console', m.type(), m.text().slice(0, 160)));
  page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 200)));
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('tela inicial:', (await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' | '));
  const b = page.getByText('Usar sem conta neste aparelho');
  console.log('semConta count', await b.count());
  if (await b.count()) await b.click();
  await page.waitForTimeout(800);
  for (let i = 0; i < 5; i++) {
    const h2 = await page.locator('h2').first().innerText().catch(() => '(sem h2)');
    console.log('passo', i, h2);
    const p = page.getByRole('button', { name: /Próximo|Começar/ });
    console.log(' botao count', await p.count());
    if (!(await p.count())) break;
    await p.click();
    await page.waitForTimeout(400);
  }
  console.log('depois:', (await page.locator('body').innerText()).slice(0, 200).replace(/\n/g, ' | '));
  await browser.close();
})();
