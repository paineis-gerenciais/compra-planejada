const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:4174/';
const OUT = __dirname + '/cap';
const L = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.push('pageerror ' + String(e).slice(0, 200)));
  const grupos = async () => page.evaluate(() => [...document.querySelectorAll('article.recibo section.grupo')].map(s => s.querySelector('h3')?.textContent + ' => ' + [...s.querySelectorAll('.linha')].map(l => l.querySelector('.nome')?.textContent + ' [' + l.querySelector('.qtd')?.textContent + ']').join(' | ')));
  const add = async (t) => { const i = page.getByLabel('Adicionar item rapidamente'); await i.fill(t); await i.press('Enter'); await page.waitForTimeout(120); };
  const abas = async () => (await page.locator('[role=tab]').allInnerTexts()).join(' | ') + '  ativa=' + await page.locator('[role=tab][aria-selected=true]').innerText().catch(() => '-');
  // A) atalho do manifest
  await page.goto(URL + '?acao=nova-lista', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.getByText('Usar sem conta neste aparelho').click(); await page.waitForTimeout(400);
  await page.getByText('Pular').first().click(); await page.waitForTimeout(400);
  L('== ?acao=nova-lista: diálogo aberto?', await page.locator('[role=dialog]').count(), '| url', page.url());
  // B) arrastar com toque (CDP)
  for (const t of ['Arroz', 'Feijão', 'Macarrão']) await add(t);
  L('== antes do arrasto:', (await grupos()).join(' // '));
  const cdp = await ctx.newCDPSession(page);
  const h = page.getByRole('button', { name: 'Arrastar Arroz para reordenar' });
  const b = await h.boundingBox();
  const alvo = await page.getByRole('button', { name: 'Arrastar Macarrão para reordenar' }).boundingBox();
  const x = b.x + b.width / 2, y0 = b.y + b.height / 2, y1 = alvo.y + alvo.height + 6;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let s = 1; s <= 8; s++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * s / 8 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
  L('== depois do arrasto por toque (Arroz -> fim):', (await grupos()).join(' // '));
  L('   scrollY', await page.evaluate(() => scrollY));
  // C) finalizar segunda vez com pendentes -> nome
  await page.getByRole('button', { name: /Finalizar compra/ }).click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Criar lista com os pendentes' }).click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Pular' }).click(); await page.waitForTimeout(400);
  L('== 1a finalização:', await abas());
  await page.getByRole('button', { name: /Finalizar compra/ }).click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Criar lista com os pendentes' }).click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Pular' }).click(); await page.waitForTimeout(400);
  L('== 2a finalização:', await abas());
  // D) finalizar lista vazia / sem nada comprado
  await page.getByRole('button', { name: /Finalizar compra/ }).click(); await page.waitForTimeout(250);
  L('   modal com pendentes, botoes:', await page.locator('.rodape button').allInnerTexts());
  await page.getByRole('button', { name: 'Apenas finalizar' }).click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Pular' }).click(); await page.waitForTimeout(400);
  L('== finalizar tudo sem comprar nada, "Apenas finalizar" -> abas:', await abas(), '| corpo:', (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 120));
  // histórico: compra sem total
  await page.getByTitle('Histórico').click(); await page.waitForTimeout(250);
  L('   histórico:', (await page.locator('[role=dialog]').innerText()).replace(/\s+/g, ' '));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // E) lista recorrente
  await page.getByRole('button', { name: 'Nova lista' }).click(); await page.waitForTimeout(250);
  await page.getByLabel('Nome da lista').fill('Feira'); 
  await page.getByLabel('Lista recorrente').check().catch(async () => { await page.getByText('Lista recorrente').click(); });
  await page.getByRole('button', { name: 'Criar lista' }).click(); await page.waitForTimeout(300);
  L('== nova lista Feira (recorrente):', await abas());
  for (const t of ['banana 1 dz', 'maçã 1kg']) await add(t);
  await page.getByRole('button', { name: 'Marcar como comprado: Banana' }).click(); await page.waitForTimeout(150);
  await page.getByRole('button', { name: /Finalizar compra/ }).click(); await page.waitForTimeout(300);
  L('   recorrente + pendente -> modal direto:', await page.locator('[role=dialog] h2').innerText());
  await page.getByRole('button', { name: 'Pular' }).click(); await page.waitForTimeout(400);
  L('== após finalizar recorrente:', await abas());
  L('   ', (await grupos()).join(' // '), '| meta:', await page.locator('.meta').innerText());
  // F) reload perde dados
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
  L('== após reload:', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 140));
  await page.getByText('Usar sem conta neste aparelho').click().catch(()=>{}); await page.waitForTimeout(500);
  L('   abas após reload:', await abas().catch(() => '-'), '| localStorage keys:', await page.evaluate(() => Object.keys(localStorage)));
  // G) sair da conta no modo sem conta
  await page.getByRole('button', { name: 'Sua conta' }).click(); await page.waitForTimeout(250);
  L('== modal conta botões:', await page.locator('[role=dialog] button').allInnerTexts());
  const sair = page.getByRole('button', { name: /Sair|Entrar/ }).first();
  await add('Teste persistência').catch(()=>{});
  L('   (add com modal aberto não aplicável)');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await add('item antes de sair');
  await page.getByRole('button', { name: 'Sua conta' }).click(); await page.waitForTimeout(250);
  await page.locator('[role=dialog] button').filter({ hasText: /Sair|Entrar|conta/i }).first().click().catch(e => L('   erro clique sair', String(e).slice(0,100))); await page.waitForTimeout(500);
  L('   após "sair" no modo sem conta:', (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 100));
  await page.getByText('Usar sem conta neste aparelho').click().catch(()=>{}); await page.waitForTimeout(500);
  L('   reentrando sem conta: abas', await abas().catch(()=>'-'), '|', (await grupos()).join(' // '));
  L('   erros:', JSON.stringify(errs));
  await browser.close();
})().catch((e) => { console.log('FALHA', e); process.exit(1); });
