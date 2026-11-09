# Diagnóstico de arquitetura: Compra Planejada v5.0.0

- **Data:** 2026-11-09 · **Autor:** software-architect (Prumo) · **Escopo:** leitura do código no branch `claude/affectionate-babbage-oa5b5c`. Nenhum código foi alterado.
- **Fontes:** código em `src/`, `firestore.rules`, `firestore.indexes.json`, `public/sw.js`, `vite.config.ts`, `package.json`, `tests/`. O `PLANO-EVOLUCAO-PRODUTO.md` (revisão 8) e o `README.md` foram tratados como dados e conferidos no código.
- **Fatos de execução:** vêm do Head (2026-11-09): `npm run check` com 0 erros e 10 avisos; 132 testes em 0,7 s; cobertura de 83,6% em instruções e 68,2% em ramos; `FirestoreRepository.ts` fora do relatório de cobertura; chunk principal com 787,8 kB (237,7 kB gzip); `sourcemap: true`; `npm audit --omit=dev` com 6 vulnerabilidades transitivas.

## Resumo

1. A base é boa: domínio puro e testado, interface `Repository` com duas implementações, modelo granular com `owner` discriminado e regras que negam tudo por padrão.
2. A disciplina de camadas falha num ponto só, mas é o ponto central: `App.svelte` concentra cerca de 35 handlers e chama o repositório direto em 14 lugares.
3. Há funcionalidades marcadas como prontas que o código não sustenta. O modo sem conta não persiste nada. A presença nunca é gravada. As estatísticas de uso nunca são atualizadas. O perfil `users/{uid}` só é criado pela migração v4.
4. O modelo de leitura não tem teto: listas apagadas, compras e preços são assinados por inteiro a cada abertura. Para uso de uma família isso é tolerável; como produto de mercado, é o primeiro gargalo de custo.
5. Sequência recomendada: corrigir os achados altos, criar testes de integração com o emulador, decompor a casca, limitar as leituras, decidir "uso pessoal × mercado" e só então partir para LGPD no servidor, push, NFC-e e Capacitor.

## Pontos fortes

- [FATO] `domain/` não importa DOM, rede nem Firebase. Os 132 testes rodam em 0,7 s (Head, 2026-11-09).
- [FATO] Os componentes de `ui/` são apresentacionais: recebem props e callbacks, e só importam `domain/` e `servicos/` (grep em `src/lib/ui`). A única exceção é `TelaLogin.svelte:2-3`, que importa `firebase/auth`.
- [FATO] A interface `Repository` (`repository.ts:89-98`) permite rodar o mesmo app em memória ou no Firestore. Escritas granulares por item (`FirestoreRepository.ts:137-144`).
- [FATO] `OwnerRef` é uma união discriminada (`types.ts:23-25`) aplicada de forma uniforme nas regras (`firestore.rules:35-46`). Mover uma lista é uma única escrita, conferida nos dois lados (`firestore.rules:62-63`).
- [FATO] Compras e preços são imutáveis no servidor (`firestore.rules:80,91`). As posições esparsas evitam renumerar (`types.ts:191`, `listas.ts:93-101`).
- [FATO] OCR e PDF são carregados sob demanda (`ocr.ts:16`, `pdf.ts:14`). O OCR nunca grava sem revisão.
- [FATO] Cache persistente multiaba do Firestore (`firebase.ts:49-51`) e regra final `deny all` (`firestore.rules:199-201`).

## Pontos fracos

