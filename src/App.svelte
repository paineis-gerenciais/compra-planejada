<script lang="ts">
  /**
   * Casca da aplicação — v5, agora com autenticação, escopo (pessoal/
   * família), e todos os modais portados até aqui.
   */
  import { onMount } from 'svelte';
  import { app } from './lib/stores/app.svelte';
  import { MemoryRepository } from './lib/data/MemoryRepository';
  import { FirestoreRepository } from './lib/data/FirestoreRepository';
  import type { Repository } from './lib/data/repository';
  import type { Item, ShoppingList, OwnerRef, Household } from './lib/domain/types';
  import { initFirebase, observarSessao, sair as sairDaConta } from './lib/auth/firebase';
  import { migrarV4, aplicarMigracao } from './lib/data/migration';
  import { corDe, iniciais } from './lib/domain/roles';

  import Recibo from './lib/ui/Recibo.svelte';
  import EntradaRapida from './lib/ui/EntradaRapida.svelte';
  import TelaLogin from './lib/ui/TelaLogin.svelte';
  import ModoCompra from './lib/ui/ModoCompra.svelte';
  import ModalCheckout from './lib/ui/ModalCheckout.svelte';
  import TelaHistorico from './lib/ui/TelaHistorico.svelte';
  import TelaPrecos from './lib/ui/TelaPrecos.svelte';
  import TelaFamilias from './lib/ui/TelaFamilias.svelte';
  import TelaGerenciarFamilia from './lib/ui/TelaGerenciarFamilia.svelte';
  import TelaCupomOCR from './lib/ui/TelaCupomOCR.svelte';
  import TelaInsights from './lib/ui/TelaInsights.svelte';
  import ModalConfirmarPendentes from './lib/ui/ModalConfirmarPendentes.svelte';
  import ModalNovaLista from './lib/ui/ModalNovaLista.svelte';
  import TelaOnboarding from './lib/ui/TelaOnboarding.svelte';
  import ModalMoverLista from './lib/ui/ModalMoverLista.svelte';
  import ModalOrdemCorredores from './lib/ui/ModalOrdemCorredores.svelte';
  import ModalEditarItem from './lib/ui/ModalEditarItem.svelte';

  import { deveMostrarOnboarding, marcarOnboardingVisto } from './lib/servicos/onboarding';
  import { gerarPdfDaLista } from './lib/servicos/pdf';
  import { compartilharLista } from './lib/servicos/compartilhar';
  import { aisleKey, ordenarCategorias } from './lib/domain/aisles';
  import { CATEGORIAS_PADRAO } from './lib/domain/categorize';

  import {
    adicionarItens, alternarComprado, criarLista, moverItem,
    finalizarCompra, carregarPendentes, moverListaDeEscopo, registrarLoja
  } from './lib/servicos/listas';
  import {
    criarFamilia, criarConvite, revogarConvite, listarConvites,
    entrarComConvite, sairDaFamilia
  } from './lib/servicos/familias';
  import type { ConviteVisivel } from './lib/servicos/familias';

  // ---------------- repositório: memória (sem conta) ou Firestore (com conta) ----------------
  const memRepo = new MemoryRepository();
  let repo: Repository = memRepo;
  const firebase = initFirebase();

  let semConta = $state(!firebase);
  let carregandoSessao = $state(!!firebase);

  // ---------------- modais visíveis ----------------
  let modalAberto = $state<null | 'checkout' | 'historico' | 'precos' | 'familias' | 'gerenciarFamilia' | 'ocr' | 'insights' | 'finalizarPendentes' | 'novaLista' | 'moverLista' | 'ordemCorredores' | 'editarItem'>(null);
  let itensParaFinalizar = $state<Item[]>([]);
  let dadosCheckout: { store: string | null; actualTotal: number | null } | null = $state(null);
  let convitesDaCasa = $state<ConviteVisivel[]>([]);
  let mostrarOnboarding = $state(false);
  let itemEmEdicao = $state<Item | null>(null);
  let toast = $state('');
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function mostrarToast(msg: string): void {
    toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast = ''; }, 2600);
  }

  let desassinarItens: (() => void) | null = null;

  onMount(() => {
    mostrarOnboarding = deveMostrarOnboarding();
    if (!firebase) {
      app.usuario = { uid: 'local', nome: 'Você', email: null };
      app.conectar(memRepo);
      garantirListaInicial();
      return;
    }
    const unsub = observarSessao(firebase.auth, async (user) => {
      if (user) {
        semConta = false;
        repo = new FirestoreRepository(firebase.db);
        app.usuario = { uid: user.uid, nome: user.displayName ?? user.email?.split('@')[0] ?? 'Você', email: user.email };
        await tentarMigrarV4(user.uid);
        app.conectar(repo);
      } else if (semConta) {
        repo = memRepo;
        app.usuario = { uid: 'local', nome: 'Você', email: null };
        app.conectar(repo);
        garantirListaInicial();
      }
      carregandoSessao = false;
    });
    return () => { unsub(); app.desconectar(); desassinarItens?.(); };
  });

  async function garantirListaInicial() {
    if (!app.listas.length) {
      const l = criarLista(app.escopo.owner, 'Mercado');
      await repo.lists.createList(l);
    }
  }

  /** Migração v4 → v5: lê o localStorage antigo (mesma origem, mesmo domínio
   * quando publicado no lugar da v4) e importa uma vez, de forma idempotente. */
  async function tentarMigrarV4(uid: string) {
    try {
      const raw = localStorage.getItem('shopping-app-data');
      if (!raw) return;
      const jaMigrado = localStorage.getItem('v5-migrado');
      if (jaMigrado) return;
      const antigo = JSON.parse(raw);
      const r = migrarV4(antigo, { kind: 'user', id: uid }, uid);
      await aplicarMigracao(repo, r);
      localStorage.setItem('v5-migrado', '1');
    } catch (e) { console.warn('Migração v4 não pôde ser concluída automaticamente', e); }
  }

  function usarSemConta() {
    semConta = true;
    repo = memRepo;
    app.usuario = { uid: 'local', nome: 'Você', email: null };
    app.conectar(memRepo);
    garantirListaInicial();
  }

  $effect(() => {
    const id = app.listaAtiva?.id ?? null;
    desassinarItens?.();
    desassinarItens = app.conectarItens(repo, id);
  });

  $effect(() => {
    document.documentElement.dataset.tema = app.tema === 'escuro' ? 'escuro' : 'claro';
  });

  const nomeDe = (uid: string | null): string => {
    if (!uid) return '';
    if (uid === app.usuario?.uid) return 'você';
    return app.casaAtual?.members[uid]?.name ?? 'alguém';
  };

  /** PENDÊNCIA RESOLVIDA: não havia nenhuma indicação de qual família (ou
   *  "Minhas listas") está ativa no momento — só um ícone que abria o
   *  seletor às cegas. Agora fica sempre visível no cabeçalho. */
  const corDeEscopo = $derived(
    app.escopo.owner.kind === 'household' ? corDe(app.escopo.owner.id) : corDe(app.usuario?.uid ?? 'local')
  );
  const iniciaisDoEscopo = $derived(iniciais(app.escopo.nome));

  async function aoAdicionar(entradas: Parameters<typeof adicionarItens>[3]) {
    const lista = app.listaAtiva;
    if (!lista) return;
    await adicionarItens(repo, lista, app.itensDaAtiva, entradas, app.usuario?.uid ?? null);
  }
  const aoAlternar = (i: Item) => alternarComprado(repo, i, app.usuario?.uid ?? null);
  const aoRemover = (i: Item) => repo.items.deleteItem(i.listId, i.id);
  const aoMover = (i: Item, d: -1 | 1) =>
    moverItem(repo, i, app.itensDaAtiva.filter((x) => x.category === i.category), d);

  /** BUG CORRIGIDO: não existia nenhum jeito de criar uma segunda lista —
   *  a `.abas` do cabeçalho só listava as que já existiam. */
  async function aoCriarLista(nome: string, recorrente: boolean, frequenciaDias: number) {
    const lista = criarLista(app.escopo.owner, nome, recorrente, frequenciaDias);
    await repo.lists.createList(lista);
    app.listaAtivaId = lista.id;
    modalAberto = null;
  }

  /** NOVO: mover lista entre pessoal e família — a lógica já existia
   *  testada desde o bloco F; faltava só a interface. */
  async function aoMoverLista(destino: OwnerRef, nomeDestino: string) {
    const lista = app.listaAtiva;
    if (!lista) return;
    await moverListaDeEscopo(repo, lista, destino);
    modalAberto = null;
    mostrarToast(`Lista movida para ${nomeDestino}`);
  }

  /** NOVO: ordem dos corredores por mercado — mesma situação: lógica já
   *  em uso para EXIBIR a ordem salva, faltava a tela para DEFINI-la. */
  function abrirOrdemCorredores(): void {
    modalAberto = 'ordemCorredores';
  }
  async function aoSalvarOrdemCorredores(ordem: string[]) {
    const lista = app.listaAtiva;
    if (!lista || !app.usuario) return;
    const chave = aisleKey(lista);
    const atuais = app.perfil?.aisleOrders ?? {};
    const novo = { ...atuais, [chave]: { key: chave, order: ordem, updatedAt: Date.now() } };
    await repo.profiles.updateProfile(app.usuario.uid, { aisleOrders: novo });
    modalAberto = null;
    mostrarToast('Ordem salva');
  }

  /** NOVO: edição avançada de item — unidade por seletor, categoria,
   *  preço. A entrada rápida cobre o caso comum; isto cobre o resto. */
  function abrirEdicaoItem(item: Item): void {
    itemEmEdicao = item;
    modalAberto = 'editarItem';
  }
  async function aoSalvarEdicaoItem(patch: Partial<Item>) {
    if (!itemEmEdicao) return;
    await repo.items.updateItem(itemEmEdicao.listId, itemEmEdicao.id, patch);
    modalAberto = null;
    itemEmEdicao = null;
  }
  async function aoExcluirDoEditor() {
    if (!itemEmEdicao) return;
    await repo.items.deleteItem(itemEmEdicao.listId, itemEmEdicao.id);
    modalAberto = null;
    itemEmEdicao = null;
  }

  /** NOVO: geração de PDF, no formato de cupom. */
  async function aoGerarPdf() {
    const lista = app.listaAtiva;
    if (!lista) return;
    try {
      await gerarPdfDaLista(lista, app.itensDaAtiva);
    } catch (e) {
      console.error('Erro ao gerar PDF', e);
      mostrarToast('Não foi possível gerar o PDF');
    }
  }

  /** NOVO: compartilhar como texto — Web Share API (WhatsApp aparece no
   *  seletor nativo do celular) com fallback de copiar para a área de
   *  transferência em navegadores sem suporte (a maioria no desktop). */
  async function aoCompartilhar() {
    const lista = app.listaAtiva;
    if (!lista) return;
    const r = await compartilharLista(lista, app.itensDaAtiva);
    if (r.metodo === 'clipboard') mostrarToast('Lista copiada — cole no WhatsApp');
    else if (r.metodo === 'erro') mostrarToast('Não foi possível compartilhar');
  }

  // ---------------- finalizar compra ----------------
  /* C4/H1 na v5: se sobrar item pendente e a lista NÃO for recorrente,
     primeiro perguntamos se os pendentes viram uma lista nova; só depois
     entramos no checkout (valor pago + mercado). Lista recorrente pula essa
     pergunta — ela já renova sozinha com os itens desmarcados. */
  function abrirFinalizarCompra() {
    if (!app.listaAtiva) return;
    const pendentes = app.itensDaAtiva.filter((i) => !i.bought);
    if (pendentes.length && !app.listaAtiva.recurring.enabled) {
      itensParaFinalizar = pendentes;
      modalAberto = 'finalizarPendentes';
      return;
    }
    modalAberto = 'checkout';
  }

  async function aoConfirmarCheckout(dados: { store: string | null; actualTotal: number | null }) {
    const lista = app.listaAtiva;
    if (!lista) return;
    modalAberto = null;
    if (dados.store) {
      const p = await repo.profiles.getProfile(app.usuario!.uid).catch(() => null);
      const stores = registrarLoja(p, dados.store);
      await repo.profiles.updateProfile(app.usuario!.uid, { stores }).catch(() => {});
    }
    await finalizarCompra(repo, lista, app.itensDaAtiva, dados, app.usuario?.uid ?? null);
  }

  async function aoDecidirPendentes(criarNova: boolean) {
    const lista = app.listaAtiva;
    if (!lista) return;
    if (criarNova) {
      await carregarPendentes(repo, lista.owner, `${lista.baseName} 2`, itensParaFinalizar, app.usuario?.uid ?? null);
    }
    modalAberto = 'checkout';
  }

  function abrirModoCompra() { app.modoCompra = true; }
  function sairDoModoCompra() { app.modoCompra = false; }

  // ---------------- famílias ----------------
  async function aoEscolherEscopo(owner: OwnerRef, nome: string) {
    app.escopo = { owner, nome };
    modalAberto = null;
    app.conectar(repo);
  }
  async function aoCriarFamilia(nome: string) {
    if (!app.usuario) return;
    const h = await criarFamilia(repo, nome, app.usuario.uid, app.usuario.nome);
    await aoEscolherEscopo({ kind: 'household', id: h.id }, h.name);
  }
  async function aoEntrarComConvite(codigo: string) {
    if (!app.usuario) return { ok: false, erro: 'Entre com uma conta primeiro.' };
    const r = await entrarComConvite(repo, codigo, app.usuario.uid, app.usuario.nome);
    if (r.ok) await aoEscolherEscopo({ kind: 'household', id: r.household.id }, r.household.name);
    return r.ok ? { ok: true } : { ok: false, erro: r.erro };
  }
  /**
   * BUG REAL, além do já corrigido: o botão "Gerenciar" usava
   * `app.casaAtual`, que é o registro ativo da família **atualmente
   * selecionada como escopo**. Isso amarrava duas coisas que não
   * deveriam depender uma da outra: "qual lista estou vendo" e "qual
   * família estou administrando". Na prática, o botão só existia dentro
   * do escopo já ativo, e trocar de família fechava o modal antes — era
   * fácil o usuário nunca conseguir alcançar o gerenciamento de uma
   * família que não fosse a corrente.
   *
   * Correção: estado próprio (`familiaEmGerenciamento`), com sua própria
   * assinatura em tempo real ao Firestore, independente do escopo ativo.
   * Cada família agora tem um botão de gerenciar direto na lista de
   * famílias — não precisa mais "entrar" na família primeiro.
   */
  let familiaEmGerenciamento = $state<Household | null>(null);
  let desassinarFamiliaGerenciada: (() => void) | null = null;

  async function abrirGerenciarFamilia(casa: Household) {
    desassinarFamiliaGerenciada?.();
    familiaEmGerenciamento = casa; // valor imediato; o listener abaixo mantém atualizado
    desassinarFamiliaGerenciada = repo.households.watchHousehold(casa.id, (h) => {
      familiaEmGerenciamento = h;
    });
    convitesDaCasa = await listarConvites(repo, casa.id);
    modalAberto = 'gerenciarFamilia';
  }

  function fecharGerenciarFamilia() {
    desassinarFamiliaGerenciada?.();
    desassinarFamiliaGerenciada = null;
    familiaEmGerenciamento = null;
    modalAberto = null;
  }

  async function aoConvidar(papel: 'editor' | 'viewer') {
    if (!familiaEmGerenciamento || !app.usuario) return '';
    const inv = await criarConvite(repo, familiaEmGerenciamento.id, app.usuario.uid, papel);
    convitesDaCasa = await listarConvites(repo, familiaEmGerenciamento.id);
    return inv.code;
  }
  async function aoRevogarConvite(codigo: string) {
    await revogarConvite(repo, codigo);
    if (familiaEmGerenciamento) convitesDaCasa = await listarConvites(repo, familiaEmGerenciamento.id);
  }
  async function aoMudarPapel(uid: string, papel: any) {
    if (!familiaEmGerenciamento) return;
    await repo.households.setMemberRole(familiaEmGerenciamento.id, uid, papel);
  }
  async function aoRemoverMembro(uid: string) {
    if (!familiaEmGerenciamento) return;
    await repo.households.removeMember(familiaEmGerenciamento.id, uid);
  }
  async function aoSairDaFamilia() {
    if (!familiaEmGerenciamento || !app.usuario) return;
    const eraEscopoAtivo = app.escopo.owner.kind === 'household' && app.escopo.owner.id === familiaEmGerenciamento.id;
    await sairDaFamilia(repo, familiaEmGerenciamento, app.usuario.uid);
    fecharGerenciarFamilia();
    if (eraEscopoAtivo) await aoEscolherEscopo({ kind: 'user', id: app.usuario.uid }, 'Minhas listas');
  }

  // ---------------- histórico / reativar ----------------
  async function aoReativarCompra(p: (typeof app.compras)[number], somentePendentes: boolean) {
    const lista = app.listaAtiva;
    if (!lista) return;
    const fonte = somentePendentes ? p.items.filter((i) => !i.bought) : p.items;
    await carregarPendentes(repo, app.escopo.owner, p.listName, fonte.map((f, idx) => ({
      id: `hist-${idx}`, listId: lista.id, name: f.name, qty: f.qty, unit: f.unit,
      category: f.category, price: f.price, bought: false, position: idx,
      addedBy: null, boughtBy: null, assignedTo: null, createdAt: Date.now(), updatedAt: Date.now()
    })), app.usuario?.uid ?? null);
    modalAberto = null;
  }

  // ---------------- OCR ----------------
  async function aoConfirmarOcr(itens: Array<{ name: string; qty: string; price: number | null }>, loja: string | null) {
    const lista = app.listaAtiva;
    modalAberto = null;
    if (!lista || !itens.length) return;
    await adicionarItens(repo, lista, app.itensDaAtiva,
      itens.map((i) => ({ name: i.name, qty: i.qty, unit: '', category: '', price: i.price })),
      app.usuario?.uid ?? null);
    if (loja) {
      const p = await repo.profiles.getProfile(app.usuario!.uid).catch(() => null);
      await repo.profiles.updateProfile(app.usuario!.uid, { stores: registrarLoja(p, loja) }).catch(() => {});
    }
  }

  // ---------------- insights (H4/H5) ----------------
  async function aoCriarListaSugerida(itens: Array<{ name: string; category: string; unit: string; price: number | null }>) {
    modalAberto = null;
    const nova = await carregarPendentes(repo, app.escopo.owner, 'Sugestões', itens.map((it, idx) => ({
      id: `sug-${idx}`, listId: '', name: it.name, qty: '1', unit: it.unit,
      category: it.category, price: it.price, bought: false, position: idx,
      addedBy: null, boughtBy: null, assignedTo: null, createdAt: Date.now(), updatedAt: Date.now()
    })), app.usuario?.uid ?? null);
    app.listaAtivaId = nova.id;
  }
