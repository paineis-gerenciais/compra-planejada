# Diagnóstico de engenharia front-end — Compra Planejada v5.0.0

Data: 2026-11-09 · Branch `claude/affectionate-babbage-oa5b5c` · Escopo: leitura e medição; nenhum código de produto alterado.
Rótulos: [FATO] com evidência, [HIPÓTESE] a validar, [RECOMENDAÇÃO].

## Resumo
1. O código Svelte 5 está acima da média: runes usadas corretamente, props tipadas, componentes de apresentação puros, lógica em `domain/`, zero erros de tipo, 132 testes, drag-and-drop com `touch-action: none` e alternativa por botões.
2. O maior problema é o carregamento: um chunk de 788 kB (238 kB gzip) em que o Firebase pesa cerca de 80% da fonte, carregado antes mesmo da tela de login.
3. O PWA não funciona offline em partida a frio: `/index.html` nunca entra no cache do service worker. A documentação diz "funciona offline"; o código não entrega isso para a primeira abertura sem rede.
4. Acessibilidade de modais é o ponto fraco real: `Modal.svelte` não move, não prende nem devolve o foco, e não trava o scroll. O restante (rótulos, `aria-label`, `focus-visible`, movimento reduzido) está bem feito.
5. Estados de erro e de sincronização são invisíveis ao usuário: todos os `onSnapshot` só fazem `console.error`, e `app.sincronizacao` nunca é lido nem escrito.

## Medições
| O quê | Comando | Resultado |
|---|---|---|
| Tipos e avisos | `npm run check 2>&1 \| tail -3` | `COMPLETED 356 FILES 0 ERRORS 10 WARNINGS 5 FILES_WITH_PROBLEMS` |
| Build (pasta exclusiva) | `npx vite build --outDir <scratchpad>/dist-fe --emptyOutDir` | ok em 1,50 s; 424 módulos; aviso de chunk > 500 kB |
| Chunk principal | idem | `index-*.js` 787,79 kB / 237,70 kB gzip |
| Chunks sob demanda | idem | jspdf 399,88 / 129,74 gzip; html2canvas 199,57 / 46,84; index.es 151,60 / 48,97; purify 27,19 / 10,58; `src-*.js` 17,27 / 7,32 |
| CSS | idem | 34,47 kB / 6,00 kB gzip |
| Composição do chunk principal | script Python sobre `index-*.js.map` (tamanho do código-fonte original por pacote; `source-map-explorer` falhou com o mapa do Rolldown: "generated column Infinity") | firestore 45,1%; auth 16,8%; svelte 13,1%; re2js 9,1%; código próprio 8,2%; @firebase/util 2,7%; webchannel 1,9%; app 1,7%; resto <1,5%. Firebase + re2js ≈ 78% da fonte |
| Lighthouse mobile (4G lento, CPU 4x) | `lighthouse http://127.0.0.1:4599/` sobre `dist-fe` (python `http.server`, sem gzip, sem cabeçalhos de cache) | Desempenho 77, Acessibilidade 100, Boas práticas 96, SEO 90; FCP 1,5 s; **LCP 6,7 s**; TBT 60 ms; CLS 0,008; TTI 6,7 s; JS não usado 641 KiB; sem `meta description` |
| Servidor e processos | `kill` do `http.server`; `pgrep` | encerrado |

Ressalvas do Lighthouse [FATO]: servidor local sem compressão (788 kB trafegados crus) e o proxy bloqueou hosts do Google. O LCP de 6,7 s está inflado e não representa produção; serve como ordem de grandeza e para o ranking de auditorias. A nota 100 de acessibilidade cobre só a primeira tela (login), não o app autenticado.

