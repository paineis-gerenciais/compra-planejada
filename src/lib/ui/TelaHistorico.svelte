<script lang="ts">
  import Modal from './Modal.svelte';
  import type { Purchase } from '../domain/types';
  import { formatPrice } from '../domain/prices';

  interface Props {
    compras: Purchase[];
    onFechar: () => void;
    onReativar: (p: Purchase, somentePendentes: boolean) => void;
  }
  let { compras, onFechar, onReativar }: Props = $props();
  let selecionada = $state<Purchase | null>(null);

  function proporcao(p: Purchase): string {
    const c = p.items.filter((i) => i.bought).length;
    return `${c} de ${p.items.length}`;
  }
</script>

{#if !selecionada}
  <Modal titulo="Compras finalizadas" {onFechar}>
    {#if compras.length === 0}
      <p class="vazio">Nenhuma compra finalizada ainda.</p>
    {:else}
      {#each compras as p (p.id)}
        <button class="linha" onclick={() => (selecionada = p)}>
          <span class="info">
            <span class="nome">{p.listName}</span>
            <span class="sub">{new Date(p.finishedAt).toLocaleDateString('pt-BR')} · {proporcao(p)} itens{#if p.actualTotal != null} · {formatPrice(p.actualTotal)}{/if}</span>
          </span>
          <span class="seta">›</span>
        </button>
      {/each}
    {/if}
  </Modal>
{:else}
  <Modal titulo={selecionada.listName} onFechar={() => (selecionada = null)}>
    <p class="sub">
      {new Date(selecionada.finishedAt).toLocaleDateString('pt-BR')}
      {#if selecionada.store}· {selecionada.store}{/if}
      {#if selecionada.actualTotal != null}· <strong>{formatPrice(selecionada.actualTotal)}</strong>{/if}
    </p>
    {#each Object.entries(agrupar(selecionada.items)) as [cat, itens] (cat)}
      <section class="grupo">
        <h3>{cat || 'Sem categoria'}</h3>
        {#each itens as it}
          <div class="item" class:comprado={it.bought}>
            <span>{it.bought ? '☑' : '☐'} {it.name}</span>
            <span class="qtd">{it.qty}{it.unit ? ' ' + it.unit : ''}</span>
          </div>
        {/each}
      </section>
    {/each}
    {#snippet rodape()}
      <button onclick={() => onReativar(selecionada!, true)}>Trazer só não comprados</button>
      <button class="primario" onclick={() => onReativar(selecionada!, false)}>Trazer todos</button>
    {/snippet}
  </Modal>
{/if}

<script context="module" lang="ts">
  function agrupar(items: { category: string }[]) {
    const out: Record<string, any[]> = {};
    for (const i of items) (out[i.category] ??= []).push(i);
    return out;
  }
</script>

<style>
  .vazio { color: var(--ink-light); text-align: center; padding: var(--sp-5) 0; }
  .linha {
    display: flex; align-items: center; gap: var(--sp-2); width: 100%; text-align: left;
    padding: var(--sp-3) 0; border: none; border-bottom: 1px dashed var(--border); background: none; color: var(--ink);
  }
  .linha .info { flex: 1; }
  .linha .nome { display: block; font-size: var(--fs-md); }
  .linha .sub { display: block; font-size: var(--fs-xs); color: var(--ink-light); font-family: var(--font-mono); }
  .linha .seta { color: var(--ink-light); font-size: 18px; }
  .sub { font-size: var(--fs-sm); color: var(--ink-light); margin: 0 0 var(--sp-3); }
  .grupo h3 { font-family: var(--font-mono); font-size: var(--fs-xs); text-transform: uppercase; color: var(--ink-light); border-bottom: 1px dashed var(--border); padding-bottom: 4px; margin-top: var(--sp-3); }
  .item { display: flex; justify-content: space-between; padding: 6px 0; font-size: var(--fs-sm); }
  .item.comprado { color: var(--ink-light); }
  .qtd { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--ink-light); }
</style>
