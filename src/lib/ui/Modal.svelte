<script lang="ts">
  /** Casca comum de modal: overlay, foco, Esc, toque fora — usada por todos os modais novos. */
  interface Props {
    titulo: string;
    onFechar: () => void;
    children: any;
    rodape?: any;
  }
  let { titulo, onFechar, children, rodape }: Props = $props();

  function aoTeclar(e: KeyboardEvent) { if (e.key === 'Escape') onFechar(); }
</script>

<svelte:window onkeydown={aoTeclar} />
<div class="overlay" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={titulo}>
    <h2>{titulo}</h2>
    <div class="corpo">{@render children()}</div>
    {#if rodape}<div class="rodape">{@render rodape()}</div>{/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; z-index: var(--z-modal);
    background: rgba(43, 38, 26, 0.45);
    display: flex; align-items: flex-end; justify-content: center;
  }
  @media (min-width: 560px) { .overlay { align-items: center; } }
  .modal {
    background: var(--paper); width: 100%; max-width: 480px;
    border-radius: var(--r-lg) var(--r-lg) 0 0; padding: var(--sp-4) var(--sp-4) 0;
    max-height: 88dvh; overflow-y: auto; box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
  }
  @media (min-width: 560px) { .modal { border-radius: var(--r-lg); margin: 20px; } }
  h2 { font-family: var(--font-mono); font-size: var(--fs-lg); margin: 0 0 var(--sp-2); text-transform: uppercase; letter-spacing: var(--tracking-stamp); }
  .rodape {
    display: flex; gap: var(--sp-2); margin-top: var(--sp-4);
    position: sticky; bottom: 0; background: var(--paper);
    padding: var(--sp-3) 0 calc(var(--sp-4) + env(safe-area-inset-bottom));
    border-top: 1px solid var(--border);
  }
  :global(.rodape button) {
    flex: 1; font-family: var(--font-mono); font-weight: 700; font-size: 13px;
    padding: 13px 10px; border-radius: var(--r-md); min-height: var(--tap);
    border: 1px solid var(--border); background: var(--card); color: var(--ink);
  }
  :global(.rodape button.primario) { background: var(--green); color: #fff; border-color: var(--green); }
  :global(.rodape button.perigo) { background: var(--red); color: #fff; border-color: var(--red); }
</style>