### Os 10 avisos do svelte-check (`npx svelte-check --output human`)
| # | Arquivo:linha | Mensagem | Defeito real? |
|---|---|---|---|
| 1 | ModoCompra.svelte:106 | `<section>` com pointermove/up/cancel sem role (`a11y_no_static_element_interactions`) | Não afeta usuário; handlers só delegam ao arrasto. Baixo |
| 2 | ModoCompra.svelte:107 | `autofocus` (`a11y_autofocus`) | Parcial: foco programático ao abrir o campo é desejável, mas o aviso aponta falta de gestão de foco no resto. Baixo |
| 3 | ModalCheckout.svelte:20 | `lojaSugerida` captura só o valor inicial | Latente. O modal nasce ao abrir e a prop vem do estado da lista; não muda com ele aberto |
| 4 | ModalOrdemCorredores.svelte:13 | `categorias` captura só o valor inicial | Latente, mas com efeito: se um colega adicionar item com categoria nova durante a edição, ela não aparece. Baixo |
| 5-10 | ModalEditarItem.svelte:16,17,18,19,20,20 | `item` captura só o valor inicial (nome, qty, unit, categoria, preço) | **Falso positivo hoje.** `App.svelte:377` grava `itemEmEdicao` uma vez ao abrir e o componente é destruído ao fechar; o modal não reabre "com outro item" sem remontar (`{:else if modalAberto === 'editarItem' && itemEmEdicao}`). É a intenção (formulário com rascunho). Silenciar com comentário `svelte-ignore state_referenced_locally` ou receber valores iniciais explícitos |

Nenhum dos 10 é bug em produção. Mantê-los é custo: o aviso novo e legítimo se perde no ruído.

## Pontos fortes
- [FATO] Runes bem aplicadas: `$state`, `$derived`, `$derived.by`, `$props` com `interface Props` em todos os componentes lidos. Classe `AppState` com campos `$state` e `$derived` (`src/lib/stores/app.svelte.ts`).
- [FATO] Assinaturas centralizadas: `conectar()` chama `desconectar()` antes de reassinar; `$effect` de itens (`App.svelte:181`) cancela a anterior; `onMount` devolve a limpeza. Sem vazamento aparente de listeners.
- [FATO] `Firestore` com `persistentLocalCache` + `persistentMultipleTabManager` (`src/lib/auth/firebase.ts:49-50`): dados funcionam offline depois do primeiro carregamento.
- [FATO] jsPDF e Tesseract já são `import()` dinâmicos (`pdf.ts:14`, `ocr.ts:16`); fora do caminho crítico.
- [FATO] Componentes de apresentação puros (callbacks, sem repositório); regras em `domain/`; `dragReorder.ts` puro e testado.
- [FATO] Drag-and-drop: `touch-action: none` apenas na alça (`ItemLinha.svelte:134`), `setPointerCapture` com try/catch, botões ▲▼ como alternativa por teclado. Scroll da lista não é bloqueado.
- [FATO] Acessibilidade de base: `label for`, `aria-label` em ícones das listas/itens, `aria-pressed` no check, `role="alert"` em erros de login, `role="status"` no toast, `aria-live` na prévia, `:focus-visible` global, `prefers-reduced-motion`, `viewport-fit=cover` e `env(safe-area-inset-bottom)`.
- [FATO] SW exclui hosts do Firebase e só trata GET; `firebase.json` com `immutable` em `/assets/**` e `no-cache` no `sw.js`.
- [FATO] Fallbacks reais para Web Share (clipboard) e Wake Lock (vídeo, dica).

