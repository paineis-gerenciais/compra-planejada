<script lang="ts">
  import Modal from './Modal.svelte';

  interface Props {
    tituloLoja: string;
    categorias: string[];
    onSalvar: (ordem: string[]) => void;
    onFechar: () => void;
  }
  let { tituloLoja, categorias, onSalvar, onFechar }: Props = $props();

  let ordem = $state([...categorias]);

  function mover(i: number, direcao: -1 | 1): void {
    const j = i + direcao;
    if (j < 0 || j >= ordem.length) return;
    const copia = [...ordem];
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
    ordem = copia;
  }
</script>

<Modal titulo="Ordem dos corredores" {onFechar}>
  <p class="sub">
    Coloque as categorias na ordem em que você passa por elas
    <strong>{tituloLoja}</strong>. A lista passa a seguir esse trajeto.
  </p>

  {#if ordem.length === 0}
    <p class="vazio">Nenhuma categoria para ordenar ainda — adicione itens com categoria primeiro.</p>
  {:else}
    {#each ordem as cat, i (cat)}
      <div class="linha">
        <span class="posicao">{i + 1}</span>
        <span class="nome">{cat}</span>
        <span class="botoes">
          <button aria-label="Mover {cat} para cima" disabled={i === 0} onclick={() => mover(i, -1)}>▲</button>
          <button aria-label="Mover {cat} para baixo" disabled={i === ordem.length - 1} onclick={() => mover(i, 1)}>▼</button>
        </span>
      </div>
    {/each}
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
  }
  .posicao { font-family: var(--font-mono); font-size: 11px; color: var(--ink-light); width: 18px; flex-shrink: 0; }
  .nome { flex: 1; font-size: var(--fs-md); }
  .botoes { display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; }
  .botoes button { background: none; border: none; color: var(--ink); font-size: 10px; padding: 3px 6px; }
  .botoes button:disabled { opacity: 0.25; }
</style>
