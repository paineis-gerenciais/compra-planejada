<script lang="ts">
  import Modal from './Modal.svelte';
  import type { Household, OwnerRef, ShoppingList } from '../domain/types';
  import { corDe, iniciais } from '../domain/roles';

  interface Props {
    lista: ShoppingList;
    escopoPessoal: OwnerRef;
    nomePessoal: string;
    minhasCasas: Household[];
    onMover: (destino: OwnerRef, nomeDestino: string) => void;
    onFechar: () => void;
  }
  let { lista, escopoPessoal, nomePessoal, minhasCasas, onMover, onFechar }: Props = $props();

  function mesmoOwner(a: OwnerRef, b: OwnerRef): boolean {
    return a.kind === b.kind && a.id === b.id;
  }

  const destinos = $derived([
    { owner: escopoPessoal, nome: nomePessoal },
    ...minhasCasas.map((h) => ({ owner: { kind: 'household' as const, id: h.id }, nome: h.name }))
  ].filter((d) => !mesmoOwner(d.owner, lista.owner)));
</script>

<Modal titulo="Mover lista" {onFechar}>
  <p class="sub">
    "{lista.name}" vai sair de onde está e todos os itens vão junto — nada
    é reescrito manualmente, só muda quem é dono da lista.
  </p>

  {#if destinos.length === 0}
    <p class="vazio">Não há para onde mover — você não participa de nenhuma família além de onde a lista já está.</p>
  {:else}
    {#each destinos as d (d.owner.kind + ':' + d.owner.id)}
      <button class="destino" onclick={() => onMover(d.owner, d.nome)}>
        <span class="avatar" style:background={corDe(d.owner.kind === 'household' ? d.owner.id : 'user')}>
          {iniciais(d.nome)}
        </span>
        <span class="nome">{d.nome}</span>
        <span class="seta">→</span>
      </button>
    {/each}
  {/if}

  {#snippet rodape()}
    <button onclick={onFechar}>Cancelar</button>
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .vazio { color: var(--ink-light); font-size: var(--fs-sm); text-align: center; padding: var(--sp-4) 0; }
  .destino {
    display: flex; align-items: center; gap: var(--sp-3); width: 100%; text-align: left;
    padding: var(--sp-3); margin-bottom: var(--sp-2); border: 1px solid var(--border);
    border-radius: var(--r-md); background: var(--card); color: var(--ink);
  }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  }
  .nome { flex: 1; font-size: var(--fs-md); }
  .seta { color: var(--ink-light); }
</style>