## Pontos fracos
| Sev. | Achado | Evidência | Recomendação |
|---|---|---|---|
| Alto | Offline em partida a frio falha: navegação não é gravada no cache; o fallback `caches.match('/index.html')` só acerta se `/index.html` tiver sido pedido como asset | `public/sw.js:35-38` (navigate só `fetch`, sem `cache.put`); `install` sem pré-cache (`sw.js:12`) | Pré-cachear o shell na instalação (ver M1). Testar: instalar, desligar rede, reabrir |
| Alto | Chunk principal carrega Firebase auth+firestore antes de qualquer tela; 641 KiB de JS não usados no login | Medições (composição; Lighthouse `unused-javascript`); `App.svelte:12-13,43` importa estático | Dividir: auth primeiro, Firestore após sessão (M2) |
| Médio | Modal sem gestão de foco: não foca ao abrir, não prende (Tab sai para o fundo), não devolve foco ao gatilho, sem `inert` no fundo, sem trava de scroll | `Modal.svelte:11-20` (só Esc e clique no fundo); `TelaLogin.svelte:46` e `TelaOnboarding.svelte:48` têm `role="dialog"` sem foco | `showModal()` em `<dialog>` (traz foco, trap, Esc, `inert`) ou `focus()` + `inert` no `#app` + `overflow:hidden` no body (M3). Afeta os 13 modais de uma vez |
| Médio | Falhas de leitura invisíveis: listeners só logam; sem estado de erro, de carregando nas listas ou de offline | `FirestoreRepository.ts:66,111,165,182,205,226,231,330`; `app.sincronizacao` declarado (`app.svelte.ts:38`) e nunca usado | Ligar o callback de erro a `app.sincronizacao`; faixa "Sem conexão / sincronizando / erro de permissão" no cabeçalho com `aria-live`; esqueleto na primeira carga (M4) |
| Médio | Escritas sem tratamento de erro no App (`aoAlternar`, `aoRemover`, `aoSalvarEdicaoItem`...) devolvem promessa solta; falha vira rejeição não tratada | `App.svelte:207-209,266-271` | Envolver em helper que captura e chama `mostrarToast` |
| Médio | Atalho do manifest sem tratador: `/?acao=nova-lista` abre o app normal | `public/manifest.json:33-35`; `grep acao src` sem resultado | Ler `location.search` no `onMount` e abrir `novaLista`, ou remover o atalho |
| Médio | Wake Lock não é readquirido ao voltar à aba (o sistema libera ao ocultar) | `ModoCompra.svelte:42-65,80-83`: sem `visibilitychange` | Reabrir o lock em `visibilitychange`. Hoje a tela apaga no corredor após qualquer troca de app |
| Médio | Fontes do Google bloqueiam renderização e não ficam no cache do SW (offline = fonte de sistema; Space Mono vira `monospace` genérico) | `index.html:11-13`; `sw.js:30` ignora outra origem; Lighthouse `render-blocking-insight` 900 ms | Autohospedar woff2 com `preload` (M5). Efeito colateral positivo: remove envio de IP ao Google (LGPD; ver Fora do meu papel) |
| Médio | OCR depende de CDN de terceiros em tempo de execução (worker, WASM core, `por.traineddata`) e não funciona offline | `node_modules/tesseract.js/src/worker/browser/defaultOptions.js:11`; `worker-script/index.js:130` (jsdelivr) | Autohospedar worker, core e idioma em `public/ocr/` com `workerPath/corePath/langPath` (M6); pré-cachear sob demanda |
| Médio | Tamanhos de alvo abaixo do token `--tap` (44 px): ferramentas 34x34, conta 30x30, pill de escopo 30 px, ▲▼ ~16 px, alça ⠿ ~20 px, abas 36 px | `App.svelte:627,656` (`.contaBtn`, `.ferramentas button`, `.escopoPill`); `ItemLinha.svelte:115-127` | Subir para 44 px ou aumentar área com `::after`. Decisão visual: ui-product-design |
| Médio | Botões de ferramentas só com emoji e `title`: `title` não é nome acessível confiável em toque; emoji varia por SO | `App.svelte:510-513` (💰💡📷🕘), `contaBtn` 👤 tem `aria-label` | Acrescentar `aria-label` e ícones SVG (consistência visual com o `check`) |
| Médio | Sem alternador de tema nem `prefers-color-scheme`; `app.tema` nunca muda; tema escuro é código morto | `app.svelte.ts:37`; `App.svelte:188`; `grep tema` | Inicializar com `matchMedia('(prefers-color-scheme: dark)')` + alternador na conta, persistido (M7). `theme-color` também precisa de variante |
| Médio | `role="tab"` sem teclado de abas: sem setas, sem `tabindex` móvel, sem `tabpanel`/`aria-controls`; Onboarding usa `tablist` nos pontos | `App.svelte:499-505`; `TelaOnboarding.svelte:58` | Implementar padrão APG (setas/Home/End, roving tabindex) ou trocar por botões com `aria-current="true"` (mais simples) |
| Médio | Fontes de 10-12,5 px em texto de leitura (`--fs-xs: 11px`; etiquetas 10px; pill 11px; 24 ocorrências de 9-11px) | `app.css:60-61`; `ItemLinha.svelte:96`; busca `font-size: (9\|10\|11)` | Piso de 12 px para texto, 14 px para conteúdo principal; respeitar zoom de texto com `rem` |
| Médio | Sem breakpoints: só `min-width:560px` em modal; layout de 560 px centrado; cabeçalho ocupa a largura toda em desktop/tablet; `orientation: portrait` no manifest trava paisagem | `Modal.svelte:29,35`; `App.svelte` `.entrada-area`; `manifest.json:7` | Container central único (`max-width` no `main`/`header`) e remover `orientation` (tablet e uso em carrinho com suporte) |
| Baixo | `as any` em props e eventos: `onAdicionar` e `onAdicionarNaLista` forçam `ParsedItem` sem `as any` | `App.svelte:524,596`; `aoMudarPapel(uid, papel: any)` em `App.svelte:421` (tipo `Role` já existe); `Modal.svelte` `children: any`; `ModoCompra` `ordens: Record<string, any>` e `wakeLock: any`; `ocr.ts:17` `m: any` | `children: Snippet`, `rodape?: Snippet`; `Role`; completar campos de `ParsedItem` ou criar `NovoItem`; `Record<string, AisleOrder>` |
| Baixo | Ditado por voz some em Safari/Firefox sem explicação; sem tratamento de permissão negada; `rec.onerror` só desliga | `EntradaRapida.svelte:26-27,57` | Mostrar mensagem em erro (`not-allowed`); aceitável esconder quando não há suporte |
| Baixo | `app.ocultarComprados` não tem UI; `ModoCompra` tem estado local próprio | `app.svelte.ts:36`; `App.svelte:529`; `ModoCompra.svelte:30` | Remover o campo da store ou expor botão na lista |
| Baixo | `sourcemap: true` em produção publica o código-fonte completo (3,7 MB de mapa no chunk principal) em `/assets`; não pesa no usuário, mas expõe | `vite.config.ts:11` | `sourcemap: 'hidden'` e enviar o mapa a um serviço de erros, ou desligar |
| Baixo | `<head>` incompleto: sem `meta description`, `apple-touch-icon`, `apple-mobile-web-app-*`; ícones 512 e maskable são o mesmo arquivo (md5 igual `7a0c079b...`); `manifest` sem `id`, sem `screenshots` | `index.html`; `md5sum public/icon-*.png`; Lighthouse `meta-description` falha | Adicionar meta tags e `apple-touch-icon` 180 px; gerar um maskable com margem de segurança de 40% (decisão visual: ui-product-design) |
| Baixo | Versão do cache manual (`compra-planejada-v1`); assets antigos nunca expiram até mudar a constante; cache cresce sem limite | `sw.js:5` | Workbox faz isso por revisão do build (M1) |
| Baixo | `skipWaiting` + `clients.claim` sem aviso: a aba aberta mantém JS antigo até recarregar, mas o novo SW assume e serve outros chunks; com hash no nome e `import()` tardio pode pedir chunk que não existe mais no servidor | `sw.js:12,19` | Fluxo "Nova versão disponível. Atualizar" com `registerType: 'prompt'`; não é o caso mais provável hoje (chunks cacheados na instalação reduzem o risco) |
| Baixo | `alert()` bloqueante na dica de Wake Lock; vídeo `data:` do truque parece truncado (cabeçalho mp4 sem `moov` completo), então o nível 2 provavelmente não funciona [HIPÓTESE] | `ModoCompra.svelte:57-67` | Trocar `alert` por toast; testar o vídeo em iOS < 16.4 ou remover o nível 2 (Wake Lock nativo está em iOS 16.4+) |
| Baixo | README desatualizado: diz que PDF, compartilhar, edição de item e arrastar não foram portados e "109 testes"; todos existem e há 132 | `README.md` seção "Estado do projeto"; `src/lib/servicos/pdf.ts` etc. | Atualizar o README |
| Baixo | Código-morto no chunk: `html2canvas`, `purify` e `index.es` (canvg) são importados por jsPDF só em `doc.html()`/SVG; o app não os usa [FATO: `grep html2canvas\|.html(` em `src` sem resultado] e eles nunca baixam em runtime, mas inflam o `dist/` e o deploy | Medições (`import()` dentro do chunk jsPDF) | Alias vazio no Vite para esses módulos (ganho só de deploy, ~106 kB gzip em disco) |

