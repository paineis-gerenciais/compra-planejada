<script lang="ts">
  /**
   * H4/H5 juntos numa tela: "o que a inteligência de preço sabe sobre você
   * agora". Inflação pessoal, itens atrasados para recompra, e a lista
   * sugerida — que nunca vira lista sozinha, só candidatos para revisar.
   */
  import Modal from './Modal.svelte';
  import type { PriceEntry, ItemStat } from '../domain/types';
  import { calcularInflacaoPessoal, preverRecompras, itensEmAtraso } from '../domain/inflacao';
  import { gerarListaSugerida, type ItemSugerido } from '../domain/lista-sugerida';

  interface Props {
    precos: PriceEntry[];
    stats: Record<string, ItemStat>;
    jaNasListas: string[];
    onFechar: () => void;
    onCriarListaSugerida: (itens: ItemSugerido[]) => void;
  }
  let { precos, stats, jaNasListas, onFechar, onCriarListaSugerida }: Props = $props();

  const inflacao = $derived(calcularInflacaoPessoal(precos));
  const atrasados = $derived(itensEmAtraso(preverRecompras(precos)));
  const sugestoes = $derived(gerarListaSugerida(precos, stats, jaNasListas, 12));
  let marcados = $state<Record<number, boolean>>({});

  $effect(() => {
    const m: Record<number, boolean> = {};
    sugestoes.forEach((_, i) => { m[i] = true; });
    marcados = m;
  });

  function criar() {
    const escolhidos = sugestoes.filter((_, i) => marcados[i]);
    if (escolhidos.length) onCriarListaSugerida(escolhidos);
  }
</script>

<Modal titulo="O que sua cesta está dizendo" {onFechar}>
  {#if !precos.length}
    <p class="sub">Sem histórico de preços ainda. Finalize algumas compras informando o valor pago para começar a ver isto aqui.</p>
  {:else}
    {#if inflacao}
      <section class="bloco">
        <span class="rotulo">Inflação pessoal (90 dias)</span>
        <p class="grande" class:alta={inflacao.variacaoPercentual > 0} class:baixa={inflacao.variacaoPercentual < 0}>
          {inflacao.variacaoPercentual > 0 ? '+' : ''}{inflacao.variacaoPercentual}%
        </p>
        <p class="explicacao">
          Com base em {inflacao.itensConsiderados} {inflacao.itensConsiderados === 1 ? 'item que você compra com frequência' : 'itens que você compra com frequência'}.
        </p>
        {#if inflacao.maioresAltas.length}
          <p class="mini-lista"><strong>Subiram mais:</strong> {inflacao.maioresAltas.map((a) => `${a.nome} (+${a.variacao}%)`).join(', ')}</p>
        {/if}
        {#if inflacao.maioresQuedas.length}
          <p class="mini-lista"><strong>Caíram mais:</strong> {inflacao.maioresQuedas.map((a) => `${a.nome} (${a.variacao}%)`).join(', ')}</p>
        {/if}
      </section>
    {/if}

    {#if atrasados.length}
      <section class="bloco">
        <span class="rotulo">Provavelmente na hora de recomprar</span>
        {#each atrasados.slice(0, 6) as p (p.chave)}
          <div class="atraso">
            <span>{p.nome}</span>
            <span class="dias">faz {p.diasDesdeUltima} dias · costuma comprar a cada {p.intervaloMedioDias}</span>
          </div>
        {/each}
      </section>
    {/if}

    {#if sugestoes.length}
      <section class="bloco">
        <span class="rotulo">Lista sugerida — revise antes de criar</span>
        <p class="explicacao">Nada aqui vira lista sozinho. Desmarque o que não quiser.</p>
        {#each sugestoes as s, i (s.name)}
          <label class="sugestao">
            <input type="checkbox" bind:checked={marcados[i]} />
            <span>{s.name}</span>
            <span class="motivo">{s.motivo === 'atrasado' ? 'atrasado' : 'frequente'}</span>
          </label>
        {/each}
      </section>
    {/if}
  {/if}

  {#snippet rodape()}
    <button onclick={onFechar}>Fechar</button>
    {#if sugestoes.length}
      <button class="primario" onclick={criar}>Criar lista com selecionados</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; }
  .bloco { margin-bottom: var(--sp-4); }
  .rotulo { display: block; font-size: 12px; font-weight: 600; color: var(--ink-light); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px; }
  .grande { font-family: var(--font-mono); font-size: 32px; font-weight: 700; margin: 0; }
  .grande.alta { color: var(--red); }
  .grande.baixa { color: var(--green); }
  .explicacao { font-size: 12.5px; color: var(--ink-light); margin: 4px 0; }
  .mini-lista { font-size: 12.5px; margin: 4px 0; }
  .atraso { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed var(--border); font-size: 13.5px; }
  .dias { font-family: var(--font-mono); font-size: 11px; color: var(--ink-light); }
  .sugestao { display: flex; align-items: center; gap: var(--sp-2); padding: 6px 0; font-size: 14px; }
  .sugestao span:nth-child(2) { flex: 1; }
  .motivo { font-family: var(--font-mono); font-size: 10px; color: var(--ink-light); border: 1px solid var(--border); padding: 1px 6px; border-radius: var(--r-pill); }
</style>
