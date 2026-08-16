<script lang="ts">
  import Modal from './Modal.svelte';
  import type { Household, Role } from '../domain/types';
  import type { ConviteVisivel } from '../servicos/familias';
  import { iniciais, corDe, papelPorExtenso } from '../domain/roles';

  interface Props {
    household: Household;
    uid: string;
    souDono: boolean;
    convites: ConviteVisivel[];
    linkBase: string;
    onConvidar: (papel: Exclude<Role, 'owner'>) => Promise<string>;
    onRevogar: (codigo: string) => void;
    onMudarPapel: (uid: string, papel: Role) => void;
    onRemover: (uid: string) => void;
    onSair: () => void;
    onFechar: () => void;
  }
  let {
    household, uid, souDono, convites, linkBase,
    onConvidar, onRevogar, onMudarPapel, onRemover, onSair, onFechar
  }: Props = $props();

  let novoCodigo = $state<string | null>(null);
  let papelConvite = $state<Exclude<Role, 'owner'>>('editor');
  const membros = $derived(
    Object.entries(household.members).map(([id, m]) => ({ uid: id, ...m }))
      .sort((a, b) => a.joinedAt - b.joinedAt)
  );

  async function convidar() {
    novoCodigo = await onConvidar(papelConvite);
  }
  function copiarLink(code: string) {
    navigator.clipboard?.writeText(`${linkBase}?convite=${code}`).catch(() => {});
  }
</script>

<Modal titulo={household.name} {onFechar}>
  <p class="sub">{membros.length} {membros.length === 1 ? 'pessoa' : 'pessoas'}.
    {souDono ? 'Como responsável, você convida, muda permissões e remove pessoas.' : 'Só o responsável pode convidar.'}</p>

  {#if souDono}
    <div class="conviteBox">
      <select bind:value={papelConvite}>
        <option value="editor">Convidar como editor</option>
        <option value="viewer">Convidar como só leitura</option>
      </select>
      <button onclick={convidar}>Gerar convite</button>
    </div>
    {#if novoCodigo}
      <div class="codigoBox">
        <div class="codigo">{novoCodigo}</div>
        <p class="nota">Vale por 7 dias.</p>
        <button onclick={() => copiarLink(novoCodigo!)}>Copiar link</button>
      </div>
    {/if}

    {#if convites.filter((c) => c.situacao === 'ativo').length}
      <span class="rotulo">Convites ativos</span>
      {#each convites.filter((c) => c.situacao === 'ativo') as c (c.code)}
        <div class="conviteRow">
          <span>{c.code} · {papelPorExtenso(c.role)}</span>
          <button class="mini" onclick={() => onRevogar(c.code)}>Revogar</button>
        </div>
      {/each}
    {/if}
  {/if}

  <span class="rotulo">Membros</span>
  {#each membros as m (m.uid)}
    <div class="membro">
      <span class="avatar" style:background={corDe(m.uid)}>{iniciais(m.name)}</span>
      <span class="info">
        <span class="nome">{m.name}{#if m.uid === uid} (você){/if}</span>
        <span class="sub2">entrou em {new Date(m.joinedAt).toLocaleDateString('pt-BR')}</span>
      </span>
      {#if souDono && m.uid !== uid}
        <select value={m.role} onchange={(e) => onMudarPapel(m.uid, (e.target as HTMLSelectElement).value as Role)}>
          <option value="editor">editor</option>
          <option value="viewer">só leitura</option>
          <option value="owner">responsável</option>
        </select>
        <button class="remover" aria-label="Remover {m.name}" onclick={() => onRemover(m.uid)}>&times;</button>
      {:else}
        <span class="badge">{papelPorExtenso(m.role)}</span>
      {/if}
    </div>
  {/each}

  {#snippet rodape()}
    <button onclick={onFechar}>Fechar</button>
    <button class="perigo" onclick={onSair}>{souDono && membros.length === 1 ? 'Excluir família' : 'Sair da família'}</button>
  {/snippet}
</Modal>

<style>
  .sub { font-size: var(--fs-sm); color: var(--ink-light); line-height: 1.5; margin: 0 0 var(--sp-3); }
  .rotulo { display: block; font-size: 12px; font-weight: 600; color: var(--ink-light); margin: var(--sp-4) 0 6px; text-transform: uppercase; letter-spacing: 0.4px; }
  .conviteBox { display: flex; gap: var(--sp-2); }
  .conviteBox select { flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: var(--r-md); }
  .conviteBox button { background: var(--green); color: #fff; border: none; border-radius: var(--r-md); padding: 0 var(--sp-3); }
  .codigoBox { background: var(--amber-light); border: 1px dashed var(--amber); border-radius: var(--r-md); padding: var(--sp-3); margin-top: var(--sp-2); text-align: center; }
  .codigo { font-family: var(--font-mono); font-size: 19px; font-weight: 700; letter-spacing: 3px; }
  .nota { font-size: 11.5px; color: var(--ink-light); margin: 4px 0 8px; }
  .conviteRow { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-family: var(--font-mono); font-size: 12px; }
  .mini { font-size: 11px; padding: 4px 8px; border: 1px solid var(--border); border-radius: var(--r-sm); background: none; }
  .membro { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) 0; border-bottom: 1px dashed var(--border); }
  .avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  .nome { display: block; font-size: 14px; }
  .sub2 { display: block; font-size: 11px; color: var(--ink-light); font-family: var(--font-mono); }
  .membro select { font-family: var(--font-mono); font-size: 11px; padding: 4px; border: 1px solid var(--border); border-radius: var(--r-sm); }
  .remover { background: none; border: none; color: var(--red); font-size: 16px; min-width: 32px; min-height: 32px; }
  .badge { font-family: var(--font-mono); font-size: 9.5px; text-transform: uppercase; padding: 2px 7px; border-radius: var(--r-pill); border: 1px solid var(--border); color: var(--ink-light); }
</style>
