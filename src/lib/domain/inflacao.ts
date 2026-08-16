/**
 * H4 — inflação pessoal e previsão de recompra.
 *
 * "Inflação pessoal" != IPCA: é o quanto a SUA cesta específica mudou de
 * preço, ponderada pelo que você realmente compra. Um item que triplicou de
 * preço mas você comprou uma vez não deveria pesar tanto quanto o café que
 * você compra toda semana.
 */

import type { PriceEntry } from './types';
import { agruparPrecos } from './prices';

export interface InflacaoPessoal {
  variacaoPercentual: number;
  itensConsiderados: number;
  periodoDias: number;
  maioresAltas: Array<{ nome: string; variacao: number }>;
  maioresQuedas: Array<{ nome: string; variacao: number }>;
}

/**
 * Compara o preço médio de cada item nos últimos `janelaDias` com o preço
 * médio no período anterior de mesmo tamanho, ponderado pela frequência de
 * compra do item (quantos registros ele tem) — é o que evita que um item
 * comprado uma vez domine o índice.
 */
export function calcularInflacaoPessoal(
  entries: PriceEntry[], agora = Date.now(), janelaDias = 90
): InflacaoPessoal | null {
  const janela = janelaDias * 86400000;
  const recentes = entries.filter((e) => e.date >= agora - janela);
  const anteriores = entries.filter((e) => e.date < agora - janela && e.date >= agora - 2 * janela);

  const porItemRecente = agruparPrecos(recentes);
  const porItemAnterior = agruparPrecos(anteriores);

  const variacoes: Array<{ nome: string; variacao: number; peso: number }> = [];

  for (const chave of Object.keys(porItemRecente)) {
    const atual = porItemRecente[chave]!;
    const antigo = porItemAnterior[chave];
    if (!antigo || !antigo.length) continue;

    const mediaAtual = atual.reduce((s, e) => s + e.unitPrice, 0) / atual.length;
    const mediaAntiga = antigo.reduce((s, e) => s + e.unitPrice, 0) / antigo.length;
    if (mediaAntiga <= 0) continue;

    const variacao = ((mediaAtual - mediaAntiga) / mediaAntiga) * 100;
    const peso = atual.length + antigo.length; // frequência de compra
    variacoes.push({ nome: atual[0]!.displayName, variacao, peso });
  }

  if (!variacoes.length) return null;

  const somaPesos = variacoes.reduce((s, v) => s + v.peso, 0);
  const variacaoPonderada = variacoes.reduce((s, v) => s + v.variacao * v.peso, 0) / somaPesos;

  const ordenadas = [...variacoes].sort((a, b) => b.variacao - a.variacao);
  return {
    variacaoPercentual: Math.round(variacaoPonderada * 10) / 10,
    itensConsiderados: variacoes.length,
    periodoDias: janelaDias,
    maioresAltas: ordenadas.slice(0, 5).filter((v) => v.variacao > 0).map((v) => ({ nome: v.nome, variacao: Math.round(v.variacao * 10) / 10 })),
    maioresQuedas: ordenadas.slice(-5).reverse().filter((v) => v.variacao < 0).map((v) => ({ nome: v.nome, variacao: Math.round(v.variacao * 10) / 10 }))
  };
}

export interface PrevisaoRecompra {
  nome: string;
  chave: string;
  diasDesdeUltima: number;
  intervaloMedioDias: number;
  atrasoRelativo: number; // > 1 significa "já deveria ter comprado de novo"
  provavelProximaCompra: number; // timestamp
}

/**
 * "Faz 26 dias que você não compra arroz — costuma comprar a cada 21."
 * Precisa de pelo menos 3 registros para estimar um intervalo com alguma
 * confiança; com menos que isso, um único desvio vira "previsão".
 */
export function preverRecompras(entries: PriceEntry[], agora = Date.now(), minimoRegistros = 3): PrevisaoRecompra[] {
  const agrupados = agruparPrecos(entries);
  const previsoes: PrevisaoRecompra[] = [];

  for (const [chave, regs] of Object.entries(agrupados)) {
    if (regs.length < minimoRegistros) continue;
    const datas = regs.map((r) => r.date).sort((a, b) => a - b);
    const intervalos: number[] = [];
    for (let i = 1; i < datas.length; i++) intervalos.push((datas[i]! - datas[i - 1]!) / 86400000);
    const intervaloMedio = intervalos.reduce((s, v) => s + v, 0) / intervalos.length;
    if (intervaloMedio <= 0) continue;

    const ultima = datas[datas.length - 1]!;
    const diasDesdeUltima = (agora - ultima) / 86400000;

    previsoes.push({
      nome: regs[0]!.displayName,
      chave,
      diasDesdeUltima: Math.round(diasDesdeUltima),
      intervaloMedioDias: Math.round(intervaloMedio),
      atrasoRelativo: Math.round((diasDesdeUltima / intervaloMedio) * 100) / 100,
      provavelProximaCompra: ultima + intervaloMedio * 86400000
    });
  }

  // mais atrasado primeiro — é a ordem de utilidade prática
  return previsoes.sort((a, b) => b.atrasoRelativo - a.atrasoRelativo);
}

/** Itens que já deveriam ter sido recomprados (atraso >= 100% do intervalo típico). */
export function itensEmAtraso(previsoes: PrevisaoRecompra[]): PrevisaoRecompra[] {
  return previsoes.filter((p) => p.atrasoRelativo >= 1);
}
