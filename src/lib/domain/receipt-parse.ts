/**
 * H3 — extração de itens a partir do texto OCR de um cupom fiscal.
 *
 * Decisão tomada (registrada no plano): captura por FOTO + OCR, não NFC-e.
 * Não existe API pública nacional unificada de nota fiscal eletrônica para o
 * consumidor — a consulta é por portal estadual, cada um com seu formato,
 * alguns com captcha. Foto funciona igual em qualquer estado.
 *
 * Em troca, extrair itens de um cupom fotografado é MENOS confiável que
 * dados estruturados. Por isso esta função nunca grava nada sozinha: ela
 * produz candidatos com uma nota de confiança, e o app SEMPRE mostra uma
 * tela de revisão antes de qualquer item entrar na lista ou no histórico de
 * preços — "revisão manual assistida", não importação automática.
 *
 * Critério de sucesso definido no plano: ≥ 80% de itens corretos em 20
 * cupons reais de 3 mercados diferentes. Esta função é pura e testável
 * exatamente para permitir medir essa taxa sem precisar rodar o OCR de
 * verdade a cada teste — os testes alimentam texto OCR simulado.
 */

import { titleCaseFirst, normalizeName } from './categorize';

export interface ItemCandidato {
  nomeOriginal: string;
  nome: string;
  qty: string;
  unitPrice: number | null;
  totalLinha: number | null;
  confianca: 'alta' | 'media' | 'baixa';
  linhaOriginal: string;
}

export interface ResultadoExtracao {
  itens: ItemCandidato[];
  store: string | null;
  data: number | null;
  totalDetectado: number | null;
  avisos: string[];
}

/**
 * Cupons brasileiros variam MUITO de layout entre redes, mas duas
 * convenções são quase universais no corpo da nota:
 *
 *   NOME DO PRODUTO       2,000 UN x    5,99 =      11,98
 *   NOME DO PRODUTO   1UN X  5,99                    5,99
 *
 * A regra: linha com pelo menos dois números decimais (qty e/ou preços) e
 * um trecho de texto reconhecível como nome. Linhas de cabeçalho, totais,
 * tributos e "CUPOM FISCAL" são descartadas por palavras-chave.
 */
const LINHA_IGNORAR = /\b(cupom fiscal|cnpj|total|subtotal|desconto|troco|dinheiro|cartao|cartão|forma de pagamento|valor pago|tributos|lei|consumidor|obrigado|volte sempre|caixa|operador|item\s*qtd|codigo|código)\b/i;

const NUM = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})/g;

function paraNumero(s: string): number {
  // formatos brasileiros: "1.234,56" ou "12,34"
  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}

export function extrairItens(textoOcr: string): ResultadoExtracao {
  const linhas = String(textoOcr ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const avisos: string[] = [];
  const itens: ItemCandidato[] = [];
  let store: string | null = null;
  let totalDetectado: number | null = null;
  let data: number | null = null;

  // Nome do mercado costuma ser a primeira linha "de verdade" do cupom.
  const primeiraTextual = linhas.find((l) => /[a-zA-ZÀ-ÿ]{3,}/.test(l) && !/\d{2}\/\d{2}\/\d{4}/.test(l));
  if (primeiraTextual) store = titleCaseFirst(primeiraTextual.toLowerCase());

  const dataMatch = textoOcr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dataMatch) {
    const d = new Date(Number(dataMatch[3]), Number(dataMatch[2]) - 1, Number(dataMatch[1]));
    if (!isNaN(d.getTime())) data = d.getTime();
  }

  const totalMatch = textoOcr.match(/total[^\d]*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  if (totalMatch) totalDetectado = paraNumero(totalMatch[1]!);

  for (const linha of linhas) {
    if (LINHA_IGNORAR.test(linha)) continue;

    const numeros = [...linha.matchAll(NUM)].map((m) => paraNumero(m[0]));
    if (numeros.length === 0) continue; // sem número, não é linha de item

    // nome = tudo antes do primeiro número reconhecido
    const primeiroNumIdx = linha.search(NUM);
    let nomeOriginal = primeiroNumIdx > 2 ? linha.slice(0, primeiroNumIdx).trim() : linha.trim();
    nomeOriginal = nomeOriginal.replace(/^\d+\s*[-.)]\s*/, ''); // remove código de barras/item líder
    if (nomeOriginal.length < 3) continue; // provavelmente lixo de OCR

    let qty = '1';
    const qtyMatch = linha.match(/(\d+(?:[.,]\d+)?)\s*(?:un|kg|g|l)\b/i);
    if (qtyMatch) qty = qtyMatch[1]!.replace(',', '.');

    let unitPrice: number | null = null;
    let totalLinha: number | null = null;
    if (numeros.length >= 2) {
      // "qty x unitário = total": os dois últimos números costumam ser
      // unitário e total; o penúltimo é o mais confiável como preço unitário.
      unitPrice = numeros[numeros.length - 2] ?? null;
      totalLinha = numeros[numeros.length - 1] ?? null;
    } else if (numeros.length === 1) {
      totalLinha = numeros[0] ?? null;
      unitPrice = totalLinha; // sem separação clara: assume qty=1 e usa como unitário
    }

    // confiança: nome plausível + números plausíveis + sem excesso de ruído
    let confianca: ItemCandidato['confianca'] = 'alta';
    const temLetrasSuficientes = /[a-zA-ZÀ-ÿ]{3,}/.test(nomeOriginal);
    const precoPlausivel = unitPrice != null && unitPrice > 0 && unitPrice < 2000;
    if (!temLetrasSuficientes || !precoPlausivel) confianca = 'baixa';
    else if (numeros.length < 2 || nomeOriginal.length < 4) confianca = 'media';

    itens.push({
      nomeOriginal,
      nome: titleCaseFirst(nomeOriginal.toLowerCase()),
      qty,
      unitPrice,
      totalLinha,
      confianca,
      linhaOriginal: linha
    });
  }

  if (!itens.length) avisos.push('Não foi possível reconhecer itens nesta imagem. Tente uma foto mais nítida, com o cupom esticado.');
  const baixaConf = itens.filter((i) => i.confianca !== 'alta').length;
  if (itens.length && baixaConf / itens.length > 0.4) {
    avisos.push('Vários itens ficaram com baixa confiança — revise com atenção antes de confirmar.');
  }

  return { itens, store, data, totalDetectado, avisos };
}

/** Taxa de acerto contra um gabarito — é o que o critério de 80% mede. */
export function taxaDeAcerto(extraidos: ItemCandidato[], esperados: string[]): number {
  if (!esperados.length) return 1;
  // normalizeName tira acento — "feijão" precisa casar com "Feijao carioca...",
  // senão o critério de 80% do plano nunca bateria em cupons reais, cheios
  // de erro de OCR justamente nos acentos.
  const nomes = extraidos.map((i) => normalizeName(i.nome));
  let acertos = 0;
  for (const e of esperados) {
    const ne = normalizeName(e);
    if (nomes.some((n) => n.includes(ne) || ne.includes(n))) acertos++;
  }
  return acertos / esperados.length;
}
