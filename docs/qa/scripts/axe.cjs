const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:4174/';
const AXE = require.resolve('axe-core');
const L = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
  const page = await ctx.newPage();
  const add = async (t) => { const i = page.getByLabel('Adicionar item rapidamente'); await i.fill(t); await i.press('Enter'); await page.waitForTimeout(100); };
  async function axe(nome) {
    await page.addScriptTag({ path: AXE }).catch(() => {});
    const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }));
    L(`\n### ${nome}: ${r.violations.length} violações, ${r.incomplete.length} incompletos, ${r.passes.length} passes`);
    for (const v of r.violations) {
      L(`- [${v.impact}] ${v.id} (${v.nodes.length} nós): ${v.help}`);
      L('    ex:', v.nodes.slice(0, 2).map((n) => n.target.join(' ') + ' :: ' + (n.any[0]?.message || n.all[0]?.message || n.none[0]?.message || '').slice(0, 140)).join(' || '));
    }
    for (const v of r.incomplete) L(`  ? incompleto ${v.id} (${v.nodes.length})`);
  }
  async function fechar() { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
  await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
  await axe('login');
  await page.getByText('Usar sem conta neste aparelho').click(); await page.waitForTimeout(400);
  await axe('onboarding');
  await page.getByText('Pular').first().click(); await page.waitForTimeout(400);
  await axe('lista vazia');
  for (const t of ['2kg tomate', 'leite 2 un', 'arroz 5kg', 'pão 12']) await add(t);
  await page.getByRole('button', { name: /^Editar Arroz/ }).click(); await page.waitForTimeout(150);
  await page.locator('#eiPreco').fill('28,90'); await page.getByRole('button', { name: 'Salvar' }).click(); await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Marcar como comprado: Leite' }).click(); await page.waitForTimeout(150);
  await axe('lista com itens');
  await page.getByRole('button', { name: /^Editar Pão/ }).click(); await page.waitForTimeout(200);
  await axe('modal editar item');
  await fechar();
  await page.getByRole('button', { name: /Modo compra/ }).click(); await page.waitForTimeout(400);
  await axe('modo compra');
  await page.getByRole('button', { name: /Finalizar/ }).last().click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Apenas finalizar' }).click().catch(()=>{}); await page.waitForTimeout(250);
  await axe('checkout');
  await page.locator('#ckTotal').fill('50,00');
  await page.getByRole('button', { name: 'Salvar e finalizar' }).click(); await page.waitForTimeout(400);
  await page.getByTitle('Preços').click(); await page.waitForTimeout(250);
  await axe('preços');
  await fechar();
  await page.getByTitle('Histórico').click(); await page.waitForTimeout(250);
  await axe('histórico');
  await fechar();
  await page.getByTitle('Insights').click(); await page.waitForTimeout(250);
  await axe('insights');
  await fechar();
  await page.getByRole('button', { name: 'Nova lista' }).click(); await page.waitForTimeout(250);
  await axe('nova lista');
  await fechar();
  await page.evaluate(() => { document.documentElement.dataset.tema = 'escuro'; }); await page.waitForTimeout(200);
  await axe('lista (tema escuro)');
  await browser.close();
})().catch((e) => { console.log('FALHA', e); process.exit(1); });