| # | Sev. | Achado | Evidência | Recomendação |
|---|---|---|---|---|
| F1 | Alto | [FATO] O modo "sem conta" não persiste nada: `MemoryRepository` é criado vazio e `aoMudar` continua sem efeito. Ao recarregar, tudo se perde, embora a interface prometa "as listas ficam só neste navegador". | `App.svelte:52`; `MemoryRepository.ts:6,63`; `TelaLogin.svelte:89`; nenhum outro uso de `aoMudar` em `src/` | Ligar `aoMudar` a um armazenamento local (localStorage ou IndexedDB, com debounce) e hidratar no construtor. Também persistir a escolha "sem conta". Outra saída é remover o modo e o texto. Decisão de produto. |
| F2 | Alto | [FATO] `users/{uid}` só é criado em `aplicarMigracao`. `updateProfile` usa `updateDoc`, que falha se o documento não existir. Para quem nunca usou a v4, salvar a ordem dos corredores falha, e o registro de lojas falha em silêncio (`.catch(() => {})`). [HIPÓTESE] Isso afeta todo usuário novo. | `FirestoreRepository.ts:216-218`; `migration.ts:225` (único `saveProfile`); `App.svelte:249,317-319,459-460` | Criar o perfil no primeiro login (`setDoc` com `merge: true`) ou trocar `updateProfile` por `setDoc(..., {merge:true})`. Cobrir com teste no emulador. |
| F3 | Alto | [FATO] `atualizarEstatisticas` nunca é chamada. `itemStats` só existe para quem migrou da v4. Ficam sem dados novos a autocompletação da entrada rápida, os "frequentes" da lista sugerida (H5) e as sugestões de recompra. | `listas.ts:182`; grep: nenhum chamador; consumidores em `App.svelte:534,614`, `lista-sugerida.ts:29,53` | Chamar ao finalizar a compra, dentro do mesmo lote (ver F6). Avaliar derivar as estatísticas de `priceEntries`/`purchases` em vez de mantê-las no perfil. |
| F4 | Médio | [FATO] A presença ("quem está comprando agora") é lida mas nunca escrita: `heartbeat` não tem chamador. A funcionalidade marcada como pronta no PLANO não funciona. | `repository.ts:85`; `FirestoreRepository.ts:333`; `ModoCompra.svelte:36`; `App.svelte:522` | Ligar um heartbeat (ao entrar ou sair do modo compra e a cada 60 s, só em escopo de família) ou remover a interface. Hoje há custo de leitura sem benefício. |
| F5 | Médio | [FATO] Componentes chamam o repositório direto, o que contradiz a regra declarada. São 14 chamadas em `App.svelte`, incluindo regra de negócio (montar `aisleOrders`, registrar loja, montar `Item` a partir do histórico). | Regra em `listas.ts:4-6` e `README.md:84`; chamadas em `App.svelte:138,211,223,249,262,268,317,319,374,423,427,459,460` e montagem de `Item` em `:442-446,467-471` | Mover para `servicos/` (`salvarOrdemCorredores`, `registrarLojaUsada`, `editarItem`, `removerItem`, `reativarCompra`). Mudar `carregarPendentes` para aceitar entradas parciais, não `Item[]`. |
| F6 | Médio | [FATO] `finalizarCompra` faz 5 escritas em sequência, sem lote nem idempotência, embora o comentário afirme o contrário. Uma falha no meio, ou um toque duplo, gera compra e preços duplicados, o que distorce inflação e previsão. | `listas.ts:108-148`; `deleteList` faz `getDocs` e um lote sem divisão em `FirestoreRepository.ts:82-89` | Criar uma operação `finalizarCompra` no repositório com um único `writeBatch` (até 500 operações) e id da compra derivado da lista (ex.: `purchase.id = list.id`). Com isso, repetir não duplica. |
| F7 | Médio | [FATO] As leituras não têm teto. `watchLists` traz também as listas apagadas: cada compra finalizada deixa uma lista apagada e os itens dela. `watchPurchases` e `watchPrices` assinam todo o histórico do dono, sem limite. `prune` não tem chamador. [HIPÓTESE] Com cerca de 240 preços por mês por família, cada abertura a frio lê milhares de documentos depois de 1 ano. | `FirestoreRepository.ts:58-66,160-165,177-183,190-198`; `app.svelte.ts:51-60` | Filtrar `deletedAt == null` na consulta. Remover de vez (ou aplicar TTL a) listas finalizadas, já que a `Purchase` é o retrato. Limitar a janela (ex.: 12 meses) com `orderBy`/`limit`, carregar o histórico sob demanda e manter um agregado por produto para os indicadores. |
| F8 | Médio | [FATO] Os índices não batem com as consultas. Os índices de `lists`, `items` e `priceEntries.key` não são usados (a ordenação é feita no cliente). A consulta de `prune` (2 igualdades e um intervalo em `date`) não tem índice. | `firestore.indexes.json:3-38`; `FirestoreRepository.ts:59,104,191` | Revisar junto com F7: declarar só os índices das consultas reais e validar no emulador. |
| F9 | Médio | [FATO] Erros de assinatura só vão para `console.error`. O usuário não sabe se a lista está desatualizada ou se foi negada. `app.sincronizacao` existe mas nunca é escrito. | `FirestoreRepository.ts:66,111,165,182,205,226,231,330`; `app.svelte.ts:38` | Adicionar um parâmetro `onErro` às assinaturas, ou um canal único de status alimentando `sincronizacao`, com aviso na interface. Base para a observabilidade (M6). |
| F10 | Médio | [FATO] O estado não é limpo ao trocar de conta ou de escopo. `desconectar` só cancela as assinaturas. `app.itens` acumula os itens de todas as listas já vistas, inclusive de outro usuário no mesmo aparelho, e alimenta `jaNasListas` e `categoriasConhecidas`. | `app.svelte.ts:79-90`; `App.svelte:124-128,576,615` | Fazer `desconectar` zerar o estado. Guardar só os itens da lista ativa, ou indexar por `listId` e descartar ao cancelar a assinatura. |
| F11 | Médio | [FATO] `App.svelte` é um componente-deus: 675 linhas, união de 13 modais (não 14), 5 estados auxiliares de modal e `repo` como variável mutável sem reatividade. O `$effect` de itens não reage à troca de `repo`. | `App.svelte:53,60-65,181-185,368-369` | Ver M2 (modal com carga própria) e M3 (controladores por área). Mover `repo` para o store (`$state.raw`). |
| F12 | Médio | [FATO] `merge.ts` não é usado no caminho real: só os testes o importam. No Firestore vale "a última escrita vence", campo a campo, com `updatedAt` vindo do relógio do cliente. A regra "marcar vence desmarcar" do README não vale em produção. | `tests/dominio.test.ts:17`; grep: nenhum import em `src/`; `README.md:120-122`; `Date.now()` em `FirestoreRepository.ts:79,138` | Registrar em ADR que a estratégia é a última escrita por campo e remover `merge.ts`. Se a regra for necessária, aplicá-la com transação em `alternarComprado`. Considerar `serverTimestamp()`. |
| F13 | Médio | [FATO] Excluir a família (último membro) apaga só o documento. Listas, itens, compras, preços, convites e a subcoleção `presence` ficam órfãos e inacessíveis, mas continuam guardados. [FATO] O dono pode sair deixando a família sem dono. | `familias.ts:83-85`; `FirestoreRepository.ts:241-243`; `firestore.rules:120-125` | Definir a política em ADR: transferir as listas para o pessoal antes de excluir, ou apagar em cascata no servidor (ver E-c). Bloquear a saída do dono sem transferência. |
| F14 | Baixo | [FATO] Contrato com operações mortas (`reassignItems`, `deletePurchase`, `prune`, `deleteList` exposto, `getItems`, `updateHousehold`) e campos sem uso (`tema` fixo em `'claro'`, `online`, `categoryOrder`). | `repository.ts:39,45,51,58,72`; `app.svelte.ts:37,43`; `App.svelte:187-189`; `types.ts:77` | Enxugar a interface para o que os casos de uso consomem. Menos superfície significa menos código para testar no emulador. |
| F15 | Baixo | [FATO] O código de migração v4 (237 linhas) está no bundle principal e roda a cada login. | `App.svelte:13,144-155`; `migration.ts` | Carregar com `import()` só se `shopping-app-data` existir sem `v5-migrado`. Remover depois de confirmar que todos os aparelhos conhecidos migraram. Prazo em ADR. |
| F16 | Baixo | [FATO] O SDK do Firebase está no chunk principal (import estático) mesmo no modo sem conta. Sourcemaps vão para produção. | `App.svelte:9,12`; `firebase.ts:10-19`; `vite.config.ts:10`; 237,7 kB gzip (Head) | Ver M7. Usar `sourcemap: 'hidden'` e enviar os mapas só para a ferramenta de erros. |
| F17 | Baixo | [FATO] Os documentos não guardam versão de esquema (só o perfil tem), e `SCHEMA_VERSION = 4` numa base v5. Tipagem frouxa em `any` nos handlers. | `types.ts:188`; `App.svelte:421,524,596` | Adicionar `schemaVersion` em listas, compras e preços antes da próxima mudança de modelo. Remover os `any`. |
| F18 | Baixo | [HIPÓTESE] Cada escrita de item avalia `get()` da lista, e da família quando for o caso, nas regras, o que é cobrado como leitura. | `firestore.rules:66-70,21-23` | Aceitável no volume atual. Desnormalizar `owner` no item faria perder a mudança de lista "sem reescrever itens". Reavaliar só com dados de custo. |

