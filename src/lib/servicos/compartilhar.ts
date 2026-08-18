/**
 * Compartilhar como texto — usa a Web Share API nativa quando existe (é o
 * que faz o seletor do sistema aparecer com WhatsApp já na lista, em
 * celular). Sem isso disponível (a maioria dos navegadores de desktop),
 * cai para copiar no clipboard.
 */

import type { Item, ShoppingList } from '../domain/types';
import { textoDaLista } from '../domain/share';

export interface ResultadoCompartilhamento {
  metodo: 'share' | 'clipboard' | 'cancelado' | 'erro';
}

export async function compartilharLista(lista: ShoppingList, itens: Item[]): Promise<ResultadoCompartilhamento> {
  const texto = textoDaLista(lista, itens);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: lista.name, text: texto });
      return { metodo: 'share' };
    } catch (e: any) {
      if (e?.name === 'AbortError') return { metodo: 'cancelado' };
      // segue para o fallback de clipboard se o compartilhamento nativo falhar por outro motivo
    }
  }

  try {
    await navigator.clipboard.writeText(texto);
    return { metodo: 'clipboard' };
  } catch {
    return { metodo: 'erro' };
  }
}