### Estados de interface (item 9)
| Situação | O usuário vê hoje |
|---|---|
| Carregando sessão | "Carregando..." em texto simples (`App.svelte:477`), sem rótulo de status |
| Carregando listas/itens | Nada; lista vazia até chegar o snapshot, com a mensagem "Sua lista está vazia" (falso vazio) |
| Vazio | Tratado em Recibo, Histórico, Mover lista, Corredores, Modo compra; ok |
| Erro de rede / permissão negada | Nada; `console.error` |
| Offline | Dados em cache aparecem; escrita entra em fila do Firestore sem indicador |
| Erro de OCR e de PDF | Mensagem de erro (OCR) e toast (PDF); ok |
| Sucesso | Toast em mover lista, ordem salva, copiar; sem toast em adicionar/remover/finalizar |

## Melhorias propostas
| # | Melhoria | Ganho esperado | Esforço |
|---|---|---|---|
| M1 | `vite-plugin-pwa` (Workbox, `generateSW` ou `injectManifest`): pré-cache do shell e dos chunks com revisão, fallback de navegação, `runtimeCaching` para fontes e OCR, atualização por aviso | Offline em partida a frio [FATO: hoje falha]; remove versionamento manual; ~15-25 kB de runtime Workbox no SW (não no bundle). Licença MIT, mantido | M |
| M2 | Dividir o Firebase: `import('firebase/firestore')` após `onAuthStateChanged` devolver usuário; `usarSemConta` nunca baixa Firestore. Auth fica no início (decide a tela) | [HIPÓTESE] Firestore+re2js+webchannel ≈ 57% da fonte ≈ 120-135 kB gzip fora do caminho do login e do "sem conta"; usuário já logado baixa em paralelo. Medir antes e depois com `source-map-explorer` ou `rolldown` stats | M |
| M3 | `Modal` com `<dialog>` nativo (`showModal`, `inert`, foco, Esc, `::backdrop`) e trava de scroll; reaproveitar em Login e Onboarding | 13 telas corrigidas com um arquivo; 0 kB | P |
| M4 | Indicador de sincronização (`app.sincronizacao` ligado a `onSnapshot` erro/`metadata.fromCache`/`navigator.onLine`) + esqueleto de carga + erros nas escritas | Fim do "falso vazio" e do erro silencioso; qualitativo alto | M |
| M5 | Autohospedar fontes: Inter variável (um arquivo woff2 latin ~ 25-30 kB) + Space Mono 400/700 woff2 latin, `font-display: swap`, `<link rel="preload" as="font" crossorigin>`, fonte de fallback com `size-adjust` | Remove 1 CSS bloqueante e 2 origens (Lighthouse estima 900 ms de bloqueio de renderização, sob 4G lento); fontes passam a funcionar offline; menos CLS | P |
| M6 | Autohospedar assets do Tesseract (`workerPath`, `corePath`, `langPath`), servidos do mesmo domínio e cacheados sob demanda | OCR sem dependência de CDN de terceiros; viabiliza offline; adiciona ~10-15 MB ao `dist/` (core WASM + idioma) [HIPÓTESE: confirmar tamanhos] | M |
| M7 | Tema: `prefers-color-scheme` + alternador + `meta theme-color` dinâmico | Qualitativo (tema escuro já pronto nos tokens) | P |
| M8 | Lazy das telas pouco usadas com `import()` + `{#await}` (Famílias, Gerenciar, Insights, Preços, Histórico, OCR, Corredores, Mover) | [HIPÓTESE] só ~15-25 kB gzip (código próprio é ~8% da fonte); vale pelo hábito, não pelo ganho. Prioridade abaixo de M2 | P |
| M9 | PDF sem jsPDF: folha com CSS `@media print` + `window.print()` ("Salvar como PDF") | -130 kB gzip lazy, -1 dependência; perde `doc.save` direto e controle de layout. Decisão de produto | M |
| M10 | Corrigir tipos (`as any`, `any`), silenciar/resolver avisos, `Snippet` em Modal | Check sem ruído; menos regressão | P |
| M11 | Meta tags e ícones (description, apple-touch-icon 180, apple-mobile-web-app-*, `id`, maskable real), remover `orientation`, tratar `?acao=` | SEO 90 -> 100; instalação em iOS correta | P |
| M12 | Wake Lock com `visibilitychange`; alerta -> toast | Tela acesa no corredor de forma confiável | P |
| M13 | `sourcemap: 'hidden'`; `chunkSizeWarningLimit` só depois de M2 | Sem mapa público | P |