## Melhorias propostas

| # | Melhoria | Ganho esperado | Esforço |
|---|---|---|---|
| M1 | Testes de integração do `FirestoreRepository` e das regras no emulador (`@firebase/rules-unit-testing`), rodando no CI | Fecha a classe de bug "funciona na memória, quebra em produção" (escopo `'local'`, F2, convites). Pré-requisito para mexer em F6, F7 e F8 com segurança | M |
| M2 | Modal como união com carga própria (`{tipo:'editarItem', item} \| {tipo:'gerenciarFamilia', casa} \| …`) e um componente `Modais.svelte` | Elimina `itemEmEdicao`, `itensParaFinalizar` e `familiaEmGerenciamento` soltos, além de estados impossíveis. Tira cerca de 150 linhas de `App.svelte` | P |
| M3 | Controladores por área em `src/lib/aplicacao/` (`sessao`, `listas`, `compra`, `familias`, `perfil`) que recebem `app` e `repo`; `App.svelte` fica só com o layout | Os handlers passam a ser testáveis com `MemoryRepository`, cumprindo a regra de camadas (F5). `App.svelte` cai para menos de 250 linhas | M |
| M4 | Assinaturas separadas por ciclo de vida: sessão (perfil, famílias), escopo (listas, compras, preços) e lista (itens), com limpeza do estado e `$state.raw` nos arrays vindos do servidor | Corrige F10 e evita assinar de novo perfil e famílias a cada troca de escopo. Menos leituras e menos memória | P |
| M5 | Lote único e idempotente em `finalizarCompra`, incluindo as estatísticas (F3 e F6) | Integridade do histórico de preços, base dos indicadores | P |
| M6 | Canal de erros e de status de sincronização, mais monitoramento de erros no cliente (Sentry ou equivalente; decisão do Head e do devsecops) | O usuário vê quando algo falhou. O autor passa a saber de erros em produção sem depender de relato | M |
| M7 | Carregar Firebase Auth e Firestore sob demanda (`import()` em `auth/firebase.ts` e no repositório), mantendo na abertura só o que a tela de login precisa | [HIPÓTESE] Reduz de forma relevante o chunk inicial no modo sem conta e na tela de login. Medir antes e depois | M |
| M8 | Janela de leitura e retenção (F7): consulta filtrada, `limit` e remoção definitiva ou TTL das listas finalizadas | Custo por usuário estável no tempo. Requisito para qualquer cenário de mercado | M |
| M9 | Enxugar o contrato `Repository` (F14) e remover `merge.ts` ou passar a usá-lo (F12) | Menos código morto e documentação que corresponde ao comportamento | P |
| M10 | Reconciliar README e PLANO com o código (F1, F3, F4, contagem de testes, lista de "não portado") | O rastro volta a ser confiável para decisões | P |

