<script lang="ts">
  import Modal from './Modal.svelte';
  import type { Item } from '../domain/types';
  import { UNIDADES } from '../domain/parse';
  import { CATEGORIAS_PADRAO } from '../domain/categorize';

  interface Props {
    item: Item;
    categoriasConhecidas?: string[];
    onSalvar: (patch: Partial<Item>) => void;
    onExcluir: () => void;
    onFechar: () => void;
  }
  let { item, categoriasConhecidas = [], onSalvar, onExcluir, onFechar }: Props = $props();

  let nome = $state(item.name);
  let qty = $state(item.qty);
  let unit = $state(item.unit);
  let categoria = $state(item.category);
  let preco = $state(item.price != null ? String(item.price).replace('.', ',') : '');

  const categorias = $derived([...new Set([...CATEGORIAS_PADRAO, ...categoriasConhecidas])].sort((a, b) => a.localeCompare(b, 'pt-BR')));

  function confirmar(): void {
    const n = nome.trim();
    if (!n) return;
    const p = preco.trim() ? parseFloat(preco.replace(',', '.')) : null;
    onSalvar({
      name: n,
      qty: qty.trim() || '1',
      unit,
      category: categoria,
      price: p != null && !isNaN(p) && p > 0 ? Math.round(p * 100) / 100 : null
    });
  }
</script>

<Modal titulo="Editar item" {onFechar}>
  <div class="campo">
    <label for="eiNome">Nome</label>
    <input id="eiNome" bind:value={nome} />
  </div>

  <div class="linhaDupla">
    <div class="campo">
      <label for="eiQty">Quantidade</label>
      <input id="eiQty" bind:value={qty} inputmode="decimal" />
    </div>
    <div class="campo">
      <label for="eiUnit">Unidade</label>
      <select id="eiUnit" bind:value={unit}>
        {#each UNIDADES as u (u)}
          <option value={u}>{u === '' ? 'Un.' : u}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="campo">
    <label for="eiCat">Categoria</label>
    <select id="eiCat" bind:value={categoria}>
      <option value="">Sem categoria</option>
      {#each categorias as c (c)}
        <option value={c}>{c}</option>
      {/each}
    </select>
  </div>

  <div class="campo">
    <label for="eiPreco">Preço (opcional)</label>
    <input id="eiPreco" bind:value={preco} inputmode="decimal" placeholder="0,00" />
  </div>

  <button class="excluir" onclick={onExcluir}>Remover item da lista</button>

  {#snippet rodape()}
    <button onclick={onFechar}>Cancelar</button>
    <button class="primario" onclick={confirmar}>Salvar</button>
  {/snippet}
</Modal>

<style>
  .campo { margin-bottom: var(--sp-3); }
  .campo label { display: block; font-size: var(--fs-xs); color: var(--ink-light); margin-bottom: 4px; }
  .campo input, .campo select {
    width: 100%; font-size: 15px; padding: 11px var(--sp-3);
    border: 1px solid var(--border); border-radius: var(--r-md); background: var(--paper);
  }
  .linhaDupla { display: flex; gap: var(--sp-2); }
  .linhaDupla .campo { flex: 1; }
  .excluir {
    width: 100%; background: none; border: 1px dashed var(--red); color: var(--red);
    border-radius: var(--r-md); padding: var(--sp-2); font-size: var(--fs-sm); margin-top: var(--sp-2);
  }
</style>
