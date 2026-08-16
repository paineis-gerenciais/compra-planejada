/**
 * Serviço de OCR — wrapper fino sobre o Tesseract.js.
 *
 * Fica isolado do domínio de propósito: `receipt-parse.ts` é puro e
 * testável sem rodar OCR de verdade; este arquivo é o único que toca a
 * biblioteca pesada, e só é importado quando o usuário de fato abre a
 * câmera — o bundle principal não paga o custo de carregar o Tesseract.
 */

export interface ProgressoOcr { status: string; progress: number; }

export async function reconhecerTexto(
  imagem: File | Blob | string,
  aoProgredir?: (p: ProgressoOcr) => void
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('por', 1, {
    logger: (m: any) => aoProgredir?.({ status: m.status, progress: m.progress ?? 0 })
  });
  try {
    const { data } = await worker.recognize(imagem);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
