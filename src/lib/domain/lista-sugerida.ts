/**
 * H5 — lista sugerida automaticamente.
 *
 * Regra de produto, não só técnica: a sugestão nunca vira lista sozinha.
 * Ela é sempre editável antes de existir — a função devolve candidatos, e o
 * caso de uso em servicos/ decide se cria de fato, só quando o usuário
 * confirma. É a mesma postura do H3: o app propõe, a pessoa decide.
 */

import type { PriceEntry, ItemStat } from './types';
import { preverRecompras, itensEmAtraso } from './inflacao';
import { normalizeName } from './categorize';

export interface ItemSugerido {
  name: string;
  category: string;
  unit: string;
  price: number | null;
  motivo: 'atrasado' | 'frequente';
}

/**
 * Combina duas fontes: itens em atraso pela previsão de recompra (H4) e
 * itens frequentes do perfil que não estão em nenhuma lista ativa (B6, já
 * existente) — priorizando o atraso, que é o sinal mais forte e específico.
 */
export function gerarListaSugerida(
  precos: PriceEntry[],
  stats: Record<string, ItemStat>,
  jaNasListas: string[],
  limite = 15
): ItemSugerido[] {
  const ativos = new Set(jaNasListas.map(normalizeName));
  const previsoes = itensEmAtraso(preverRecompras(precos));
  const usados = new Set<string>();
  const out: ItemSugerido[] = [];

  for (const p of previsoes) {
    const k = normalizeName(p.nome);
    if (ativos.has(k) || usados.has(k)) continue;
    const stat = stats[k];
    out.push({
      name: p.nome,
      category: stat?.category ?? '',
      unit: stat?.unit ?? '',
      price: stat?.lastPrice ?? null,
      motivo: 'atrasado'
    });
    usados.add(k);
    if (out.length >= limite) return out;
  }

  const frequentes = Object.values(stats)
    .filter((s) => s?.name && !ativos.has(normalizeName(s.name)) && !usados.has(normalizeName(s.name)))
    .sort((a, b) => b.count - a.count);

  for (const s of frequentes) {
    out.push({ name: s.name, category: s.category, unit: s.unit, price: s.lastPrice, motivo: 'frequente' });
    if (out.length >= limite) break;
  }

  return out;
}
