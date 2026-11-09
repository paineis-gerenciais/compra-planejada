import { parseQuickItem } from '../../../src/lib/domain/parse';
import { normalizeName } from '../../../src/lib/domain/categorize';
import { precosDaCompra, resumoDePreco } from '../../../src/lib/domain/prices';
import { novoItem, totalEstimado } from '../../../src/lib/domain/items';
const owner = { kind: 'user', id: 'u' } as const;
for (const t of ['2kg tomate', 'tomate 500 g', 'tomate', 'tomates', 'Tomate 1,5kg', '1,5 kg de tomate', 'arroz 5kg', 'leite 1L', '6 leite', 'Tomate-cereja', '500g queijo']) {
  const p = parseQuickItem(t);
  console.log(JSON.stringify(t).padEnd(20), '->', JSON.stringify(p), 'key=', JSON.stringify(normalizeName(p.name)));
}
// mesma chave, unidades distintas
const itens = [
  novoItem('l', { name: 'Tomate', qty: '2', unit: 'kg', price: 9, bought: true }),
  novoItem('l', { name: 'Tomate', qty: '500', unit: 'g', price: 0.009, bought: true }),
  novoItem('l', { name: 'Tomate', qty: '1', unit: 'un', price: 1.5, bought: true }),
];
const es = precosDaCompra(itens, owner, 'X', Date.now(), 'p1');
console.log(es.map(e => [e.key, e.unitPrice, e.unit].join('|')));
const r = resumoDePreco(es, 'Tomate')!;
console.log('menor', r.menor, 'maior', r.maior, 'variacao', r.variacao, 'unit exibida', r.unit);
// totalEstimado com vírgula na qty e preço
console.log('totalEstimado qty "1,5" x 10 =', totalEstimado([{ price: 10, qty: '1,5' }]));
console.log('totalEstimado 500 g x R$6 (preço/kg digitado) =', totalEstimado([{ price: 6, qty: '500' }]));
// parse de valor digitado no checkout / editar item
for (const s of ['1.234,56', '1234,56', '85,90', '1.234', '1,234.56']) console.log('parseFloat(replace) ', s, '->', parseFloat(s.replace(',', '.')));
