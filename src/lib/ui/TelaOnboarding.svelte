<script lang="ts">
  interface Props {
    onConcluir: () => void;
  }
  let { onConcluir }: Props = $props();

  interface Passo {
    icone: string;
    titulo: string;
    texto: string;
  }

  const passos: Passo[] = [
    {
      icone: '🛒',
      titulo: 'Bem-vindo ao Compras',
      texto: 'Suas listas de compras, sincronizadas entre todos os seus aparelhos e com sua família — sem depender de papel nem de anotações espalhadas.'
    },
    {
      icone: '⌨️',
      titulo: 'Adicionar item é rápido',
      texto: 'Digite "2kg tomate" e aperte Enter. O app entende quantidade, unidade e categoria sozinho — cole várias linhas de uma vez ou dite por voz.'
    },
    {
      icone: '👨‍👩‍👧',
      titulo: 'Compartilhe com a família',
      texto: 'Crie uma família e convide quem divide a compra com você. Todos veem e editam as mesmas listas, em tempo real.'
    },
    {
      icone: '💰',
      titulo: 'Economize sem esforço',
      texto: 'Ao finalizar a compra, informe quanto pagou. O app monta sozinho um histórico de preços, compara mercados e avisa quando algo está na hora de recomprar.'
    }
  ];

  let indice = $state(0);
  const ultimo = $derived(indice === passos.length - 1);

  function avancar(): void {
    if (ultimo) onConcluir();
    else indice++;
  }
  function voltar(): void {
    if (indice > 0) indice--;
  }
</script>

<div class="tela" role="dialog" aria-modal="true" aria-label="Boas-vindas ao Compras">
  <div class="cartao">
    <button class="pular" onclick={onConcluir}>Pular</button>

    <div class="conteudo">
      <span class="icone" aria-hidden="true">{passos[indice]!.icone}</span>
      <h2>{passos[indice]!.titulo}</h2>
      <p>{passos[indice]!.texto}</p>
    </div>

    <div class="pontos" role="tablist" aria-label="Progresso">
      {#each passos as _, i (i)}
        <span class="ponto" class:ativo={i === indice} aria-hidden="true"></span>
      {/each}
    </div>

    <div class="acoes">
      {#if indice > 0}
        <button class="secundario" onclick={voltar}>Voltar</button>
      {/if}
      <button class="primario" onclick={avancar}>{ultimo ? 'Começar' : 'Próximo'}</button>
    </div>
  </div>
</div>

<style>
  .tela {
    position: fixed; inset: 0; z-index: var(--z-auth); background: var(--paper);
    display: flex; align-items: center; justify-content: center; padding: var(--sp-4);
  }
  .cartao {
    width: 100%; max-width: 380px; background: var(--card); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: var(--sp-5) var(--sp-4) var(--sp-4);
    box-shadow: 0 12px 30px -12px var(--shadow); position: relative;
  }
  .pular {
    position: absolute; top: var(--sp-3); right: var(--sp-3);
    background: none; border: none; color: var(--ink-light); font-size: var(--fs-sm);
    padding: var(--sp-2); min-height: var(--tap); min-width: var(--tap);
  }
  .conteudo { text-align: center; padding: var(--sp-4) var(--sp-2) var(--sp-3); }
  .icone { font-size: 48px; display: block; margin-bottom: var(--sp-3); }
  h2 {
    font-family: var(--font-mono); font-size: var(--fs-lg); margin: 0 0 var(--sp-3);
    letter-spacing: var(--tracking-stamp);
  }
  p { font-size: var(--fs-md); color: var(--ink-light); line-height: var(--lh-base); margin: 0; }

  .pontos { display: flex; justify-content: center; gap: 6px; margin: var(--sp-4) 0; }
  .ponto { width: 7px; height: 7px; border-radius: 50%; background: var(--border); transition: background var(--dur-base); }
  .ponto.ativo { background: var(--green); }

  .acoes { display: flex; gap: var(--sp-2); }
  .acoes button {
    flex: 1; font-family: var(--font-mono); font-weight: 700; font-size: 13px;
    padding: 13px; border-radius: var(--r-md); min-height: var(--tap);
    border: 1px solid var(--border); background: var(--card); color: var(--ink);
  }
  .acoes button.primario { background: var(--green); color: #fff; border-color: var(--green); }
</style>