Ordem sugerida: M3, M4, M12, M11, M10 (semana 1, baixo risco) → M5, M1 (semana 2) → M2, M6 (semana 3-4, com medição).
Meta de orçamento [RECOMENDAÇÃO]: chunk inicial <= 120 kB gzip no fluxo login; LCP <= 2,5 s em 4G lento (medido em servidor com gzip e Firebase Hosting).

## Evolução em 6-12 meses
- **Lighthouse CI** no GitHub Actions (orçamentos: JS inicial, LCP, acessibilidade >= 95) com `size-limit` por chunk. A mudança em CI é do devsecops-engineer.
- **Testes de componente** com `vitest` + `@testing-library/svelte` (+ `jest-dom`; `vitest-axe` para regras automáticas): hoje os 132 testes cobrem `domain/` e repositório; nenhum monta componente [FATO: `tests/` sem imports `.svelte`]. Começar por Modal (foco), Recibo (arrastar), EntradaRapida, ModalEditarItem. Playwright para 3 jornadas (login, adicionar e comprar, offline).
- **Capacitor**: o código web já é compatível; impactos: Firebase Auth com `signInWithPopup/Redirect` precisa de plugin nativo (`@capacitor-firebase/authentication`), SW não roda em WebView iOS da mesma forma, Wake Lock e Share ganham plugins nativos, câmera do OCR via `@capacitor/camera`. Isolar em `servicos/` com adaptadores (já é o padrão). Decisão do mobile-engineer.
- **i18n**: textos em pt-BR inline em ~25 arquivos; extrair para `lib/i18n/pt-BR.ts` com funções simples antes de adicionar idiomas; `Intl` já é usado em datas e moeda. Só vale com demanda de mercado.
- **Roteamento por URL** (hash ou `history`): hoje modal e escopo não têm URL; botão voltar do Android fecha o app em vez do modal. Com `popstate` e hash por modal. Resolve também o atalho do manifest.
- **Web Vitals reais**: `web-vitals` enviando a um endpoint próprio, com consentimento (decisão de produto/privacidade).
- **Decomposição do `App.svelte`** (675 linhas, ~25 handlers, 14 modais por um `if/else` único): do ponto de vista de manutenção, extrair `AppCabecalho`, `ModaisHost` e módulos de ação (`acoesFamilia.ts`, `acoesCompra.ts`) com `repo` injetado. Arquitetura de alto nível fica com o software-architect.

