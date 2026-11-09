const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:4174/';
const OUT = __dirname + '/cap';
const L = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch();
  for (const w of [320, 390, 768, 1280]) {
    const h = w >= 768 ? 1024 : 700;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'pt-BR', isMobile: w < 768, hasTouch: w < 768, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const add = async (t) => { const i = page.getByLabel('Adicionar item rapidamente'); await i.fill(t); await i.press('Enter'); await page.waitForTimeout(80); };
    const over = async (nome) => {
      const r = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const bad = [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > W + 1 || b.left < -1) && !e.closest('.abas') && getComputedStyle(e).position !== 'fixed' || false; }).slice(0, 4).map(e => (e.className?.toString().split(' ')[0] || e.tagName) + ':' + Math.round(e.getBoundingClientRect().right));
        return { sw: document.documentElement.scrollWidth, cw: W, bad };
      });
      L(`  w=${w} ${nome}: scrollWidth=${r.sw} clientWidth=${r.cw} ${r.sw > r.cw ? 'ROLAGEM HORIZONTAL' : 'ok'} ${r.bad.length ? 'fora: ' + r.bad.join(',') : ''}`);
    };
    await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1000);
    await over('login');
    if (w === 320 || w === 768) await page.screenshot({ path: `${OUT}/r${w}-01-login.png` });
    await page.getByText('Usar sem conta neste aparelho').click(); await page.waitForTimeout(300);
    await over('onboarding');
    await page.getByText('Pular').first().click(); await page.waitForTimeout(300);
    for (const t of ['2kg tomate muito grande para testar quebra de linha em nome longo de produto', 'leite 2 un', 'arroz 5kg', 'pão 12']) await add(t);
    await page.getByRole('button', { name: /^Editar Arroz/ }).click(); await page.waitForTimeout(150);
    await page.locator('#eiPreco').fill('28,90'); await page.getByRole('button', { name: 'Salvar' }).click(); await page.waitForTimeout(150);
    for (const n of ['Feira da semana com nome bem comprido', 'Churrasco']) { await page.getByRole('button', { name: 'Nova lista' }).click(); await page.waitForTimeout(150); await page.getByLabel('Nome da lista').fill(n); await page.keyboard.press('Enter'); await page.waitForTimeout(150); }
    await page.getByRole('tab', { name: 'Mercado' }).click(); await page.waitForTimeout(200);
    await over('lista com itens');
    if (w === 320 || w === 768) await page.screenshot({ path: `${OUT}/r${w}-02-lista.png` });
    await page.getByRole('button', { name: /Modo compra/ }).click(); await page.waitForTimeout(400);
    await over('modo compra');
    if (w === 320 || w === 768) await page.screenshot({ path: `${OUT}/r${w}-03-modo-compra.png` });
    await page.getByRole('button', { name: /Finalizar/ }).last().click(); await page.waitForTimeout(250);
    if (w === 320 || w === 768) await page.screenshot({ path: `${OUT}/r${w}-04-pendentes.png` });
    await page.getByRole('button', { name: 'Apenas finalizar' }).click(); await page.waitForTimeout(250);
    await over('checkout');
    if (w === 320 || w === 768) await page.screenshot({ path: `${OUT}/r${w}-05-checkout.png` });
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.log('FALHA', e); process.exit(1); });
