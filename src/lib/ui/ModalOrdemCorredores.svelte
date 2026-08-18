<script lang="ts">
  import Modal from './Modal.svelte';
  import { indiceAlvo, reordenar } from '../domain/dragReorder';

  interface Props {
    tituloLoja: string;
    categorias: string[];
    onSalvar: (ordem: string[]) => void;
    onFechar: () => void;
  }
  let { tituloLoja, categorias, onSalvar, onFechar }: Props = $props();

  let ordem = $state([...categorias]);
  let linhaEls: (HTMLElement | null)[] = [];

  function mover(i: number, direcao: -1 | 1): void {
    const j = i + direcao;
    if (j < 0 || j >= ordem.length) return;
    const copia = [...ordem];
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
    ordem = copia;
  }

  // ---------- arrastar e soltar (mantém os botões ▲▼ como alternativa
  // acessível por teclado/leitor de tela — não é opcional neste projeto) ----------
  let arrastando = $state<number | null>(null);
  let indicePreview = $state<number | null>(null);

  function aoPressionarAlca(e: PointerEvent, i: number): void {
    e.preventDefault();
    arrastando = i;
    indicePreview = i;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function aoMoverPonteiro(e: PointerEvent): void {
    if (arrastando === null) return;
    const retangulos = linhaEls.map((el) => {
      const r = el!.getBoundingClientRect();
      return { top: r.top, height: r.height };
    });
    indicePreview = indiceAlvo(e.clientY, retangulos);
  }
  function aoSoltarPonteiro(): void {
    if (arrastando === null || indicePreview === null) { arrastando = null; return; }
    ordem = reordenar(ordem, arrastando, indicePreview);
    arrastando = null;
    indicePreview = null;
  }
</script>

<Modal titulo="Ordem dos corredores" {onFechar}>
  <p class="sub">
    Coloque as categorias na ordem em que você passa por elas
    <strong>{tituloLoja}</strong>. Arraste pelo ⠿, ou use as setas.
  </p>

  {#if ordem.length === 0}
    <p class="vazio">Nenhuma categoria para ordenar ainda — adicione itens com categoria primeiro.</p>
  {:else}
    <div
      role="list"
      onpointermove={aoMoverPonteiro}
      onpointerup={aoSoltarPonteiro}
      onpointercancel={aoSoltarPonteiro}
    >
      {#each ordem as cat, i (cat)}
        <div class="linha" class:arrastando={arrastando === i} bind:this={linhaEls[i]} role="listitem">
          <button class="alca" aria-label="Arrastar {cat} para reordenar" onpointerdown={(e) => aoPressionarAlca(e, i)}>⠿</button>
          <span class="posicao">{i + 1}</span>
          <span class="nome">{cat}</span>
          <span class="botoes">
            <button aria-label="Mover {cat} para cima" disabled={i === 0} onclick={() => mover(i, -1)}>▲</button>
            <button aria-label="Mover {cat} para baixo" disabled={i === ordem.length - 1} onclick={() => mover(i, 1)}>▼</button>
          </span>
        </div>
      {/each}
    </div>
  {/if}

  {#snippet rodape()}
    <button onclick={onFechar}>Cancelar</button>
    <button class="primario" onclick={() => onSalvar(ordem)}>Salvar ordem</button>
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .vazio { color: var(--ink-light); font-size: var(--fs-sm); text-align: center; padding: var(--sp-4) 0; }
  .linha {
    display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3);
    margin-bottom: 6px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--card);
    touch-action: none;
  }
  .linha.arrastando { opacity: 0.5; border-color: var(--green); border-style: dashed; }
  .alca { background: none; border: none; color: var(--ink-light); font-size: 16px; cursor: grab; padding: 4px 2px; touch-action: none; }
  .posicao { font-family: var(--font-mono); font-size: 11px; color: var(--ink-light); width: 18px; flex-shrink: 0; }
  .nome { flex: 1; font-size: var(--fs-md); }
  .botoes { display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; }
  .botoes button { background: none; border: none; color: var(--ink); font-size: 10px; padding: 3px 6px; }
  .botoes button:disabled { opacity: 0.25; }
</style>
