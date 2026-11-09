const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:4174/';
const L = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
  const page = await ctx.newPage();
  const add = async (t) => { const i = page.getByLabel('Adicionar item rapidamente'); await i.fill(t); await i.press('Enter'); await page.waitForTimeout(100); };
  const foco = () => page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'BODY'; return e.tagName + (e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : '') + (e.title ? `{title=${e.title}}` : '') + ' "' + (e.textContent || '').trim().slice(0, 25) + '"'; });
  await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1200);
  // tab order na tela de login
  L('== login: ordem de Tab');
  const ordem = []; for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); ordem.push(await foco()); } L('  ', ordem.join(' > '));
  await page.getByText('Usar sem conta neste aparelho').click(); await page.waitForTimeout(300);
  L('== onboarding: foco inicial', await foco());
  await page.keyboard.press('Tab'); L('   1o Tab:', await foco());
  await page.getByText('Pular').first().click(); await page.waitForTimeout(300);
  for (const t of ['tomate', 'leite']) await add(t);
  await page.evaluate(() => document.activeElement.blur());
  L('== lista: ordem de Tab (primeiros 14)');
  const o2 = []; for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); o2.push(await foco()); } L('  ', o2.join(' > '));
  // abas: setas
  await page.getByRole('button', { name: 'Nova lista' }).click(); await page.waitForTimeout(250);
  await page.getByLabel('Nome da lista').fill('Feira'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const tab1 = page.getByRole('tab', { name: 'Mercado' }); await tab1.focus();
  await page.keyboard.press('ArrowRight'); L('== tablist: foco após ArrowRight a partir de "Mercado":', await foco(), '| tabindex das abas:', await page.locator('[role=tab]').evaluateAll(els => els.map(e => e.tabIndex)));
  await page.getByRole('tab', { name: 'Mercado' }).click(); await page.waitForTimeout(200);
  // modal: foco e trap
  await page.getByRole('button', { name: /^Editar Tomate/ }).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  L('== modal editar: foco ao abrir:', await foco());
  const seq = []; for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); seq.push(await foco()); } L('   Tab x12 dentro do modal:', seq.join(' > '));
  const fora = await page.evaluate(() => { const m = document.querySelector('[role=dialog]'); return !m.contains(document.activeElement); });
  L('   foco escapou do modal?', fora);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  L('   após Esc, foco:', await foco(), '| modal aberto?', await page.locator('[role=dialog]').count());
  // aria-hidden / inert no fundo
  await page.getByTitle('Preços').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  L('== fundo com aria-hidden/inert quando modal abre?', await page.evaluate(() => ({ header: document.querySelector('header')?.closest('[aria-hidden],[inert]') ? 'sim' : 'nao', main: document.querySelector('main')?.closest('[aria-hidden],[inert]') ? 'sim' : 'nao' })));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // toast aria-live
  await page.getByRole('button', { name: /Compartilhar/ }).click(); await page.waitForTimeout(400);
  L('== toast:', await page.evaluate(() => { const t = document.querySelector('.toast'); return t ? { texto: t.textContent, role: t.getAttribute('role'), live: t.getAttribute('aria-live') } : 'sem toast (clipboard?)'; }));
  // alvos de toque
  const pequenos = await page.evaluate(() => [...document.querySelectorAll('button, a, input, select, [role=tab]')].map(e => { const r = e.getBoundingClientRect(); return { n: (e.getAttribute('aria-label') || e.title || e.textContent || e.id).trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.w && (x.w < 44 || x.h < 44)));
  const mapa = {}; pequenos.forEach(p => { const k = p.w + 'x' + p.h; (mapa[k] ??= new Set()).add(p.n.replace(/ .*/, '')); });
  L('== alvos < 44px (lista, desktop):'); Object.entries(mapa).forEach(([k, v]) => L('  ', k, [...v].slice(0, 5).join(', ')));
  L('   alvos < 24px:', pequenos.filter(p => p.w < 24 || p.h < 24));
  await browser.close();
})().catch((e) => { console.log('FALHA', e); process.exit(1); });
