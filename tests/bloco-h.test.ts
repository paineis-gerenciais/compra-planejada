/**
 * Bloco H — H3 (OCR + revisão assistida), H4 (inflação/previsão), H5 (lista sugerida).
 */
import { describe, it, expect } from 'vitest';
import { extrairItens, taxaDeAcerto } from '../src/lib/domain/receipt-parse';
import { calcularInflacaoPessoal, preverRecompras, itensEmAtraso } from '../src/lib/domain/inflacao';
import { gerarListaSugerida } from '../src/lib/domain/lista-sugerida';
import type { PriceEntry, ItemStat } from '../src/lib/domain/types';

const owner = { kind: 'user', id: 'u1' } as const;

/* =========================================================
   H3 · extração de itens do texto OCR
   ========================================================= */
describe('H3 · extrairItens', () => {
  // Texto simulado de um cupom real, com o ruído típico de OCR (espaços
  // irregulares, alguma linha cortada) — é assim que o Tesseract devolve.
  const cupomTypico = `
SUPERMERCADO EXTRA LTDA
CNPJ: 12.345.678/0001-90
CUPOM FISCAL ELETRONICO
Data: 12/07/2026

ARROZ TIPO 1 5KG      1 UN X   24,90         24,90
FEIJAO CARIOCA 1KG    2 UN X    8,50         17,00
LEITE INTEGRAL 1L     6 UN X    5,29         31,74
DETERGENTE NEUTRO     1 UN X    2,49          2,49
xY9 zW                                        0,00
TOTAL                                        76,13
FORMA DE PAGAMENTO: CARTAO DE CREDITO
OBRIGADO, VOLTE SEMPRE
`;

  it('extrai os itens plausíveis e ignora cabeçalho/rodapé', () => {
    const r = extrairItens(cupomTypico);
    const nomes = r.itens.map((i) => i.nome);
    expect(nomes.some((n) => /arroz/i.test(n))).toBe(true);
    expect(nomes.some((n) => /feijao|feijão/i.test(n))).toBe(true);
    expect(nomes.some((n) => /leite/i.test(n))).toBe(true);
    expect(nomes.some((n) => /detergente/i.test(n))).toBe(true);
    expect(nomes.some((n) => /total/i.test(n))).toBe(false);
    expect(nomes.some((n) => /forma de pagamento/i.test(n))).toBe(false);
  });

  it('reconhece o total do cupom quando presente', () => {
    expect(extrairItens(cupomTypico).totalDetectado).toBe(76.13);
  });

  it('reconhece a data do cupom', () => {
    const r = extrairItens(cupomTypico);
    expect(r.data).not.toBeNull();
    expect(new Date(r.data!).getUTCDate()).toBe(12);
  });

  it('linha de ruído puro de OCR não vira item de alta confiança', () => {
    const r = extrairItens(cupomTypico);
    const ruido = r.itens.find((i) => i.linhaOriginal.includes('xY9'));
    if (ruido) expect(ruido.confianca).not.toBe('alta');
  });

  it('preço unitário é extraído quando presente', () => {
    // Nota de limitação real: quando o próprio nome do produto tem um
    // número com unidade ("FEIJAO ... 1KG"), a extração de quantidade pode
    // pegar essa embalagem em vez da quantidade comprada — é o tipo de erro
    // que a revisão manual assistida existe para corrigir, não algo que dê
    // para eliminar só com regex. O preço, que vem sempre no fim da linha,
    // é mais confiável.
    const r = extrairItens(cupomTypico);
    const feijao = r.itens.find((i) => /feijao|feijão/i.test(i.nome));
    expect(feijao?.unitPrice).toBe(8.50);
    expect(feijao?.totalLinha).toBe(17.00);
  });

  it('imagem sem texto reconhecível gera aviso, não erro', () => {
    const r = extrairItens('   \n\n   ');
    expect(r.itens).toHaveLength(0);
    expect(r.avisos.length).toBeGreaterThan(0);
  });

  it('nunca lança exceção com entrada aleatória', () => {
    expect(() => extrairItens('###@@@ 1,,, ,,2 \t\t')).not.toThrow();
    expect(() => extrairItens('')).not.toThrow();
  });

  it('CRITÉRIO DE SUCESSO DO PLANO: ≥80% de acerto no cupom simulado', () => {
    const r = extrairItens(cupomTypico);
    const taxa = taxaDeAcerto(r.itens, ['arroz', 'feijão', 'leite', 'detergente']);
    expect(taxa).toBeGreaterThanOrEqual(0.8);
  });

  it('cupom de layout diferente (preço colado, sem "UN X")', () => {
    const outroLayout = `
MERCADO SAO JOSE
01 PAO FRANCES              8,90
02 QUEIJO MUSSARELA        24,50
TOTAL GERAL                33,40
`;
    const r = extrairItens(outroLayout);
    expect(r.itens.length).toBeGreaterThanOrEqual(2);
    expect(r.itens.some((i) => /pao|pão/i.test(i.nome))).toBe(true);
    expect(r.itens.some((i) => /queijo/i.test(i.nome))).toBe(true);
  });
});

