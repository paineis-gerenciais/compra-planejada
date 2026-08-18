/**
 * Arrastar e soltar para reordenar — função pura, sem DOM.
 *
 * Dado o Y do ponteiro e os retângulos (posição + altura) de cada linha
 * na ordem atual, devolve o índice onde o item solto deveria entrar.
 * Comparar pelo meio de cada linha (não pelo topo) é o que faz o "encaixe"
 * acontecer na metade do caminho, do jeito que a maioria dos apps de
 * lista já acostumou o usuário a esperar.
 */

export interface RetanguloLinha {
  top: number;
  height: number;
}

export function indiceAlvo(pointerY: number, retangulos: RetanguloLinha[]): number {
  for (let i = 0; i < retangulos.length; i++) {
    const meio = retangulos[i]!.top + retangulos[i]!.height / 2;
    if (pointerY < meio) return i;
  }
  return retangulos.length;
}

/** Reordena um array movendo o item de `de` para `paraIndiceAlvo`
 *  (índice calculado ANTES de remover o item de origem). */
export function reordenar<T>(lista: T[], de: number, paraIndiceAlvo: number): T[] {
  if (de < 0 || de >= lista.length) return lista;
  const copia = [...lista];
  const [item] = copia.splice(de, 1);
  let destino = paraIndiceAlvo;
  if (destino > de) destino -= 1; // o splice acima já deslocou os índices depois de `de`
  destino = Math.max(0, Math.min(destino, copia.length));
  copia.splice(destino, 0, item as T);
  return copia;
}
