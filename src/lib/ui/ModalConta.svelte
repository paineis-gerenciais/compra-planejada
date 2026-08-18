<script lang="ts">
  import Modal from './Modal.svelte';

  interface Props {
    nome: string;
    email: string | null;
    semConta: boolean;
    onSair: () => void;
    onFechar: () => void;
  }
  let { nome, email, semConta, onSair, onFechar }: Props = $props();
</script>

<Modal titulo="Sua conta" {onFechar}>
  {#if semConta}
    <p class="sub">
      Você está usando o app sem conta — os dados ficam só neste
      aparelho e não sincronizam. Entre com uma conta a qualquer momento
      pela tela inicial para ativar a sincronização.
    </p>
  {:else}
    <div class="info">
      <span class="nome">{nome}</span>
      {#if email}<span class="email">{email}</span>{/if}
    </div>
  {/if}

  {#snippet rodape()}
    <button onclick={onFechar}>Fechar</button>
    {#if !semConta}
      <button class="perigo" onclick={onSair}>Sair da conta</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0; }
  .info { display: flex; flex-direction: column; gap: 2px; padding: var(--sp-2) 0; }
  .nome { font-size: var(--fs-md); font-weight: 600; }
  .email { font-size: var(--fs-sm); color: var(--ink-light); font-family: var(--font-mono); }
</style>
