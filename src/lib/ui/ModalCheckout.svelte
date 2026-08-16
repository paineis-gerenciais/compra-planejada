<script lang="ts">
  import Modal from './Modal.svelte';
  import { formatPrice } from '../domain/prices';
  import { totalEstimado } from '../domain/items';
  import type { Item } from '../domain/types';

  interface Props {
    itens: Item[];
    lojas: string[];
    lojaSugerida?: string;
    onConfirmar: (dados: { store: string | null; actualTotal: number | null }) => void;
    onFechar: () => void;
  }
  let { itens, lojas, lojaSugerida = '', onConfirmar, onFechar }: Props = $props();

  const estimado = $derived(totalEstimado(itens));
  const comprados = $derived(itens.filter((i) => i.bought).length);

  let valor = $state('');
  let loja = $state(lojaSugerida);

  const diferenca = $derived.by(() => {
    const v = parseFloat(valor.replace(',', '.'));
    if (isNaN(v) || estimado <= 0) return '';
    const d = v - estimado;
    if (Math.abs(d) < 0.01) return 'igual à estimativa';
    return d > 0 ? `${formatPrice(d)} acima da estimativa` : `${formatPrice(Math.abs(d))} abaixo da estimativa`;
  });

  function concluir(comDados: boolean) {
    if (!comDados) { onConfirmar({ store: null, actualTotal: null }); return; }
    const v = parseFloat(valor.replace(',', '.'));
    onConfirmar({
      store: loja.trim() || null,
      actualTotal: !isNaN(v) && v > 0 ? Math.round(v * 100) / 100 : null
    });
  }
</script>

<Modal titulo="Quanto ficou?" {onFechar}>
  <p class="sub">
    {comprados} {comprados === 1 ? 'item comprado' : 'itens comprados'}
    {#if estimado > 0}· estimativa de <strong>{formatPrice(estimado)}</strong>{/if}.
    Anotar o valor real alimenta seu histórico de gastos. Pode pular.
  </p>
  <div class="campo">
    <label for="ckTotal">Valor pago</label>
    <input id="ckTotal" bind:value={valor} inputmode="decimal"
      placeholder={estimado > 0 ? estimado.toFixed(2).replace('.', ',') : '0,00'} />
  </div>
  <div class="campo">
    <label for="ckStore">Onde você comprou</label>
    <input id="ckStore" bind:value={loja} list="lojas" placeholder="Ex: Extra Savassi" />
    <datalist id="lojas">{#each lojas as l (l)}<option value={l}></option>{/each}</datalist>
  </div>
  {#if diferenca}<p class="diff">{diferenca}</p>{/if}
  {#snippet rodape()}
    <button onclick={() => concluir(false)}>Pular</button>
    <button class="primario" onclick={() => concluir(true)}>Salvar e finalizar</button>
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .campo { margin-bottom: var(--sp-3); }
  .campo label { display: block; font-size: var(--fs-xs); color: var(--ink-light); margin-bottom: 4px; }
  .campo input { width: 100%; font-size: 15px; padding: 11px var(--sp-3); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--card); }
  .diff { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--ink-light); margin: 0; }
</style>
