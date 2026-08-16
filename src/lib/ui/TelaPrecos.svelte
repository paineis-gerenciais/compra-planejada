<script lang="ts">
  import Modal from './Modal.svelte';
  import type { PriceEntry, Purchase } from '../domain/types';
  import { agruparPrecos, resumoDePreco, gastosPorCompra, formatPrice, type ResumoDePreco } from '../domain/prices';

  interface Props {
    precos: PriceEntry[];
    compras: Purchase[];
    onFechar: () => void;
    onAdicionarNaLista?: (r: ResumoDePreco) => void;
  }
  let { precos, compras, onFechar, onAdicionarNaLista }: Props = $props();

  let busca = $state('');
  let detalhe = $state<ResumoDePreco | null>(null);

  const gastos = $derived(gastosPorCompra(compras, 12));
  const agrupados = $derived(agruparPrecos(precos));
  const itens = $derived(
    Object.entries(agrupados)
      .map(([chave, regs]) => ({ chave, nome: regs[0]!.displayName, registros: regs.length, ultimo: regs[0]! }))
      .sort((a, b) => b.registros - a.registros)
  );
  const filtrados = $derived(
    itens.filter((i) => !busca || i.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 60)
  );
  const maxGasto = $derived(Math.max(1, ...gastos.map((g) => g.total)));

  function abrir(nome: string) {
    detalhe = resumoDePreco(precos, nome);
  }
</script>

{#if !detalhe}
  <Modal titulo="Preços" {onFechar}>
    {#if !itens.length && !gastos.length}
      <p class="sub">Ainda não há histórico. Ele se monta sozinho: preencha o preço dos itens e, ao finalizar a compra, informe quanto pagou e em qual mercado.</p>
    {:else}
      <p class="sub">Montado a partir das suas compras finalizadas.</p>
    {/if}

    {#if gastos.length}
      <span class="rotulo">Gasto por compra</span>
      <div class="grafico" role="img" aria-label="Gasto nas últimas compras">
        {#each gastos as g (g.data)}
          <div class="coluna" title="{g.nome} — {formatPrice(g.total)}">
            <span class="val">{g.total >= 1000 ? (g.total / 1000).toFixed(1) + 'k' : g.total.toFixed(0)}</span>
            <span class="barra" style:height="{Math.max(4, Math.round((g.total / maxGasto) * 100))}%"></span>
            <span class="lbl">{new Date(g.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if itens.length}
      <span class="rotulo">Itens ({itens.length})</span>
      <input class="busca" bind:value={busca} placeholder="Buscar item..." aria-label="Buscar item no histórico de preços" />
      {#each filtrados as i (i.chave)}
        <button class="linha" onclick={() => abrir(i.nome)}>
          <span class="info">
            <span class="nome">{i.nome}</span>
            <span class="sub2">{i.registros} {i.registros === 1 ? 'registro' : 'registros'}{#if i.ultimo.store} · {i.ultimo.store}{/if}</span>
          </span>
          <span class="preco">{formatPrice(i.ultimo.unitPrice)}{#if i.ultimo.unit}/{i.ultimo.unit}{/if}</span>
        </button>
      {/each}
    {/if}
  </Modal>
{:else}
  <Modal titulo={detalhe.nome} onFechar={() => (detalhe = null)}>
    <p class="sub">{detalhe.registros} {detalhe.registros === 1 ? 'compra registrada' : 'compras registradas'}{#if detalhe.unit} · preço por {detalhe.unit}{/if}.</p>

    <div class="cards">
      <div class="card"><span class="clabel">Último</span><span class="cval">{formatPrice(detalhe.ultimo.unitPrice)}</span></div>
      <div class="card"><span class="clabel">Menor</span><span class="cval ok">{formatPrice(detalhe.menor)}</span></div>
      <div class="card"><span class="clabel">Maior</span><span class="cval alto">{formatPrice(detalhe.maior)}</span></div>
    </div>

    {#if detalhe.variacao != null}
      <p class="sub" style="margin-top:10px;">
        Do primeiro registro até agora, {detalhe.variacao > 0 ? 'subiu' : detalhe.variacao < 0 ? 'caiu' : 'ficou estável'}
        <strong>{Math.abs(detalhe.variacao).toFixed(1)}%</strong>.
      </p>
    {/if}

    {#if detalhe.lojas.length > 1}
      <span class="rotulo">Por mercado</span>
      {#each detalhe.lojas as l, i (l.loja)}
        <div class="storeRow">
          <span>{l.loja}{#if i === 0}<span class="badge">mais barato</span>{/if}</span>
          <span class="valorLoja">{formatPrice(l.media)}{#if l.n > 1}<small> média de {l.n}</small>{/if}</span>
        </div>
      {/each}
    {/if}

    {#snippet rodape()}
      <button onclick={() => (detalhe = null)}>Voltar</button>
      <button class="primario" onclick={() => onAdicionarNaLista?.(detalhe!)}>Adicionar à lista</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .rotulo { display: block; font-size: 12px; font-weight: 600; color: var(--ink-light); margin: var(--sp-3) 0 6px; text-transform: uppercase; letter-spacing: 0.4px; }
  .busca { width: 100%; padding: 10px var(--sp-3); border: 1px solid var(--border); border-radius: var(--r-md); margin-bottom: var(--sp-2); }

  .grafico { display: flex; align-items: flex-end; gap: 5px; height: 120px; overflow-x: auto; }
  .coluna { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; flex: 1; min-width: 26px; height: 100%; }
  .barra { width: 100%; max-width: 26px; background: var(--green); border-radius: 3px 3px 0 0; min-height: 4px; }
  .val { font-family: var(--font-mono); font-size: 9px; color: var(--ink-light); margin-bottom: 3px; }
  .lbl { font-family: var(--font-mono); font-size: 8.5px; color: var(--ink-light); margin-top: 4px; white-space: nowrap; }

  .linha { display: flex; align-items: center; gap: var(--sp-2); width: 100%; text-align: left; padding: var(--sp-2) 0; border: none; border-bottom: 1px dashed var(--border); background: none; color: var(--ink); }
  .linha .info { flex: 1; min-width: 0; }
  .nome { display: block; font-size: var(--fs-md); }
  .sub2 { display: block; font-size: 11px; color: var(--ink-light); font-family: var(--font-mono); }
  .preco { font-family: var(--font-mono); font-size: 13px; font-weight: 700; white-space: nowrap; }

  .cards { display: flex; gap: var(--sp-2); margin-top: var(--sp-3); }
  .card { flex: 1; border: 1px solid var(--border); border-radius: var(--r-md); padding: 11px 8px; text-align: center; background: var(--card); }
  .clabel { display: block; font-size: 10px; color: var(--ink-light); font-family: var(--font-mono); text-transform: uppercase; }
  .cval { display: block; font-family: var(--font-mono); font-size: 15px; font-weight: 700; margin-top: 3px; }
  .cval.ok { color: var(--green); }
  .cval.alto { color: var(--red); }

  .storeRow { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px dashed var(--border); font-size: 13.5px; }
  .valorLoja { font-family: var(--font-mono); font-weight: 700; }
  .valorLoja small { font-weight: 400; color: var(--ink-light); font-size: 10px; }
  .badge { font-family: var(--font-mono); font-size: 9px; text-transform: uppercase; background: var(--green-light); color: var(--green); padding: 2px 6px; border-radius: var(--r-pill); margin-left: 6px; }
</style>
