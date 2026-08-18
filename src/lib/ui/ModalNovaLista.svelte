<script lang="ts">
  import Modal from './Modal.svelte';

  interface Props {
    onCriar: (nome: string, recorrente: boolean, frequenciaDias: number) => void;
    onFechar: () => void;
  }
  let { onCriar, onFechar }: Props = $props();

  let nome = $state('');
  let recorrente = $state(false);
  let frequencia = $state(7);
  let campo: HTMLInputElement | undefined = $state();

  function confirmar(): void {
    const n = nome.trim();
    if (!n) { campo?.focus(); return; }
    onCriar(n, recorrente, frequencia);
  }
</script>

<Modal titulo="Nova lista" {onFechar}>
  <p class="sub">Dê um nome e configure se ela deve se repetir automaticamente.</p>

  <div class="campo">
    <label for="nlNome">Nome da lista</label>
    <input
      bind:this={campo}
      id="nlNome"
      bind:value={nome}
      placeholder="Ex: Mercado, Farmácia, Feira"
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmar(); } }}
    />
  </div>

  <label class="toggleRow">
    <span>Lista recorrente</span>
    <input type="checkbox" bind:checked={recorrente} />
  </label>

  {#if recorrente}
    <div class="campo">
      <label for="nlFreq">Repetir a cada</label>
      <select id="nlFreq" bind:value={frequencia}>
        <option value={1}>1 dia</option>
        <option value={7}>7 dias</option>
        <option value={14}>14 dias</option>
        <option value={30}>30 dias</option>
      </select>
    </div>
  {/if}

  {#snippet rodape()}
    <button onclick={onFechar}>Cancelar</button>
    <button class="primario" onclick={confirmar}>Criar lista</button>
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .campo { margin-bottom: var(--sp-3); }
  .campo label { display: block; font-size: var(--fs-xs); color: var(--ink-light); margin-bottom: 4px; }
  .campo input, .campo select {
    width: 100%; font-size: 15px; padding: 11px var(--sp-3);
    border: 1px solid var(--border); border-radius: var(--r-md); background: var(--paper);
  }
  .toggleRow {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--sp-2) 0; font-size: var(--fs-md); border-top: 1px dashed var(--border);
    margin-top: var(--sp-2);
  }
  .toggleRow input { width: 20px; height: 20px; }
</style>