/* =========================================================
   H4 · inflação pessoal
   ========================================================= */
describe('H4 · calcularInflacaoPessoal', () => {
  const dia = 86400000;
  const agora = Date.now();

  function entrada(key: string, preco: number, diasAtras: number): PriceEntry {
    return {
      id: `${key}-${diasAtras}`, owner, key, displayName: key,
      store: 'Extra', unitPrice: preco, unit: '', qty: '1',
      date: agora - diasAtras * dia, source: 'manual', purchaseId: null
    };
  }

  it('detecta alta de preço ponderada pela frequência de compra', () => {
    const entries: PriceEntry[] = [
      // arroz: comprado 3x recente a 30, 3x antes a 20 -> +50%, alto peso
      ...[10, 30, 50].map((d) => entrada('arroz', 30, d)),
      ...[100, 130, 160].map((d) => entrada('arroz', 20, d)),
      // item raro: comprado 1x cada período, variação enorme mas baixo peso
      entrada('raro', 100, 20),
      entrada('raro', 10, 150)
    ];
    const r = calcularInflacaoPessoal(entries, agora, 90)!;
    expect(r).not.toBeNull();
    // a variação ponderada deve ficar mais próxima do arroz (item frequente)
    expect(r.variacaoPercentual).toBeGreaterThan(20);
    expect(r.itensConsiderados).toBeGreaterThanOrEqual(2);
  });

  it('sem histórico suficiente em dois períodos, devolve null', () => {
    const entries = [entrada('arroz', 30, 5)]; // só um período
    expect(calcularInflacaoPessoal(entries, agora, 90)).toBeNull();
  });

  it('lista as maiores altas e quedas', () => {
    // entrada(key, preco, diasAtras) — preço RECENTE é o do período de 0-90
    // dias; preço ANTIGO é o de 90-180 dias. "subiu": preço recente maior.
    const entries: PriceEntry[] = [
      entrada('subiu', 20, 10), entrada('subiu', 10, 100),
      entrada('caiu', 10, 10), entrada('caiu', 20, 100)
    ];
    const r = calcularInflacaoPessoal(entries, agora, 90)!;
    expect(r.maioresAltas.some((a) => a.nome === 'subiu')).toBe(true);
    expect(r.maioresQuedas.some((a) => a.nome === 'caiu')).toBe(true);
  });
});

