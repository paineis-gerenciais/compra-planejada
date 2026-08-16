<script lang="ts">
  /**
   * H3 — captura por foto + revisão manual assistida.
   *
   * O contrato de produto é rígido: NADA entra na lista ou no histórico de
   * preços sem passar por esta tela. O app extrai o que consegue, marca a
   * confiança de cada linha, e a pessoa confirma, corrige ou descarta item
   * a item antes de qualquer gravação.
   */
  import Modal from './Modal.svelte';
  import { extrairItens, type ItemCandidato } from '../domain/receipt-parse';
  import { reconhecerTexto, type ProgressoOcr } from '../servicos/ocr';

  interface Props {
    onConfirmar: (itens: Array<{ name: string; qty: string; price: number | null }>, loja: string | null) => void;
    onFechar: () => void;
  }
  let { onConfirmar, onFechar }: Props = $props();

  type Etapa = 'escolher' | 'processando' | 'revisar';
  let etapa = $state<Etapa>('escolher');
  let progresso = $state<ProgressoOcr | null>(null);
  let candidatos = $state<ItemCandidato[]>([]);
  let lojaDetectada = $state<string | null>(null);
  let avisos = $state<string[]>([]);
  let erro = $state('');

  // seleção e edição por linha — tudo mutável até o "Adicionar à lista"
  let incluidos = $state<Record<number, boolean>>({});
  let nomesEditados = $state<Record<number, string>>({});
  let precosEditados = $state<Record<number, string>>({});
  let qtdsEditadas = $state<Record<number, string>>({});

  async function processarArquivo(file: File) {
    etapa = 'processando';
    erro = '';
    try {
      const texto = await reconhecerTexto(file, (p) => (progresso = p));
      const r = extrairItens(texto);
      candidatos = r.itens;
      lojaDetectada = r.store;
      avisos = r.avisos;
      incluidos = {}; nomesEditados = {}; precosEditados = {}; qtdsEditadas = {};
      r.itens.forEach((it, i) => {
        // baixa confiança nasce desmarcado — a pessoa decide se quer incluir
        incluidos[i] = it.confianca !== 'baixa';
        nomesEditados[i] = it.nome;
        qtdsEditadas[i] = it.qty;
        precosEditados[i] = it.unitPrice != null ? it.unitPrice.toFixed(2).replace('.', ',') : '';
      });
      etapa = 'revisar';
    } catch (e: any) {
      erro = 'Não foi possível processar a imagem. Tente uma foto mais nítida.';
      etapa = 'escolher';
      console.error(e);
    }
  }

  function aoEscolherArquivo(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) processarArquivo(file);
  }

  function confirmar() {
    const itens = candidatos
      .map((c, i) => ({ i, c }))
      .filter(({ i }) => incluidos[i])
      .map(({ i }) => {
        const p = parseFloat((precosEditados[i] ?? '').replace(',', '.'));
        return {
          name: (nomesEditados[i] ?? '').trim(),
          qty: qtdsEditadas[i] ?? '1',
          price: !isNaN(p) && p > 0 ? Math.round(p * 100) / 100 : null
        };
      })
      .filter((it) => it.name.length > 0);
    onConfirmar(itens, lojaDetectada);
  }

  const totalIncluidos = $derived(Object.values(incluidos).filter(Boolean).length);
  function corConfianca(c: ItemCandidato['confianca']) {
    return c === 'alta' ? 'var(--green)' : c === 'media' ? 'var(--amber)' : 'var(--red)';
  }
</script>

<Modal titulo="Ler cupom fiscal" {onFechar}>
  {#if etapa === 'escolher'}
    <p class="sub">
      Tire uma foto do cupom, bem iluminada e esticado. O app tenta reconhecer os itens
      e você confirma tudo antes de gravar — nada entra na lista sozinho.
    </p>
    {#if erro}<p class="erro">{erro}</p>{/if}
    <label class="botaoArquivo">
      📷 Escolher foto do cupom
      <input type="file" accept="image/*" capture="environment" onchange={aoEscolherArquivo} hidden />
    </label>
  {:else if etapa === 'processando'}
    <div class="processando">
      <p>Lendo o cupom...</p>
      {#if progresso}
        <div class="trilho"><div class="preenchido" style:width="{Math.round(progresso.progress * 100)}%"></div></div>
        <p class="status">{progresso.status}</p>
      {/if}
    </div>
  {:else}
    <p class="sub">
      {candidatos.length} {candidatos.length === 1 ? 'item reconhecido' : 'itens reconhecidos'}
      {#if lojaDetectada}· {lojaDetectada}{/if} — revise antes de confirmar.
    </p>
    {#each avisos as a}<p class="aviso">{a}</p>{/each}

    {#each candidatos as c, i (i)}
      <div class="linha" class:excluida={!incluidos[i]}>
        <input type="checkbox" bind:checked={incluidos[i]} aria-label="Incluir {c.nome}" />
        <div class="campos">
          <input class="nome" bind:value={nomesEditados[i]} aria-label="Nome do item" />
          <input class="qtd" bind:value={qtdsEditadas[i]} aria-label="Quantidade" placeholder="1" />
          <input class="preco" bind:value={precosEditados[i]} aria-label="Preço" placeholder="0,00" inputmode="decimal" />
        </div>
        <span class="confianca" style:background={corConfianca(c.confianca)} title="Confiança: {c.confianca}"></span>
      </div>
    {/each}
  {/if}

  {#snippet rodape()}
    {#if etapa === 'revisar'}
      <button onclick={() => (etapa = 'escolher')}>Tentar outra foto</button>
      <button class="primario" disabled={totalIncluidos === 0} onclick={confirmar}>
        Adicionar {totalIncluidos} {totalIncluidos === 1 ? 'item' : 'itens'}
      </button>
    {:else}
      <button onclick={onFechar}>Cancelar</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .erro { color: var(--red); font-size: 12.5px; background: var(--amber-light); padding: 9px 11px; border-radius: var(--r-sm); }
  .aviso { font-size: 12px; color: var(--amber); background: var(--amber-light); padding: 8px 10px; border-radius: var(--r-sm); margin-bottom: var(--sp-2); }
  .botaoArquivo {
    display: flex; align-items: center; justify-content: center; gap: var(--sp-2);
    padding: var(--sp-5); border: 2px dashed var(--border); border-radius: var(--r-md);
    font-family: var(--font-mono); font-size: 14px; cursor: pointer; color: var(--ink);
  }
  .processando { text-align: center; padding: var(--sp-5) 0; }
  .trilho { height: 8px; background: var(--border); border-radius: var(--r-pill); overflow: hidden; margin: var(--sp-3) 0; }
  .preenchido { height: 100%; background: var(--green); transition: width var(--dur-base); }
  .status { font-family: var(--font-mono); font-size: 11px; color: var(--ink-light); text-transform: capitalize; }

  .linha { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) 0; border-bottom: 1px dashed var(--border); }
  .linha.excluida { opacity: 0.45; }
  .campos { flex: 1; display: flex; gap: 6px; min-width: 0; }
  .campos input { padding: 8px; border: 1px solid var(--border); border-radius: var(--r-sm); font-size: 13px; }
  .campos .nome { flex: 1; min-width: 0; }
  .campos .qtd { width: 46px; }
  .campos .preco { width: 66px; }
  .confianca { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
</style>
