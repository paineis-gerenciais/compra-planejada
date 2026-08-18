/**
 * Compartilhar lista como texto (WhatsApp, etc.) — funcionalidade da v4
 * não portada até agora.
 *
 * Função pura: monta o texto, não sabe nada sobre Web Share API,
 * clipboard, ou WhatsApp. Isso é o que permite testar o formato sem
 * precisar de navegador.
 */

import type { Item, ShoppingList } from './types';
import { agruparPorCategoria } from './items';

export function textoDaLista(lista: ShoppingList, itens: Item[]): string {
  const linhas: string[] = [];
  linhas.push(`🛒 *${lista.name}*`);

  if (itens.length === 0) {
    linhas.push('', '(lista vazia)');
    return linhas.join('\n');
  }

  const grupos = agruparPorCategoria(itens);
  const categorias = Object.keys(grupos).sort((a, b) => {
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  for (const cat of categorias) {
    linhas.push('', `*${cat === '' ? 'Sem categoria' : cat}*`);
    for (const it of grupos[cat] ?? []) {
      const marca = it.bought ? '[x]' : '[ ]';
      const qtd = it.unit ? `${it.qty} ${it.unit}` : it.qty;
      linhas.push(`${marca} ${it.name} — ${qtd}`);
    }
  }

  const total = itens.length;
  const comprados = itens.filter((i) => i.bought).length;
  linhas.push('', `${comprados} de ${total} itens`);

  return linhas.join('\n');
}