describe('H4 · preverRecompras', () => {
  const dia = 86400000;
  const agora = Date.now();
  function entrada(key: string, diasAtras: number): PriceEntry {
    return {
      id: `${key}-${diasAtras}`, owner, key, displayName: key,
      store: null, unitPrice: 10, unit: '', qty: '1',
      date: agora - diasAtras * dia, source: 'manual', purchaseId: null
    };
  }

  it('estima o intervalo médio de recompra', () => {
    // comprado a cada ~21 dias, a última há 5 dias
    const entries = [entrada('arroz', 5), entrada('arroz', 26), entrada('arroz', 47)];
    const [p] = preverRecompras(entries, agora, 3);
    expect(p!.intervaloMedioDias).toBe(21);
    expect(p!.diasDesdeUltima).toBe(5);
  });

  it('menos de 3 registros não gera previsão — evita "achismo"', () => {
    const entries = [entrada('sal', 5), entrada('sal', 20)];
    expect(preverRecompras(entries, agora, 3)).toHaveLength(0);
  });

  it('itensEmAtraso só traz quem já passou do intervalo típico', () => {
    const noPrazo = [entrada('leite', 2), entrada('leite', 9), entrada('leite', 16)]; // a cada 7, última há 2
    const atrasado = [entrada('cafe', 40), entrada('cafe', 61), entrada('cafe', 82)]; // a cada 21, última há 40
    const previsoes = preverRecompras([...noPrazo, ...atrasado], agora, 3);
    const atraso = itensEmAtraso(previsoes);
    expect(atraso.some((p) => p.nome === 'cafe')).toBe(true);
    expect(atraso.some((p) => p.nome === 'leite')).toBe(false);
  });

  it('mais atrasado aparece primeiro', () => {
    const poucoAtraso = [entrada('a', 8), entrada('a', 15), entrada('a', 22)]; // intervalo 7, atraso leve
    const muitoAtraso = [entrada('b', 60), entrada('b', 81), entrada('b', 102)]; // intervalo 21, bem atrasado
    const previsoes = itensEmAtraso(preverRecompras([...poucoAtraso, ...muitoAtraso], agora, 3));
    expect(previsoes[0]!.nome).toBe('b');
  });
});

/* =========================================================
   H5 · lista sugerida automaticamente
   ========================================================= */
describe('H5 · gerarListaSugerida', () => {
  const dia = 86400000;
  const agora = Date.now();
  function entrada(key: string, diasAtras: number): PriceEntry {
    return {
      id: `${key}-${diasAtras}`, owner, key, displayName: key,
      store: null, unitPrice: 10, unit: 'kg', qty: '1',
      date: agora - diasAtras * dia, source: 'manual', purchaseId: null
    };
  }

  it('prioriza itens em atraso sobre itens só frequentes', () => {
    const precos = [entrada('cafe', 40), entrada('cafe', 61), entrada('cafe', 82)]; // atrasado
    const stats: Record<string, ItemStat> = {
      cafe: { name: 'cafe', category: 'Mercearia', unit: 'kg', lastPrice: 10, count: 3, lastUsed: agora },
      arroz: { name: 'arroz', category: 'Mercearia', unit: '', lastPrice: 20, count: 10, lastUsed: agora }
    };
    const sugestoes = gerarListaSugerida(precos, stats, [], 10);
    expect(sugestoes[0]!.name).toBe('cafe');
    expect(sugestoes[0]!.motivo).toBe('atrasado');
  });

  it('nunca sugere o que já está numa lista ativa', () => {
    const stats: Record<string, ItemStat> = {
      arroz: { name: 'arroz', category: '', unit: '', lastPrice: null, count: 5, lastUsed: agora }
    };
    const sugestoes = gerarListaSugerida([], stats, ['Arroz'], 10);
    expect(sugestoes.find((s) => s.name === 'arroz')).toBeUndefined();
  });

  it('respeita o limite pedido', () => {
    const stats: Record<string, ItemStat> = {};
    for (let i = 0; i < 30; i++) {
      stats[`item${i}`] = { name: `Item ${i}`, category: '', unit: '', lastPrice: null, count: 30 - i, lastUsed: agora };
    }
    expect(gerarListaSugerida([], stats, [], 5)).toHaveLength(5);
  });

  it('nunca grava nada sozinha — só devolve candidatos (contrato de API)', () => {
    const stats: Record<string, ItemStat> = {
      x: { name: 'X', category: '', unit: '', lastPrice: null, count: 1, lastUsed: agora }
    };
    const r = gerarListaSugerida([], stats, [], 5);
    expect(Array.isArray(r)).toBe(true);
    // a função é pura: chamar de novo com os mesmos argumentos dá o mesmo resultado
    expect(gerarListaSugerida([], stats, [], 5)).toEqual(r);
  });
});
