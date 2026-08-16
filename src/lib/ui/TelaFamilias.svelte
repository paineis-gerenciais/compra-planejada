<script lang="ts">
  import Modal from './Modal.svelte';
  import type { Household, OwnerRef, Invite } from '../domain/types';
  import { iniciais, corDe, papelPorExtenso, ehResponsavel } from '../domain/roles';

  interface Props {
    escopoAtual: OwnerRef;
    minhasCasas: Household[];
    uid: string;
    nome: string;
    onEscolher: (o: OwnerRef, nomeExibicao: string) => void;
    onCriar: (nome: string) => void;
    onEntrar: (codigo: string) => Promise<{ ok: boolean; erro?: string }>;
    onGerenciar: (h: Household) => void;
    onFechar: () => void;
  }
  let { escopoAtual, minhasCasas, uid, nome, onEscolher, onCriar, onEntrar, onGerenciar, onFechar }: Props = $props();

  let tela = $state<'lista' | 'criar' | 'entrar'>('lista');
  let nomeNova = $state('');
  let codigo = $state('');
  let erro = $state('');
  let ocupado = $state(false);

  async function confirmarEntrada() {
    ocupado = true; erro = '';
    const r = await onEntrar(codigo);
    ocupado = false;
    if (!r.ok) erro = r.erro ?? 'Não foi possível entrar.';
    else tela = 'lista';
  }
</script>

{#if tela === 'lista'}
  <Modal titulo="Listas compartilhadas" {onFechar}>
    <p class="sub">Uma família tem suas próprias listas, visíveis para todo mundo que participa.</p>

    <button class="casa" class:ativa={escopoAtual.kind === 'user'} onclick={() => onEscolher({ kind: 'user', id: uid }, 'Minhas listas')}>
      <span class="avatar" style:background={corDe(uid)}>{iniciais(nome)}</span>
      <span class="info"><span class="nomeCasa">Minhas listas</span><span class="subCasa">só você</span></span>
      {#if escopoAtual.kind === 'user'}<span class="check">✓</span>{/if}
    </button>

    {#each minhasCasas as h (h.id)}
      <button class="casa" class:ativa={escopoAtual.kind === 'household' && escopoAtual.id === h.id}
        onclick={() => onEscolher({ kind: 'household', id: h.id }, h.name)}>
        <span class="avatar" style:background={corDe(h.id)}>{iniciais(h.name)}</span>
        <span class="info">
          <span class="nomeCasa">{h.name}</span>
          <span class="subCasa">{h.memberUids.length} {h.memberUids.length === 1 ? 'pessoa' : 'pessoas'} · você é {papelPorExtenso(h.members[uid]?.role ?? 'viewer')}</span>
        </span>
        {#if escopoAtual.kind === 'household' && escopoAtual.id === h.id}<span class="check">✓</span>{/if}
      </button>
    {/each}

    <div class="opcoes">
      <button class="opcao" onclick={() => (tela = 'criar')}>
        <span class="icone">👨‍👩‍👧</span>
        <span class="texto"><strong>Criar uma família</strong><span>Listas compartilhadas com quem você convidar</span></span>
      </button>
      <button class="opcao" onclick={() => (tela = 'entrar')}>
        <span class="icone">🔑</span>
        <span class="texto"><strong>Entrar com um convite</strong><span>Se alguém te mandou um código ou link</span></span>
      </button>
      {#if escopoAtual.kind === 'household'}
        {@const casa = minhasCasas.find((h) => h.id === escopoAtual.id)}
        {#if casa}
          <button class="opcao" onclick={() => onGerenciar(casa)}>
            <span class="icone">⚙️</span>
            <span class="texto"><strong>Gerenciar "{casa.name}"</strong><span>Membros, convites e permissões</span></span>
          </button>
        {/if}
      {/if}
    </div>
  </Modal>
{:else if tela === 'criar'}
  <Modal titulo="Criar família" onFechar={() => (tela = 'lista')}>
    <p class="sub">Dê um nome. Depois você convida quem quiser.</p>
    <div class="campo"><input bind:value={nomeNova} placeholder="Ex: Casa, Família Silva" /></div>
    {#snippet rodape()}
      <button onclick={() => (tela = 'lista')}>Cancelar</button>
      <button class="primario" onclick={() => { if (nomeNova.trim()) { onCriar(nomeNova.trim()); nomeNova = ''; tela = 'lista'; } }}>Criar</button>
    {/snippet}
  </Modal>
{:else}
  <Modal titulo="Entrar numa família" onFechar={() => (tela = 'lista')}>
    <p class="sub">Cole o código de 8 letras que te enviaram.</p>
    <div class="campo"><input bind:value={codigo} maxlength="8" style="text-transform:uppercase;letter-spacing:3px;font-family:var(--font-mono);" placeholder="ABCD2345" /></div>
    {#if erro}<p class="erro">{erro}</p>{/if}
    {#snippet rodape()}
      <button onclick={() => (tela = 'lista')}>Cancelar</button>
      <button class="primario" disabled={ocupado} onclick={confirmarEntrada}>Entrar</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .casa {
    display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3); margin-bottom: var(--sp-2);
    border: 1px solid var(--border); border-radius: var(--r-md); background: var(--card); width: 100%; text-align: left;
  }
  .casa.ativa { border-color: var(--green); background: var(--green-light); }
  .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-family: var(--font-mono); font-weight: 700; font-size: 12px; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  .nomeCasa { display: block; font-size: var(--fs-md); font-weight: 600; }
  .subCasa { display: block; font-size: 11.5px; color: var(--ink-light); font-family: var(--font-mono); }
  .check { color: var(--green); font-size: 15px; }
  .opcoes { margin-top: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-2); }
  .opcao { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--card); text-align: left; }
  .icone { font-size: 20px; }
  .texto { display: flex; flex-direction: column; }
  .texto span { font-size: 12px; color: var(--ink-light); font-weight: 400; }
  .campo input { width: 100%; padding: 11px var(--sp-3); border: 1px solid var(--border); border-radius: var(--r-md); font-size: 15px; }
  .erro { color: var(--red); font-size: 12.5px; background: var(--amber-light); padding: 9px 11px; border-radius: var(--r-sm); }
</style>