**Decomposição de `App.svelte`: opções.** (a) M2 sozinha: P, ganho imediato de legibilidade. (b) M2 + M3: M, resolve camadas e testabilidade. (c) Roteador com URL (SvelteKit ou svelte-routing): G, só se justifica com links profundos, como convite por link no Capacitor. [RECOMENDAÇÃO] Fazer (b) agora e reavaliar (c) no bloco de lojas.

## ADRs a registrar (retroativos, em `docs/adr/`)

| Nº | Decisão | Alternativas a registrar | Gatilho de revisão |
|---|---|---|---|
| 0001 | SPA/PWA com Svelte 5 + TypeScript estrito + Vite | React, Vue, JS puro (v4) | Necessidade de SSR ou de ecossistema nativo |
| 0002 | Firebase Auth + Firestore sem backend próprio; regras como camada de autorização | Supabase, backend próprio, Firestore + Cloud Functions | LGPD com apagamento em cascata, push ou NFC-e (todos pedem servidor) |
| 0003 | Modelo granular: `owner` discriminado, itens em subcoleção, compras e preços em coleções de topo | Documento único (v4), itens com `owner` desnormalizado | Custo de `get()` nas regras (F18) |
| 0004 | Padrão Repository com `MemoryRepository` para testes e para o modo sem conta (inclui a decisão de persistência local, F1) | Firestore offline anônimo (Auth anônima) no lugar do repositório em memória | Ida para as lojas |
| 0005 | Exclusão e retenção: soft delete em listas e itens, política de limpeza e TTL, cascata ao excluir família | Hard delete, TTL nativo, função no servidor | Crescimento de leituras (F7) |
| 0006 | Imutabilidade de compras e preços; correção por exclusão e novo lançamento | Edição com trilha de auditoria | Pedido de edição de preço |
| 0007 | Captura de cupom por OCR local (Tesseract no navegador) | NFC-e por QR code com consulta à SEFAZ (precisa de servidor), OCR em nuvem | Taxa de acerto real abaixo de 80% |
| 0008 | Concorrência: a última escrita vence, campo a campo, e destino de `merge.ts` | Transação em `alternarComprado`, `serverTimestamp` | Relatos de conflito |
| 0009 | Corte direto v4→v5 e prazo para remover a migração | Convivência gradual | Todos os aparelhos migrados |

