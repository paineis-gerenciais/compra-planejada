<script lang="ts">
  /**
   * C1/C2/C3 — tela dedicada ao momento dentro do mercado: linha inteira
   * tocável, rodapé fixo com progresso e total, Wake Lock em três níveis
   * (nativo → vídeo mudo → dica ao usuário — ver pendência 6 da v4).
   */
  import type { Item, ShoppingList, Presence } from '../domain/types';
  import { agruparPorCategoria, totalGasto } from '../domain/items';
  import { ordenarCategorias } from '../domain/aisles';
  import { formatPrice } from '../domain/prices';
  import ItemLinha from './ItemLinha.svelte';

  interface Props {
    lista: ShoppingList;
    itens: Item[];
    ordens: Record<string, any>;
    online: Presence[];
    onToggle: (i: Item) => void;
    onSair: () => void;
    onFinalizar: () => void;
    onAdicionar: (nome: string) => void;
  }
  let { lista, itens, ordens, online, onToggle, onSair, onFinalizar, onAdicionar }: Props = $props();

  let ocultarComprados = $state(false);
  let mostrarAdd = $state(false);
  let textoNovo = $state('');

  const visiveis = $derived(ocultarComprados ? itens.filter((i) => !i.bought) : itens);
  const grupos = $derived(agruparPorCategoria(visiveis));
  const categorias = $derived(ordenarCategorias(Object.keys(grupos), ordens, lista));
  const total = $derived(itens.length);
  const comprados = $derived(itens.filter((i) => i.bought).length);
  const progresso = $derived(total ? Math.round((comprados / total) * 100) : 0);
  const gasto = $derived(totalGasto(itens));
  const juntoComprando = $derived(online.filter((p) => p.shopping));

  // Wake Lock — três níveis. Nível 2 é um truque (técnica do NoSleep.js) e só
  // roda quando o nível 1 (API nativa) não existe; nunca os dois ao mesmo tempo.
  let wakeLock: any = null;
  let video: HTMLVideoElement | null = null;

  async function ligarWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
        return;
      } catch (e) { /* Modo de Baixo Consumo etc: cai para o próximo nível */ }
    }
    ligarVideoAntiSono();
  }
  function ligarVideoAntiSono() {
    if (video) return;
    try {
      video = document.createElement('video');
      video.muted = true; video.loop = true; video.playsInline = true;
      video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:.01;pointer-events:none;bottom:0;left:0;';
      video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkxNyAwYTg0ZDk4IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbAAAAA9tb292AAAAbG12aGQAAAAA';
      document.body.appendChild(video);
      video.play().catch(() => {});
    } catch (e) { showTip(); }
  }
  function showTip() {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    alert(iOS
      ? 'Para a tela não apagar: Ajustes → Tela e Brilho → Bloqueio Automático'
      : 'Ajuste o tempo de tela nas configurações do aparelho.');
  }
  function desligarWakeLock() {
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    if (video) { video.pause(); video.remove(); video = null; }
  }

  $effect(() => {
    ligarWakeLock();
    return desligarWakeLock;
  });
</script>

<div class="tela">
  <div class="barra">
    <button onclick={onSair} aria-label="Sair do modo compra">← Sair</button>
    <h2>{lista.name}{#if juntoComprando.length}· com {juntoComprando.map((p) => p.name).join(', ')}{/if}</h2>
    <button aria-pressed={ocultarComprados} onclick={() => (ocultarComprados = !ocultarComprados)}>
      {ocultarComprados ? 'Mostrar todos' : 'Ocultar pegos'}
    </button>
  </div>

  <div class="corpo">
    {#if visiveis.length === 0}
      <p class="vazio">🎉 Tudo pego!<br />Toque em <strong>Finalizar compra</strong> abaixo.</p>
    {:else}
      {#each categorias as cat (cat)}
        <section class="grupo">
          <h3>{cat === '' ? 'Sem categoria' : cat}</h3>
          {#each grupos[cat] ?? [] as item, i (item.id)}
            <ItemLinha {item} modoCompra podeEditar {onToggle} />
          {/each}
        </section>
      {/each}
    {/if}
  </div>

  {#if mostrarAdd}
    <div class="add-rapido">
      <input bind:value={textoNovo} placeholder="2kg tomate" autofocus
        onkeydown={(e) => { if (e.key === 'Enter') { onAdicionar(textoNovo); textoNovo = ''; mostrarAdd = false; } }} />
      <button onclick={() => { onAdicionar(textoNovo); textoNovo = ''; mostrarAdd = false; }}>Add</button>
    </div>
  {/if}

  <div class="rodape">
    <div class="trilho"><div class="preenchido" style:width="{progresso}%"></div></div>
    <div class="linha">
      <span>{comprados} de {total} pegos</span>
      <span class="valor">{formatPrice(gasto)}</span>
    </div>
    <div class="acoes">
      <button onclick={() => (mostrarAdd = !mostrarAdd)}>+ item</button>
      <button class="primario" onclick={onFinalizar}>✓ Finalizar</button>
    </div>
  </div>
</div>

<style>
  .tela { padding-bottom: 130px; }
  .barra {
    position: sticky; top: 0; z-index: var(--z-header); background: var(--green); color: #fff;
    padding: var(--sp-3) var(--sp-4); display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
  }
  .barra h2 { font-family: var(--font-mono); font-size: 14px; margin: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .barra button {
    background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.4); color: #fff;
    font-family: var(--font-mono); font-size: 12px; font-weight: 700; padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-md); flex-shrink: 0; min-height: 36px;
  }
  .corpo { padding: var(--sp-3) var(--sp-4); max-width: 560px; margin: 0 auto; }
  .vazio { text-align: center; color: var(--ink-light); padding: var(--sp-6) var(--sp-4); }
  .grupo h3 { font-family: var(--font-mono); font-size: var(--fs-xs); text-transform: uppercase; color: var(--ink-light); border-bottom: 1px dashed var(--border); padding-bottom: 4px; }

  .add-rapido { position: fixed; bottom: 118px; left: var(--sp-3); right: var(--sp-3); display: flex; gap: var(--sp-2); z-index: 37; }
  .add-rapido input { flex: 1; padding: 11px; border-radius: var(--r-md); border: 1px solid var(--border); }
  .add-rapido button { background: var(--green); color: #fff; border: none; border-radius: var(--r-md); padding: 0 var(--sp-3); }

  .rodape {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 36; background: var(--card);
    border-top: 1px solid var(--border); padding: var(--sp-3) var(--sp-4) calc(var(--sp-3) + env(safe-area-inset-bottom));
  }
  .trilho { height: 8px; background: var(--border); border-radius: var(--r-pill); overflow: hidden; }
  .preenchido { height: 100%; background: var(--green); }
  .linha { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 12.5px; margin: var(--sp-2) 0; }
  .valor { font-weight: 700; font-size: 15px; }
  .acoes { display: flex; gap: var(--sp-2); }
  .acoes button { flex: 1; font-family: var(--font-mono); font-weight: 700; padding: 13px; border-radius: var(--r-md); min-height: 48px; border: 1px solid var(--border); background: var(--card); }
  .acoes button.primario { background: var(--green); color: #fff; border-color: var(--green); }
</style>
