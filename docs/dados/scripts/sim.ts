import { calcularInflacaoPessoal, preverRecompras, itensEmAtraso } from '../../../src/lib/domain/inflacao';
import type { PriceEntry } from '../../../src/lib/domain/types';
const owner = { kind: 'user', id: 'u' } as const;
const DIA = 86400000;
const agora = Date.UTC(2026, 10, 9);
// PRNG determinístico
let s = 12345; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
const e = (key: string, p: number, d: number, store: string | null = 'A', date?: number): PriceEntry => ({ id: key + d + rnd(), owner, key, displayName: key, store, unitPrice: p, unit: '', qty: '1', date: date ?? agora - d * DIA, source: 'manual', purchaseId: null });

// ---------- 1) Monte Carlo: inflação REAL = 0; ruído de loja e promoção ----------
function rodada(comprasPorMes: number, nItens: number, difLoja: number, promoProb: number, precoPreenchido: number, inflReal = 0) {
  const ent: PriceEntry[] = [];
  const freq = Array.from({ length: nItens }, () => 0.15 + 0.7 * rnd());
  const base = Array.from({ length: nItens }, () => 2 + 40 * rnd());
  const passo = 30 / comprasPorMes;
  for (let d = 0; d < 180; d += passo) {
    const dd = d + rnd() * 2;
    const nivel = Math.pow(1 + inflReal, (180 - dd) / 90 * 0 + (-dd / 90) * -1) ; // placeholder neutro
    for (let i = 0; i < nItens; i++) {
      if (rnd() > freq[i]! || rnd() > precoPreenchido) continue;
      const loja = rnd() < 0.5 ? 'A' : 'B';
      let p = base[i]! * (loja === 'B' ? 1 + difLoja : 1) * (1 + 0.01 * gauss());
      if (rnd() < promoProb) p *= 0.8;
      ent.push(e('i' + i, Math.round(p * 100) / 100, dd, loja));
    }
  }
  return calcularInflacaoPessoal(ent, agora, 90);
}
function dist(label: string, args: Parameters<typeof rodada>) {
  const R = 2000; const v: number[] = []; let nulos = 0; const nit: number[] = [];
  for (let k = 0; k < R; k++) { const r = rodada(...args); if (!r) { nulos++; continue; } v.push(r.variacaoPercentual); nit.push(r.itensConsiderados); }
  v.sort((a, b) => a - b);
  const q = (p: number) => v[Math.floor(p * (v.length - 1))]!;
  const sd = Math.sqrt(v.reduce((a, x) => a + (x - v.reduce((a, b) => a + b, 0) / v.length) ** 2, 0) / v.length);
  const fora2 = v.filter(x => Math.abs(x) > 2).length / v.length;
  const fora5 = v.filter(x => Math.abs(x) > 5).length / v.length;
  console.log(label.padEnd(58), `n=${v.length} nulos=${nulos} itens~${(nit.reduce((a,b)=>a+b,0)/nit.length).toFixed(1)} p5=${q(0.05).toFixed(1)} p50=${q(0.5).toFixed(1)} p95=${q(0.95).toFixed(1)} dp=${sd.toFixed(2)} |x|>2pp=${(fora2*100).toFixed(0)}% |x|>5pp=${(fora5*100).toFixed(0)}%`);
}
console.log('--- Dados fictícios: inflação real = 0%; o que o indicador mostra por ruído ---');
dist('4 compras/mes, 20 itens, loja fixa(dif 0), sem promo, 100% c/ preço', [4, 20, 0, 0, 1]);
dist('4 compras/mes, 20 itens, 2 lojas dif 8%, sem promo, 100% preço', [4, 20, 0.08, 0, 1]);
dist('4 compras/mes, 20 itens, 2 lojas dif 8%, promo 10% (-20%), 100%', [4, 20, 0.08, 0.1, 1]);
dist('4 compras/mes, 20 itens, 2 lojas 8%, promo 10%, 40% c/ preço', [4, 20, 0.08, 0.1, 0.4]);
dist('2 compras/mes, 10 itens, 2 lojas 8%, promo 10%, 40% c/ preço', [2, 10, 0.08, 0.1, 0.4]);

// ---------- 2) casos pontuais ----------
console.log('--- casos pontuais ---');
// item único: 1 registro em cada janela, loja diferente
let r = calcularInflacaoPessoal([e('cafe', 20, 10, 'A'), e('cafe', 10, 120, 'B')], agora, 90)!;
console.log('1 item, 1 registro por janela, lojas A/B (R$10 -> R$20):', r.variacaoPercentual, '% itens=', r.itensConsiderados);
// duplicata do mesmo dia (mesmo purchaseId e item duplicado) pesa 2x
r = calcularInflacaoPessoal([e('a', 11, 10), e('a', 11, 10), e('a', 10, 100), e('b', 10, 10), e('b', 20, 100)], agora, 90)!;
console.log('duplicata no item a (+10%) vs b (-50%):', r.variacaoPercentual);
// peso por frequência != peso por gasto: item barato frequente domina
r = calcularInflacaoPessoal([
  ...[5,15,25,35,45,55,65,75,85].map(d => e('pao', 1.2, d)), ...[95,105,115,125,135,145,155,165,175].map(d => e('pao', 1.0, d)),   // +20%
  e('carne', 30, 20), e('carne', 40, 100) ], agora, 90)!;       // carne -25% , gasto 30..40/compra
console.log('pao(+20%, 18 reg, R$1) x carne(-25%, 2 reg, R$30-40):', r.variacaoPercentual);
// ---------- 3) previsão de recompra ----------
console.log('--- previsão de recompra ---');
const datas = (arr: number[], k = 'x') => arr.map(d => e(k, 10, d));
let p = preverRecompras(datas([0, 7, 14, 21, 28]), agora)[0]!;
console.log('regular 7d:', p.intervaloMedioDias);
p = preverRecompras([...datas([60, 53, 46, 39, 32]), e('x', 10, 5)], agora)[0]!; // 5 compras semanais, pausa de 27 dias, uma compra recente
console.log('5 semanais + pausa 27d + compra recente: media=', p.intervaloMedioDias, 'dias');
const outl = preverRecompras(datas([100, 93, 86, 79, 72, 65, 58, 51, 44, 37, 30, 0]), agora)[0]!; // 11 intervalos de 7 e um de 30
const ints = [7,7,7,7,7,7,7,7,7,7,30]; const med = [...ints].sort((a,b)=>a-b)[5];
console.log('11 intervalos (10x7d + 1x30d): media usada=', outl.intervaloMedioDias, ' mediana=', med);
// identidade: média dos intervalos = (última - primeira)/(n-1)
p = preverRecompras(datas([100, 99, 98, 2]), agora)[0]!;
console.log('datas 100,99,98,2 d atrás: media=', p.intervaloMedioDias, '= (100-2)/3 =', (98/3).toFixed(1));
// duplicata no mesmo dia
const dup = preverRecompras([e('y',10,30), e('y',10,30), e('y',10,0)], agora)[0]!;
console.log('3 registros, 2 no mesmo dia (30 d e 0 d):', 'intervalo estimado=', dup?.intervaloMedioDias, '(real: 1 intervalo de 30)');
// item abandonado
const ab = preverRecompras([...datas([700, 693, 686], 'abandonado'), ...datas([40, 33, 26, 19, 12, 5], 'regular')], agora);
console.log('ordem (atraso relativo):', ab.map(x => `${x.chave}:${x.atrasoRelativo}`).join(' | '));
console.log('em atraso:', itensEmAtraso(ab).map(x => x.chave).join(','));