</script>

{#if carregandoSessao}
  <div class="carregando">Carregando...</div>
{:else if !app.usuario && !semConta}
  <TelaLogin auth={firebase!.auth} onUsarSemConta={usarSemConta} />
{:else if mostrarOnboarding}
  <TelaOnboarding onConcluir={() => { marcarOnboardingVisto(); mostrarOnboarding = false; }} />
{:else}
  <header>
    <h1><span class="ponto">●</span> Compra Planejada</h1>
    <button
      class="escopoPill"
      title={semConta ? undefined : 'Trocar entre suas listas e famílias'}
      disabled={semConta}
      onclick={() => (modalAberto = 'familias')}
    >
      <span class="escopoAvatar" style:background={corDeEscopo}>{iniciaisDoEscopo}</span>
      <span class="escopoNome">{app.escopo.nome}</span>
      {#if !semConta}<span class="escopoSeta" aria-hidden="true">▾</span>{/if}
    </button>
    <div class="linhaTopo">
      <div class="abas" role="tablist" aria-label="Listas">
        {#each app.listas as l (l.id)}
          <button role="tab" aria-selected={l.id === app.listaAtiva?.id}
            class:ativa={l.id === app.listaAtiva?.id}
            onclick={() => (app.listaAtivaId = l.id)}>{l.name}</button>
        {/each}
        {#if app.podeEditar}
          <button class="novaLista" title="Nova lista" aria-label="Nova lista" onclick={() => (modalAberto = 'novaLista')}>+</button>
        {/if}
      </div>
      <div class="ferramentas">
        <button title="Preços" onclick={() => (modalAberto = 'precos')}>💰</button>
        <button title="Insights" onclick={() => (modalAberto = 'insights')}>💡</button>
        <button title="Ler cupom" onclick={() => (modalAberto = 'ocr')}>📷</button>
        <button title="Histórico" onclick={() => (modalAberto = 'historico')}>🕘</button>
      </div>
    </div>
  </header>

  <main>
    {#if app.modoCompra && app.listaAtiva}
      <ModoCompra
        lista={app.listaAtiva} itens={app.itensDaAtiva}
        ordens={app.perfil?.aisleOrders ?? {}} online={app.presenca}
        onToggle={aoAlternar} onSair={sairDoModoCompra} onFinalizar={abrirFinalizarCompra}
        onAdicionar={(texto) => aoAdicionar([{ name: texto, qty: '1', unit: '', category: '' } as any])}
      />
    {:else if app.listaAtiva}
      <Recibo
        lista={app.listaAtiva} itens={app.itensDaAtiva}
        ordens={app.perfil?.aisleOrders ?? {}} ocultarComprados={app.ocultarComprados}
        podeEditar={app.podeEditar} {nomeDe}
        onToggle={aoAlternar} onRemover={aoRemover} onMover={aoMover} onEditar={abrirEdicaoItem}
      />
      <div class="entrada-area">
        <EntradaRapida onAdicionar={aoAdicionar} conhecidos={app.perfil?.itemStats ?? {}} desabilitado={!app.podeEditar} />
        <div class="acoesLista">
          <button class="primaria" onclick={abrirModoCompra}>🛒 Modo compra</button>
          <button onclick={abrirFinalizarCompra}>✓ Finalizar compra</button>
        </div>
        <div class="acoesSecundarias">
          <button onclick={() => (modalAberto = 'moverLista')}>🔀 Mover lista</button>
          <button onclick={abrirOrdemCorredores}>🧭 Corredores</button>
          <button onclick={aoGerarPdf}>🧾 PDF</button>
          <button onclick={aoCompartilhar}>🔗 Compartilhar</button>
        </div>
      </div>
    {:else}
      <p class="vazio">Nenhuma lista ainda.</p>
    {/if}
  </main>

  {#if toast}<div class="toast" role="status">{toast}</div>{/if}

  {#if modalAberto === 'novaLista'}
    <ModalNovaLista onCriar={aoCriarLista} onFechar={() => (modalAberto = null)} />
  {:else if modalAberto === 'moverLista' && app.listaAtiva}
    <ModalMoverLista
      lista={app.listaAtiva} escopoPessoal={{ kind: 'user', id: app.usuario!.uid }}
      nomePessoal="Minhas listas" minhasCasas={app.casas}
      onMover={aoMoverLista} onFechar={() => (modalAberto = null)}
    />
  {:else if modalAberto === 'ordemCorredores' && app.listaAtiva}
    <ModalOrdemCorredores
      tituloLoja={app.listaAtiva.location?.value ? `no ${app.listaAtiva.location.value}` : 'no mercado'}
      categorias={ordenarCategorias(
        [...new Set([...CATEGORIAS_PADRAO, ...app.itensDaAtiva.map((i) => i.category).filter(Boolean)])],
        app.perfil?.aisleOrders ?? {},
        app.listaAtiva
      )}
      onSalvar={aoSalvarOrdemCorredores} onFechar={() => (modalAberto = null)}
    />
  {:else if modalAberto === 'editarItem' && itemEmEdicao}
    <ModalEditarItem
      item={itemEmEdicao}
      categoriasConhecidas={app.itens.map((i) => i.category).filter(Boolean)}
      onSalvar={aoSalvarEdicaoItem} onExcluir={aoExcluirDoEditor}
      onFechar={() => { modalAberto = null; itemEmEdicao = null; }}
    />
  {:else if modalAberto === 'checkout'}
    <ModalCheckout
      itens={app.itensDaAtiva} lojas={app.perfil?.stores ?? []}
      lojaSugerida={app.listaAtiva?.location?.value ?? ''}
      onConfirmar={aoConfirmarCheckout} onFechar={() => (modalAberto = null)}
    />
  {:else if modalAberto === 'finalizarPendentes'}
    <ModalConfirmarPendentes
      pendentes={itensParaFinalizar}
      onDecidir={aoDecidirPendentes}
      onFechar={() => (modalAberto = null)}
    />
  {:else if modalAberto === 'historico'}
    <TelaHistorico compras={app.compras} onFechar={() => (modalAberto = null)} onReativar={aoReativarCompra} />
  {:else if modalAberto === 'precos'}
    <TelaPrecos precos={app.precos} compras={app.compras} onFechar={() => (modalAberto = null)}
      onAdicionarNaLista={(r) => { if (app.listaAtiva) aoAdicionar([{ name: r.nome, qty: '1', unit: r.unit, category: '' } as any]); modalAberto = null; }} />
  {:else if modalAberto === 'familias'}
    <TelaFamilias
      escopoAtual={app.escopo.owner} minhasCasas={app.casas} uid={app.usuario!.uid} nome={app.usuario!.nome}
      onEscolher={aoEscolherEscopo} onCriar={aoCriarFamilia} onEntrar={aoEntrarComConvite}
      onGerenciar={abrirGerenciarFamilia} onFechar={() => (modalAberto = null)}
    />
  {:else if modalAberto === 'gerenciarFamilia' && familiaEmGerenciamento}
    <TelaGerenciarFamilia
      household={familiaEmGerenciamento} uid={app.usuario!.uid} souDono={familiaEmGerenciamento.ownerUid === app.usuario!.uid}
      convites={convitesDaCasa} linkBase={location.origin + location.pathname}
      onConvidar={aoConvidar} onRevogar={aoRevogarConvite} onMudarPapel={aoMudarPapel}
      onRemover={aoRemoverMembro} onSair={aoSairDaFamilia} onFechar={fecharGerenciarFamilia}
    />
  {:else if modalAberto === 'ocr'}
    <TelaCupomOCR onConfirmar={aoConfirmarOcr} onFechar={() => (modalAberto = null)} />
  {:else if modalAberto === 'insights'}
    <TelaInsights
      precos={app.precos} stats={app.perfil?.itemStats ?? {}}
      jaNasListas={app.itens.map((i) => i.name)}
      onFechar={() => (modalAberto = null)} onCriarListaSugerida={aoCriarListaSugerida}
    />
  {/if}
{/if}

<style>
  .carregando { display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--ink-light); font-family: var(--font-mono); }
  header { position: sticky; top: 0; z-index: var(--z-header); background: var(--paper); border-bottom: 1px solid var(--border); padding: var(--sp-3) var(--sp-4); }
  h1 { font-family: var(--font-mono); font-size: var(--fs-lg); letter-spacing: var(--tracking-stamp); margin: 0 0 var(--sp-2); }
  .ponto { color: var(--green); }

  .escopoPill {
    display: inline-flex; align-items: center; gap: 7px; max-width: 100%;
    font-family: var(--font-mono); font-size: 11px; color: var(--ink);
    border: 1px solid var(--border); border-radius: var(--r-pill); padding: 4px 10px 4px 5px;
    background: var(--card); margin-bottom: var(--sp-2); min-height: 30px;
  }
  .escopoPill:disabled { opacity: 0.7; }
  .escopoAvatar {
    width: 19px; height: 19px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 8.5px; font-weight: 700; color: #fff;
  }
  .escopoNome { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
  .escopoSeta { color: var(--ink-light); font-size: 9px; }

  .linhaTopo { display: flex; gap: var(--sp-2); align-items: center; }
  .abas { display: flex; gap: var(--sp-2); overflow-x: auto; padding-bottom: 2px; flex: 1; }
  .abas button { font-family: var(--font-mono); font-size: var(--fs-sm); padding: var(--sp-2) var(--sp-3); border-radius: var(--r-pill); border: 1px solid var(--border); background: var(--card); color: var(--ink-light); white-space: nowrap; min-height: 36px; }
  .abas button.ativa { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .abas button.novaLista {
    flex-shrink: 0; width: 36px; padding: 0; font-size: 18px; font-weight: 700;
    color: var(--green); border-color: var(--green); border-style: dashed;
  }
  .ferramentas { display: flex; gap: 4px; flex-shrink: 0; }
  .ferramentas button { width: 34px; height: 34px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--card); font-size: 15px; }
  main { padding: var(--sp-4); }
  .entrada-area { max-width: 560px; margin: 0 auto; }
  .acoesLista { display: flex; gap: var(--sp-2); margin-top: var(--sp-3); }
  .acoesLista button { flex: 1; font-family: var(--font-mono); font-weight: 700; font-size: 13px; padding: 12px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--card); min-height: var(--tap); }
  .acoesLista button.primaria { background: var(--green); color: #fff; border-color: var(--green); }
  .acoesSecundarias { display: flex; gap: var(--sp-2); margin-top: var(--sp-2); flex-wrap: wrap; }
  .acoesSecundarias button {
    flex: 1; min-width: 120px; font-family: var(--font-mono); font-size: 11.5px;
    padding: 9px; border-radius: var(--r-md); border: 1px solid var(--border);
    background: var(--card); color: var(--ink-light); min-height: 38px;
  }
  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
    background: var(--ink); color: var(--paper); font-family: var(--font-mono); font-size: 12.5px;
    padding: 10px 18px; border-radius: var(--r-pill); z-index: 70; max-width: 90vw; text-align: center;
    box-shadow: 0 8px 20px -6px rgba(0,0,0,0.4);
  }
  .vazio { text-align: center; color: var(--ink-light); padding: var(--sp-6); }
</style>