## Achado adicional (Head, 2026-11-09): modo "Usar sem conta" congela a interface

| Sev. | Achado | Evidência | Recomendação |
|---|---|---|---|
| **Bloqueador** | Em produção, "Usar sem conta neste aparelho" dispara `effect_update_depth_exceeded` e a interface congela (onboarding não avança) | Reprodução do Head em Chromium headless (Playwright, build + `vite preview`), relatada ao front-end; **não reproduzi no navegador**. Causa confirmada por leitura: `app.svelte.ts:81-83` lê `this.itens` dentro do callback de `watchItems`; `MemoryRepository.ts:24-27` (`Canal.inscrever`) chama `cb(valorInicial)` de forma **síncrona**; o `$effect` de `App.svelte:181-185` chama `conectarItens`, então lê `itens` (vira dependência) e em seguida o escreve (`this.itens = ...`) → laço de efeito. Com Firestore o callback é assíncrono, fora do rastreamento, por isso o modo com conta não falha | Em `conectarItens`, ler com `untrack(() => this.itens)` (`import { untrack } from 'svelte'`). Mais robusto: no `$effect` de `App.svelte`, envolver a chamada em `untrack(() => app.conectarItens(repo, id))`, mantendo só `app.listaAtiva?.id` rastreado. Relatado pelo Head como resolvido numa cópia de trabalho |

