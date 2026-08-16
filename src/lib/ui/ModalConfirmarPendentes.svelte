<script lang="ts">
  import Modal from './Modal.svelte';
  import type { Item } from '../domain/types';

  interface Props {
    pendentes: Item[];
    onDecidir: (criarNova: boolean) => void;
    onFechar: () => void;
  }
  let { pendentes, onDecidir, onFechar }: Props = $props();
</script>

<Modal titulo="Finalizar compra" {onFechar}>
  <p class="sub">
    Esta compra sai das suas listas ativas. Ainda há {pendentes.length}
    {pendentes.length === 1 ? 'item não comprado' : 'itens não comprados'} — eles podem iniciar uma lista nova.
  </p>
  <ul class="lista">
    {#each pendentes.slice(0, 8) as it (it.id)}
      <li>{it.name}</li>
    {/each}
    {#if pendentes.length > 8}<li class="mais">e mais {pendentes.length - 8}...</li>{/if}
  </ul>
  {#snippet rodape()}
    <button onclick={() => onDecidir(false)}>Apenas finalizar</button>
    <button class="primario" onclick={() => onDecidir(true)}>Criar lista com os pendentes</button>
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .lista { margin: 0; padding-left: 20px; font-size: 13px; color: var(--ink-light); }
  .mais { font-style: italic; }
</style>
