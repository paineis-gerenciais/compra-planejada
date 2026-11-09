import { extrairItens, taxaDeAcerto } from '../../../src/lib/domain/receipt-parse';
// DADOS FICTÍCIOS: linhas escritas pelo analista para provocar classes de erro; NÃO medem acurácia.
const casos: Array<{ linha: string; nome: string; qty: string; unit: number; total: number }> = [
  { linha: 'ARROZ TIPO 1 5KG      1 UN X   24,90         24,90', nome: 'arroz', qty: '1', unit: 24.9, total: 24.9 },
  { linha: 'LEITE INTEGRAL 1L     6 UN X    5,29         31,74', nome: 'leite', qty: '6', unit: 5.29, total: 31.74 },
  { linha: 'BANANA PRATA KG   1,250 KG X    5,99          7,49', nome: 'banana', qty: '1.25', unit: 5.99, total: 7.49 },
  { linha: 'TOMATE 500G                                    6,99', nome: 'tomate', qty: '1', unit: 6.99, total: 6.99 },
  { linha: 'SUCO UVA CAIXA 1L     2 UN X    4,50          9,00', nome: 'suco', qty: '2', unit: 4.5, total: 9 },
  { linha: '001 7891000100103 LEITE CONDENSADO  1 UN X 6,49   6,49', nome: 'leite condensado', qty: '1', unit: 6.49, total: 6.49 },
  { linha: 'PAO FRANCES                                    8,90', nome: 'pao', qty: '1', unit: 8.9, total: 8.9 },
  { linha: 'REFRIGERANTE COLA 2L  3 UN X    9,99         29,97', nome: 'refrigerante', qty: '3', unit: 9.99, total: 29.97 },
  { linha: 'OVOS BRANCOS 12 UN    1 UN X   14,90         14,90', nome: 'ovos', qty: '1', unit: 14.9, total: 14.9 },
  { linha: 'QUEIJO MUSSARELA  0,350 KG X   69,90         24,47', nome: 'queijo', qty: '0.35', unit: 69.9, total: 24.47 },
];
let nomeOk = 0, qtyOk = 0, uOk = 0, tOk = 0, n = 0;
for (const c of casos) {
  const r = extrairItens('MERCADO TESTE\n' + c.linha + '\n');
  const it = r.itens[0];
  const ok = (b: boolean) => (b ? 'ok' : 'ERRO');
  const nm = !!it && it.nome.toLowerCase().includes(c.nome);
  const q = !!it && Number(it.qty) === Number(c.qty);
  const u = !!it && it.unitPrice === c.unit; const t = !!it && it.totalLinha === c.total;
  n++; nomeOk += +nm; qtyOk += +q; uOk += +u; tOk += +t;
  console.log(c.linha.slice(0, 30).padEnd(31), '| itens:', r.itens.length, '| nome', ok(nm), JSON.stringify(it?.nome), '| qty', ok(q), it?.qty, '| unit', ok(u), it?.unitPrice, '| total', ok(t), it?.totalLinha, '|', it?.confianca);
}
console.log(`campo a campo (10 linhas fictícias): nome ${nomeOk}/${n}  qty ${qtyOk}/${n}  preço unit ${uOk}/${n}  total ${tOk}/${n}`);
// item em duas linhas
const duas = 'MERCADO TESTE\n001 7891000100103 LEITE INTEGRAL 1L\n          6 UN X 5,29      31,74\n';
console.log('duas linhas ->', JSON.stringify(extrairItens(duas).itens.map(i => [i.nome, i.qty, i.unitPrice, i.confianca])));
// métrica taxaDeAcerto: sem precisão, substring
const lixo = 'MERCADO TESTE\nLEITE CONDENSADO 1 UN X 6,49 6,49\n' + Array.from({ length: 10 }, (_, i) => `RUIDO ABC${i} 1,00 2,00`).join('\n');
const rr = extrairItens(lixo);
console.log('esperado [leite]; extraidos', rr.itens.length, 'itens (1 certo-ish + 10 lixo); taxaDeAcerto =', taxaDeAcerto(rr.itens, ['leite']));
console.log('esperado [leite integral]; extraído "leite condensado":', taxaDeAcerto(extrairItens('X\nLEITE CONDENSADO 1 UN X 6,49 6,49').itens, ['leite integral']), ' | esperado [leite]:', taxaDeAcerto(extrairItens('X\nLEITE CONDENSADO 1 UN X 6,49 6,49').itens, ['leite']));
// granularidade: cupom do teste tem 4 itens esperados
console.log('granularidade com 4 itens: 3/4 =', 3/4, '; 4/4 = 1');
// loja e data
const d = extrairItens('SUPERMERCADO EXTRA LTDA\nData: 12/07/2026\nARROZ 1 UN X 2,00 2,00');
console.log('data ->', new Date(d.data!).toString());