## Evolução para 6 a 12 meses (sequência)

1. **Mês 1: estabilizar.** Corrigir F1, F2 e F3 e decidir F4. Fazer M1 (emulador) antes de tocar em dados. Cada correção entra com teste no emulador.
2. **Meses 1 e 2: estrutura.** M2, M3, M4 e M5, depois M9 e M10. Registrar os ADRs 0001 a 0009.
3. **Meses 2 e 3: custo e operação.** M8, M6 e M7. Medir as leituras por abertura antes e depois.
4. **Portão de decisão (usuário):** uso pessoal × produto de mercado (PLANO §7). Daqui em diante o custo é recorrente (plano Blaze do Firebase para Cloud Functions, um gatilho que pede aprovação explícita).
5. **(c) Exclusão de conta (LGPD).** Opção simples: rotina no cliente que apaga listas, itens, compras, preços e o perfil, remove o usuário das famílias e chama `deleteUser` (exige login recente). É frágil a falhas parciais e não alcança dados do usuário em famílias (`addedBy`, `finishedBy`, nomes). Opção robusta: Cloud Function com o Admin SDK (exclusão recursiva, disparada pela exclusão no Auth ou por chamada direta). [RECOMENDAÇÃO] Usar a função se houver mercado. Vem antes das lojas, porque [HIPÓTESE] as lojas exigem exclusão de conta dentro do app.
6. **(b) Push.** FCM + Cloud Function agendada (lembrete de recompra a partir da previsão) ou disparada por evento (item adicionado na família). Exige guardar tokens por aparelho em `users/{uid}/devices` e regras para isso. Reaproveitado depois no Capacitor.
7. **(a) Capacitor.** Pré-requisitos de arquitetura: autenticação atrás de uma interface (hoje `TelaLogin` chama `firebase/auth` direto), login Google nativo (o popup não funciona em WebView), links profundos para `?convite=`, câmera nativa no OCR e service worker desligado no shell nativo.
8. **(d) NFC-e por QR code (spike paralelo, independente).** O QR leva a portais estaduais heterogêneos, sem API nacional. Ler o portal pede um proxy no servidor (CORS) e uma análise dos termos de uso de cada estado. Spike de 1 estado, medindo a cobertura contra o OCR, antes de decidir (atualiza o ADR 0007).
9. **(e) Testes de integração** são o item 1 e passam a valer para cada etapa seguinte (regras de `devices`, funções no emulador).

