/**
 * Geração de PDF — funcionalidade da v4 não portada até agora.
 *
 * jsPDF é importado dinamicamente (como o Tesseract do OCR): só entra no
 * bundle quando a pessoa efetivamente pede o PDF, não no carregamento
 * inicial do app.
 */

import type { Item, ShoppingList } from '../domain/types';
import { agruparPorCategoria, totalEstimado } from '../domain/items';
import { formatPrice } from '../domain/prices';

export async function gerarPdfDaLista(lista: ShoppingList, itens: Item[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const margemX = 18;
  let y = 20;
  const larguraUtil = 210 - margemX * 2;

  doc.setFont('courier', 'bold');
  doc.setFontSize(15);
  doc.text(lista.name, margemX, y);
  y += 7;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('pt-BR'), margemX, y);
  y += 4;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margemX, y, margemX + larguraUtil, y);
  y += 7;

  const grupos = agruparPorCategoria(itens);
  const categorias = Object.keys(grupos).sort((a, b) => {
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  const quebrarPagina = (linhasNecessarias = 1): void => {
    if (y + linhasNecessarias * 6 > 280) {
      doc.addPage();
      y = 20;
    }
  };

  for (const cat of categorias) {
    quebrarPagina(2);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text((cat === '' ? 'SEM CATEGORIA' : cat).toUpperCase(), margemX, y);
    y += 6;

    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    for (const it of grupos[cat] ?? []) {
      quebrarPagina();
      const marca = it.bought ? '[x]' : '[ ]';
      const qtd = it.unit ? `${it.qty} ${it.unit}` : it.qty;
      const preco = it.price != null ? formatPrice(it.price) : '';
      const linha = `${marca} ${it.name}`;
      doc.text(linha, margemX, y);
      doc.text(qtd, margemX + larguraUtil - 30, y, { align: 'right' });
      if (preco) doc.text(preco, margemX + larguraUtil, y, { align: 'right' });
      y += 6;
    }
    y += 2;
  }

  quebrarPagina(3);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margemX, y, margemX + larguraUtil, y);
  y += 7;

  const estimado = totalEstimado(itens);
  const comprados = itens.filter((i) => i.bought).length;
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text(`${comprados} de ${itens.length} itens`, margemX, y);
  if (estimado > 0) doc.text(`Total estimado: ${formatPrice(estimado)}`, margemX + larguraUtil, y, { align: 'right' });

  const nomeArquivo = `${lista.name.replace(/[^\w-]+/g, '-').toLowerCase()}.pdf`;
  doc.save(nomeArquivo);
}