Teste de regressão recomendado [RECOMENDAÇÃO]:
1. Teste de unidade (vitest, já disponível): em `$effect.root`, `flushSync`, com `MemoryRepository`, chamar `app.conectarItens` dentro de `$effect` e afirmar que não lança `effect_update_depth_exceeded` e que `app.itens` recebe os itens da lista. Falha antes da correção.
2. E2E (Playwright, contra `vite preview`): abrir o app limpo, tocar em "Usar sem conta", concluir o onboarding, adicionar um item e afirmar que ele aparece; falhar o teste em qualquer `pageerror`. Esse cenário é a jornada que os 132 testes atuais não cobrem (nenhum monta componente nem usa o repositório em memória dentro de efeito).

Impacto no diagnóstico: eleva a prioridade de "testes de componente e E2E" (seção Evolução) para a semana 1, antes de M3/M4. Este achado também torna o resumo mais severo: o modo sem conta está inutilizável em produção.

## Fora do meu papel
- **devsecops-engineer:** Google Fonts envia IP do visitante a terceiros (LGPD; resolvido por M5); CDN jsdelivr no OCR (M6); `sourcemap` público; CSP e cabeçalhos de segurança em `firebase.json`; chave de API do Firebase em `firebase.ts:25` é pública por desenho, depende de regras do Firestore e restrição por domínio na chave; CI (Lighthouse CI, `size-limit`).
- **ui-product-design:** tamanhos de alvo e de fonte, ícones SVG no lugar de emoji, maskable, estados vazios/erro/sincronização, alternador de tema, layout em tablet e desktop.
- **qa-engineer:** auditoria WCAG completa (contraste do tema escuro, leitor de tela, zoom 200%), parecer de testes, teste manual de offline e drag em aparelhos reais.
- **software-architect:** decomposição do `App.svelte` e dos módulos, estratégia de roteamento.
- **mobile-engineer:** Capacitor, Auth nativo.
- **data-bi-engineer:** custo de leituras do Firestore por `onSnapshot` de todas as compras e preços (`watchPurchases`, `watchPrices` sem limite visível), que também afeta o carregamento inicial.

## Não verificado
- Offline em partida a frio foi concluído por leitura de `sw.js`, não por execução em navegador. Procedimento: `npm run preview`, abrir em Chrome, instalar, DevTools > Application > Offline, recarregar. Esperado: página de erro do Chrome.
- Ganhos de M2, M8, M9 são estimativas por proporção de código-fonte; o `source-map-explorer` não funcionou com o sourcemap do Rolldown e não há medição em bytes minificados por pacote.
- Lighthouse rodado sem compressão, sem Firebase e sem Google Fonts (proxy); notas de desempenho não representam produção. Nada foi medido em app autenticado (modo compra, arrasto, modais).
- Foco, teclado, tab e leitor de tela avaliados por leitura de código; sem teste com tecnologia assistiva.
- Vídeo `data:` do Wake Lock: [HIPÓTESE] truncado, não executado.
- Tamanhos de `tesseract.js-core` e `por.traineddata` não medidos.
- Não rodei `npm run test`; os 132 testes passando são o fato reportado pelo Head.