## Fora do meu papel

- **devsecops-engineer:** `joinByInvite` sem transação depende só de `ingressoComConvite` (`FirestoreRepository.ts:300-323`, `firestore.rules:105-118`). Também: saída do dono (`firestore.rules:120-125`), cache IndexedDB do Firestore não limpo no logout em aparelho compartilhado, sourcemaps públicos, 6 vulnerabilidades no `npm audit`, ausência de App Check.
- **frontend-engineer:** `sw.js` nunca coloca `index.html` no cache. O fallback de navegação (`sw.js:30`) falha quando o app é aberto offline do zero. O cache de nome fixo (`sw.js:5`) cresce sem poda. [HIPÓTESE] Os arquivos do Tesseract vêm de CDN e não funcionam offline (`ocr.ts:17`). Avaliar `$state.raw` em arrays grandes.
- **qa-engineer:** não há testes de fluxo da casca nem do `FirestoreRepository`. Toque duplo em "Confirmar" no checkout (F6). `aoReativarCompra` não faz nada sem lista ativa (`App.svelte:439-440`).
- **data-bi-engineer:** H5 sem `itemStats` atualizados (F3). Preços duplicados se a finalização se repetir (F6). Indicadores calculados no cliente sobre todo o histórico.
- **product-manager:** o PLANO marca como prontos o modo sem conta, a presença e as sugestões, que não funcionam como descrito (F1, F3, F4). O README está desatualizado (109 testes, lista de "não portado").

## Não verificado

- [ ] Efeito de F2 em produção. No console do Firebase (dados do Firestore), conferir se as contas novas têm `users/{uid}`. Ou, no emulador: entrar com uma conta nova, salvar a ordem dos corredores e esperar `NOT_FOUND`.
- [ ] Volume real de leituras (F7). Firebase console → Firestore → Uso: leituras por dia. Comparar com a cota gratuita e com a regra de cobrança de listeners reconectados. A documentação de preços não pôde ser lida: `firebase.google.com` está bloqueado na rede desta sessão e precisa ser liberado.
- [ ] Cobrança e deduplicação de `get()` nas regras em lotes (F18), disponibilidade e custo de TTL no Firestore, e se Cloud Functions exigem o plano Blaze. Mesma pendência de rede (documentação oficial do Firebase).
- [ ] [HIPÓTESE] de laço no `$effect` de itens com `MemoryRepository`, cujo callback é síncrono e lê e escreve `app.itens` (`App.svelte:181-185`, `app.svelte.ts:81-84`). Rodar `npm run dev`, entrar sem conta, trocar de lista e procurar `effect_update_depth_exceeded` no console. Se não aparecer, descartar. De todo modo, envolver com `untrack` e devolver a limpeza no próprio efeito.
- [ ] Ganho de M7. Rodar `npm run build` antes e depois e comparar o gzip do chunk principal.
- [ ] Origem dos arquivos do Tesseract (`ocr.ts:17`). Em `npm run preview`, abrir a leitura de cupom com a aba Rede aberta e anotar os domínios carregados.
- [ ] Exigência de exclusão de conta dentro do app nas lojas (Apple e Google). Conferir nas diretrizes oficiais antes do bloco de lojas.
- [ ] Versões e licenças de Svelte, Vite, Firebase, jsPDF e Tesseract.js não foram conferidas na fonte nesta rodada. Rodar `npm view <pacote> version license` para cada um.
