# Parecer de qualidade: diagnóstico da versão 5.0.0 (Compra Planejada)

- **Demanda:** sem issue (diagnóstico multidisciplinar, N2, somente leitura) · **Responsável:** qa-engineer · **Data:** 2026-11-09
- **Branch:** `claude/affectionate-babbage-oa5b5c` · **Ambiente:** Node v22.23.4, Chromium (Playwright), Vitest 4.1.10, axe-core (instalado só na pasta de trabalho do QA), `vite preview` local em 4173 (build original) e 4174 (cópia com `untrack`). Dados: apenas fictícios, em memória.
- **Parecer: REPROVADO.** Há 1 defeito Bloqueador e 1 Alto em aberto. O modo "Usar sem conta" trava a interface. Contagem de defeitos: **1 Bloqueador · 1 Alto · 10 Médios · 8 Baixos.**
- Legenda: `[FATO]` tem comando e resultado nesta sessão; `[HIPÓTESE]` não foi confirmada; `[RECOMENDAÇÃO]` é proposta.

## Resumo executivo
1. [FATO] O domínio é bem testado (132 testes, 0,5 s, todos passando), mas o que o usuário toca (telas, store, `FirestoreRepository`, regras) não tem nenhum teste. O Bloqueador passou por CI verde por esse motivo.
2. [FATO] Com a correção do Bloqueador (cópia em 4174), as jornadas principais funcionam: adicionar, consolidar, marcar, editar, arrastar por toque, modo compra, finalizar com pendentes, histórico, recorrência.
3. [FATO] Os defeitos funcionais mais relevantes depois do Bloqueador são perda total de dados no modo sem conta ao recarregar (Alto), interpretação errada de preço na entrada rápida e de valores como "1.234,56" no checkout (Médios).
4. [FATO] Acessibilidade: axe deu 0 violações no login e 1 violação crítica recorrente (tablist ARIA inválido). Pela leitura de código e medições há falhas de WCAG 2.2 AA em foco de modais, tamanho de alvo e contraste.
5. [RECOMENDAÇÃO] Corrigir D-01 e D-02, criar o teste E2E de fumaça do modo sem conta antes de qualquer outra coisa, e só então ampliar a pirâmide (seção "Estratégia").

## Qualidade atual por camada
| Camada | Estado | Evidência |
|---|---|---|
| Domínio (`src/lib/domain`) | Forte. 94% de linhas, 81% de ramos, regressões nomeadas | cobertura do Head, `coverage-final.json`: `domain` 93,8 / 80,6 / 94,6 / 97,6 |
| Serviços (`src/lib/servicos`) | Parcial. `listas.ts` com 41% de ramos (30/73); `ocr.ts`, `pdf.ts`, `compartilhar.ts` fora do relatório | `listas.ts`: stm 77% (64/83), ramos 41%; `servicos` 81,3 / 48,2 / 88 / 85,4 |
| Dados: `MemoryRepository` | Médio. 64% de linhas e 40% de ramos, testado só pelo caminho feliz | `coverage-final.json`: stm 156/242, ramos 32/80 |
| Dados: `FirestoreRepository` | **Zero.** Nenhum teste o importa (fora do relatório) | `grep -rn FirestoreRepository tests` vazio |
| Regras do Firestore | **Zero**, e o CI publica as regras a cada push em `main` | `deploy.yml` (job `publicar_regras_firestore`); parecer de segurança S-05 |
| Store e `App.svelte` | **Zero** (675 linhas de casca sem teste); aqui nasceu o Bloqueador | `vitest.config.ts`: ambiente `node`, sem jsdom |
| Componentes (20 `.svelte`) | **Zero** | não há `@testing-library/svelte` no `package.json` |
| E2E | **Zero**. O CI faz check, test e build, nunca abre o app | `deploy.yml`, passos de `build_e_testes` |
| Acessibilidade automática | Nenhuma no repositório | sem axe no `package.json` |

### Linha de base
`cd /home/user/compra-planejada && npx vitest run 2>&1 | tail -6` → `Test Files 5 passed (5)`, `Tests 132 passed (132)`, `Duration 529ms`. [FATO]

### O que cada arquivo cobre e qualidade
| Arquivo | Casos | O que cobre | Avaliação |
|---|---|---|---|
| `tests/dominio.test.ts` | 67 | `parseQuickItem`, `parseMultiline`, categorias, consolidação, posições esparsas, merge por registro, corredores, recorrência, papéis, preços, recompra, texto de compartilhar | Bom. Asserções específicas, regressões nomeadas ("2x leite", "leite condensado") e idempotência do merge. Lacunas: nenhum caso com preço na entrada, nem de nome com número ("Whey 900g"), nem de valor monetário BR |
| `tests/repositorio.test.ts` | 30 | casos de uso contra `MemoryRepository` (a interface, sem mocks): listas, itens, mover, famílias, convites, finalizar, migração v4→v5 | Bom desenho. Limite: valida o contrato só na implementação em memória; nada garante que o Firestore o cumpra |
| `tests/bloco-h.test.ts` | 20 | OCR de cupom, inflação pessoal, recompra, lista sugerida | Razoável. "nunca lança exceção com entrada aleatória" usa 2 entradas fixas, não é fuzz. "≥80% de acerto" mede a taxa sobre amostra escolhida pelo autor |
| `tests/drag-reorder.test.ts` | 11 | matemática do arrasto (`indiceAlvo`, `reordenar`) | Bom, puro e determinístico. O gesto real (ponteiro, captura, rolagem) não tem teste |
| `tests/onboarding.test.ts` | 4 | `localStorage` indisponível e marca de visto | Bom nas bordas. Não cobre a tela |

Pontos de atenção de qualidade dos testes:
- [FATO] `taxa de acerto acima de 80%` (`dominio.test.ts:106-114`) só confere `guessCategory(n) !== ''`; um dicionário que classifique tudo como "Hortifruti" passaria.
- [FATO] Há dependência de relógio real (`Date.now()` em `bloco-h` e `dominio`, e `setTimeout(2)` em `repositorio.test.ts`) sem `vi.useFakeTimers()`. Hoje estável, mas é fonte de instabilidade futura. [HIPÓTESE]
- [FATO] Um comentário em `deploy.yml` fala em "109 casos"; são 132. Documentação defasada.

## Pontos fortes
- [FATO] Testes rápidos e determinísticos: 132 em 0,5 s, sem rede.
- [FATO] Contra `MemoryRepository`, e não contra mocks: o contrato do repositório é exercitado de verdade.
- [FATO] Regras de negócio críticas (merge, migração, convites revogados) são puras, idempotentes e testadas.
- [FATO] Sem rolagem horizontal de 320 a 1280 px (ver Responsividade). 0 long tasks e CLS 0 na carga.
- [FATO] Base de acessibilidade já presente: `lang="pt-BR"`, viewport sem bloqueio de zoom, `:focus-visible` com contraste 5,36:1, `prefers-reduced-motion`, `aria-label` e `aria-pressed` dinâmicos nos itens, ▲▼ como alternativa ao arrasto, `label for` nos campos, `role="alert"` no erro de login.
- [FATO] Arrasto por toque funciona (CDP `Input.dispatchTouchEvent`): Arroz movido para o fim do grupo.

## Defeitos encontrados
Reprodução em 4174 (cópia corrigida) com Playwright, 390×844 com toque, salvo D-01. Scripts e registros em `docs/qa/scripts/` (`jornada.cjs`, `jornada2.cjs`, `axe.cjs`, `teclado.cjs`, `resp.cjs`, `perf.cjs`, `repro-4173.cjs`).

| ID | Sev. | Descrição | Passos | Esperado × obtido | Responsável |
|---|---|---|---|---|---|
| D-01 | **Bloqueador** | "Usar sem conta" congela a build de produção | Abrir `http://127.0.0.1:4173/`, clicar em "Usar sem conta neste aparelho" | Esperado: onboarding avança. Obtido: `pageerror Error: https://svelte.dev/e/effect_update_depth_exceeded`; título continua "Bem-vindo ao Compras" nos 5 cliques seguintes em "Próximo". Causa por leitura: `stores/app.svelte.ts:81-83` lê `this.itens` no callback síncrono do `MemoryRepository`, dentro do `$effect` de `App.svelte:181-185` | frontend-engineer |
| D-02 | **Alto** | Modo sem conta perde todos os dados ao recarregar, e o texto diz o contrário | Sem conta, adicionar itens, `page.reload()` | Esperado (pelo texto "as listas ficam só neste navegador"): dados mantidos. Obtido: volta à tela de login, `localStorage` só tem `compras-onboarding-visto`, lista nova "Mercado" vazia | frontend-engineer + product-manager (decidir persistir) |
| D-03 | Médio | Sem conta não há como entrar com conta nem sair | Sem conta, abrir 👤 | Obtido: só "Fechar" (`ModalConta.svelte:30`); o texto manda ir "pela tela inicial", que só se alcança recarregando, o que apaga os dados (D-02). O ramo `semConta` de `aoSairDaConta` é inalcançável | frontend-engineer |
| D-04 | Médio | Entrada rápida interpreta mal número com preço ou peso | Digitar `frango 1,2kg 18,90` | Obtido: prévia e item "Frango 1,2kg", qtd **18.9** (sem unidade). `tomate 2kg R$ 7,50` vira "Tomate 2kg R$", qtd 7.5; `Whey 900g` vira qtd 900 g. A tela não prevê preço, mas a prévia mostra o resultado errado sem alerta | frontend-engineer, com decisão do product-manager |
| D-05 | Médio | "+ item" do modo compra não interpreta o texto | Modo compra, "+ item", `2kg tomate` | Esperado: Tomate, 2 kg, Hortifruti. Obtido: item chamado "2kg tomate", qtd 1, sem categoria (`App.svelte:524` envia o texto cru). O `autofocus` do campo não leva o foco (foco fica no botão) | frontend-engineer |
| D-06 | Médio | Valor pago mal interpretado no checkout | `Quanto ficou?`: digitar `1.234,56` e depois `R$ 85,40` | `1.234,56` vira 1,234 (diferença "R$ 178,64 abaixo" sobre 179,87); `R$ 85,40` vira `NaN` e o total é descartado em silêncio. Causa: `ModalCheckout.svelte:23,32` usa só `replace(',', '.')`. Mesma fragilidade em `ModalEditarItem` (preço) | frontend-engineer |
| D-07 | Médio | Tela "Insights" vazia com 1 compra | Finalizar 1 compra com um item pago; abrir 💡 | Esperado: estado vazio explicativo. Obtido: modal só com título e "Fechar" (`TelaInsights.svelte:41`, ramo sem `{:else}` para `precos.length > 0` sem resultado). Captura: `docs/capturas/2026-11/qa-j-insights.png` | frontend-engineer |
| D-08 | Médio | Modais sem gestão de foco (já apontado; confirmado) | Abrir "Editar item" com Enter e apertar Tab | Foco continua no botão ✎; Tab percorre 10 controles do fundo antes de chegar ao modal; sem `inert`/`aria-hidden` no fundo; após Esc o foco vai para `BODY` (WCAG 2.4.3, 2.1.2). `Modal.svelte` | frontend-engineer |
| D-09 | Médio | Alvos de toque abaixo de 24 px | Medir `getBoundingClientRect` na lista | ▲/▼ 20×16, alça de arrastar 15×27, check 26×26; botões de ferramenta 34×34 (WCAG 2.5.8 AA exige 24×24 ou espaçamento; ▲▼ não cumprem) | ui-product-design + frontend-engineer |
| D-10 | Médio | Contraste insuficiente | Axe e cálculo com os tokens | (a) Modo compra, botões "← Sair" e "Ocultar pegos": **4,08:1** (axe, exige 4,5). (b) Borda de campos e do checkbox `--border` sobre `--paper`: **1,35:1** (exige 3:1 em 1.4.11). (c) `.aviso` do OCR, âmbar sobre âmbar claro: 3,63:1. (d) Tema escuro, botão primário branco sobre verde: 3,07:1; hoje inalcançável, não há alternância | ui-product-design |
| D-11 | Médio | `role="tablist"` inválido | Axe em qualquer tela com lista | Axe `aria-required-children` (critical): o botão "+" está dentro do tablist. Todas as abas com `tabindex=0`, setas não movem o foco, sem `tabpanel`. O mesmo no onboarding: `role="tablist"` com `span aria-hidden` (`TelaOnboarding.svelte:58`) | frontend-engineer |
| D-12 | Médio | Layout a 320 px | Viewport 320×700 com 3 listas e nome longo | Nome do item quebra a 1 palavra por linha (~8 caracteres) porque 5 controles ocupam ~140 px; abas cortadas e botão "+ Nova lista" fora da tela, sem indício de rolagem. Sem rolagem horizontal da página. Capturas: `docs/capturas/2026-11/qa-r320-02-lista.png` | ui-product-design + frontend-engineer |
| D-13 | Baixo | Atalho "Nova lista" do manifest não faz nada | Abrir `/?acao=nova-lista` | Obtido: nenhum diálogo (0 `[role=dialog]`); `grep acao= src` vazio | frontend-engineer |
| D-14 | Baixo | "Trazer só não comprados" sem retorno visível | Histórico → detalhe → trazer | Modal fecha, a lista nova ("Mercado") nasce em segundo plano; a ativa continua "Mercado 2"; sem toast | frontend-engineer |
| D-15 | Baixo | Nome acumula sufixo | Finalizar duas vezes com pendentes | Obtido: "Mercado 2", depois "Mercado 2 2" (`App.svelte:328` usa `baseName` + " 2") | frontend-engineer |
| D-16 | Baixo | Decimal inconsistente | Itens `2kg tomate`, editar quantidade | Digitado "1,2" aparece "1,2 kg"; parseado aparece "7.5" e "18.9" (ponto) | frontend-engineer |
| D-17 | Baixo | Finalizar sem comprar nada grava compra vazia; sem lista só há texto | Finalizar lista com 0 comprados, "Apenas finalizar", "Pular" | Histórico ganha "0 de 3 itens"; a tela fica "Nenhuma lista ainda." sem botão de criar | product-manager decide, frontend-engineer |
| D-18 | Baixo | Mapas de código públicos | `vite.config.ts`: `sourcemap: true`; `firebase.json` serve `dist` inteiro | `dist/assets/index-*.js.map` com 3,7 MB seria servido (não verificado no domínio real) | devsecops-engineer |
| D-19 | Baixo | CI: regras e site publicados em paralelo, sem teste de regras | `deploy.yml`: `publicar_producao` e `publicar_regras_firestore` dependem só de `build_e_testes` | Site novo pode ir ao ar antes ou depois das regras; sem ordem nem teste | devsecops-engineer |
| D-20 | Baixo | Semântica e anúncios | Leitura de código e axe | Itens são `div`, não lista (`ItemLinha.svelte`); a prévia `aria-live="polite"` fala a cada tecla; o toast só existe no DOM quando mostrado (`App.svelte:551`), então `role="status"` pode não anunciar; "Leite" sem unidade não consolida com "Leite 2 un" (por design, testado) | frontend-engineer |
| D-21 | Baixo | Manifesto trava orientação | `manifest.json`: `"orientation": "portrait"` | Pode contrariar WCAG 1.3.4 em dispositivos com suporte fixo em paisagem | ux-research / frontend-engineer |

Já apontados por outros especialistas e não repetidos: ícones só com emoji e `title`, offline em partida a frio, erros do Firestore só no console, `atualizarEstatisticas` nunca chamada, perfil `users/{uid}` só criado pela migração, `heartbeat` nunca chamado, achados S-01 a S-05 do parecer de segurança.

### Jornadas verificadas sem defeito (4174)
| Jornada | Resultado |
|---|---|
| `leite 2 un` + `leite 1 un` | Consolidou em "Leite 3 un" |
| `2x ovos`, `500g queijo`, `arroz 5kg #Mercearia`, `pão 12` | qtd, unidade e categoria corretas |
| Marcar/desmarcar | `aria-pressed` e "1 de 10 itens" atualizam |
| Editar item (nome, qtd, unidade, preço) | Salva; total estimado R$ 179,87 correto |
| ▲▼ e arrasto por toque | Reordenam e persistem na sessão |
| Modo compra: marcar, "Ocultar pegos", rodapé | "2 de 10 pegos R$ 16,47" correto |
| Finalizar com pendentes | Cria "Mercado 2" com os 9 pendentes; histórico "2 de 11 itens · R$ 85,40" |
| Valor `85,40` | Aceito; diferença "R$ 94,47 abaixo da estimativa" |
| Recorrente | "Feira 16/11", itens desmarcados, "repete a cada 7 dias" |
| Preços com 1 compra | Sem divisão por zero; variação oculta; um registro por item pago |

## Acessibilidade (WCAG 2.2 AA)
| Tela | Axe (wcag2a, 2aa, 21a, 21aa, 22aa, best-practice) |
|---|---|
| Login | 0 violações |
| Onboarding | 0 violações, 1 incompleto (`aria-required-children`, D-11) |
| Lista vazia, lista com itens, editar item, preços, histórico, insights, nova lista, tema escuro | 1 violação crítica cada: `aria-required-children` no `.abas` (D-11) |
| Modo compra e checkout | + `color-contrast` serious (4,08:1, D-10a) + `region` moderate (o `<video>` do plano B do Wake Lock, que o Chromium sem cabeça acionou; em aparelho com Wake Lock nativo pode não ocorrer) |

Comando: `node axe.cjs` (axe-core injetado com `addScriptTag` em 4174, largura 390). [FATO]
Pontos manuais:
- **Rótulos:** campos de formulário têm `label for`; botões emoji têm nome por `title` (axe passa, mas `label-content-name-mismatch` fica "incompleto" em 24 nós na lista).
- **Teclado:** Tab percorre tudo; sem armadilha; sem setas nas abas; foco de modal em D-08.
- **Foco visível:** presente, `outline` 2 px verde (5,36:1).
- **Ordem de foco:** o campo de entrada vem depois de todos os itens, o que é coerente; ▲▼ e arrasto geram 4 paradas por item (4×N tabs).
- **Zoom/reflow:** sem rolagem horizontal em 320 px (equivale a 400% em 1280); legibilidade ruim (D-12). Fontes em `px` (10 a 14 px): ignoram a preferência de tamanho de texto do navegador. [RECOMENDAÇÃO] migrar para `rem`.
- **Lighthouse (arquivo de outro agente, não reexecutado por mim):** `lh.json` do front-end (fora do repositório) marca acessibilidade 100. Reforça que a ferramenta automática não vê D-08, D-09, D-10(b) nem D-12.
- **Leitor de tela real (NVDA, VoiceOver, TalkBack):** não verificado.

## Responsividade
| Largura | Resultado (`node resp.cjs`) |
|---|---|
| 320 | Sem rolagem horizontal em login, onboarding, lista, modo compra, checkout. Falha de uso em D-12 |
| 390 | Sem rolagem; capturas do Head em `docs/capturas/2026-11/mobile-*.png` |
| 768 | Sem rolagem; recibo centralizado em 560 px, uso econômico do espaço, sem quebra (`docs/capturas/2026-11/qa-r768-02-lista.png`) |
| 1280 | Sem rolagem; capturas do Head `desktop-*.png` |
Capturas minhas: `docs/capturas/2026-11/qa-*.png` (as citadas; as demais ficaram fora do repositório). [FATO] Retrato apenas; paisagem em celular não verificada.

## Desempenho básico
Linha de base **local, em `vite preview`, sem throttling, não representa produção**. Comando `node perf.cjs` (6 cargas em contexto novo, 390×844, medianas): TTFB 3 ms; FCP 184 ms (min 168, máx 392); LCP 204 ms; DCL 166 ms; load 325 ms; login interativo 355 ms (até o botão "Usar sem conta" aparecer); long tasks 0 ms; CLS 0,000; 3 recursos, 243 270 bytes de transferência. [FATO]
Para comparação, `lh.json` (Lighthouse 13.6.0, móvel simulado, gerado por outro agente) traz desempenho 0,77, LCP 6,7 s e TTI 6,7 s. A diferença é esperada com 4G simulado e CPU 4× mais lenta. [HIPÓTESE] O gargalo é o bundle principal de ~238 kB gzip (Firebase), pois `jspdf` (400 kB) e `html2canvas` (200 kB) são chunks separados. [RECOMENDAÇÃO] orçamento em CI (abaixo).

## Testes executados
| Tipo | Comando ou procedimento | Resultado |
|---|---|---|
| Unitários (do autor) | `cd /home/user/compra-planejada && npx vitest run 2>&1 \| tail -6` | 5 arquivos, 132 passando, 529 ms |
| Reprodução do Bloqueador | `node repro-4173.cjs` (cópia de `debug.cjs` com porta 4173) | `pageerror Error: https://svelte.dev/e/effect_update_depth_exceeded`; "Próximo" ineficaz |
| E2E manual scriptado | `node jornada.cjs`, `node jornada2.cjs` (4174) | 11 jornadas OK; defeitos D-02 a D-07, D-13 a D-17 |
| Acessibilidade | `node axe.cjs`, `node teclado.cjs` | seção Acessibilidade |
| Responsividade | `node resp.cjs` | seção Responsividade |
| Desempenho | `node perf.cjs` | seção Desempenho |

## Não verificado
- Fluxo com conta Firebase (login, Firestore, famílias, convites, presença): sem credenciais nem emulador. O D-01 é do caminho `MemoryRepository`; no caminho com conta o callback do Firestore é assíncrono, então [HIPÓTESE] o laço não ocorre. Confirmar em ambiente com conta de teste.
- Emulador do Firestore e testes de regras: sem Java nem rede garantidos.
- Leitor de tela real, contraste de tema escuro em uso real, teclado virtual de celular.
- Offline, service worker, instalação do PWA e atualização de versão.
- OCR (`tesseract.js`), PDF e Web Share: apenas o ramo de erro do "Compartilhar" apareceu (toast "Não foi possível compartilhar" no Chromium de teste).
- Domínio real e produção: nada foi medido fora do `vite preview` local.

## Riscos remanescentes
- [Alto] Camada de dados e regras sem teste, com publicação automática das regras: os achados S-01 e S-02 do parecer de segurança teriam sido pegos por teste de regra.
- [Alto] Sem E2E nem teste de componente, o CI aprova uma build que não abre (D-01). Qualquer regressão da casca passa.
- [Médio] Duas implementações do contrato de repositório com um só conjunto de testes: divergências (por exemplo `deleteList` do Firestore em lote único, sem divisão acima de 500 itens) são [HIPÓTESE] e só emulador confirma.
- [Médio] Cálculos financeiros do usuário (total pago) com parsing frágil (D-06).

## Estratégia de testes recomendada
### Pirâmide para este projeto
| Camada | Ferramenta | O que cobre | Esforço |
|---|---|---|---|
| 1. Unitário de domínio (existe) | Vitest | Manter; acrescentar preço na entrada, `parseValorBR`, nomes com número; trocar relógio por `vi.useFakeTimers` | P |
| 2. Serviços e store | Vitest + jsdom | `listas.ts` até 80% de ramos; store sem laço de efeito | M |
| 3. Componente | `@testing-library/svelte` + jsdom | `Modal` (foco, Esc), `EntradaRapida`, `ModalCheckout`, `TelaInsights` (estados vazios), `ItemLinha` | M |
| 4. Integração do `FirestoreRepository` | emulador + Vitest | Mesmos casos de `repositorio.test.ts` rodados contra o emulador (suíte de contrato compartilhada), `deleteList` e `addItems` acima de 450 | G |
| 5. Regras | `@firebase/rules-unit-testing` + emulador | S-01, S-02, ingresso, revogação, viewer não escreve, estranho não lê, mover lista, `users/{uid}` | G (precisa de Java no CI) |
| 6. E2E | Playwright em `vite preview`, modo sem conta | 10 casos abaixo + axe em cada tela + larguras 320/390/768/1280 | M |
| 7. Fumaça pós-deploy | Playwright contra o canal de preview do PR | Abre, "sem conta", adiciona 1 item, 0 `pageerror`; no live, só leitura | M |
| 8. Desempenho e acessibilidade em CI | Lighthouse CI + `@axe-core/playwright` | Orçamentos abaixo | P |
| 9. Qualidade dos testes | Stryker no domínio | Detecta asserções fracas (ex.: "taxa de acerto") | M |

### Os 10 primeiros casos E2E (Dado/Quando/Então)
1. **Entrar sem conta (cobre D-01).** Dado app em `vite preview` sem sessão; quando clico em "Usar sem conta" e passo o onboarding até "Começar"; então vejo a lista "Mercado" vazia e nenhum `pageerror` ocorreu.
2. **Entrada rápida.** Dado lista vazia; quando digito `2kg tomate` e Enter; então aparece "Tomate", "2 kg", em "Hortifruti".
3. **Consolidar duplicados.** Dado "Leite 2 un"; quando adiciono `leite 1 un`; então há um só item "Leite 3 un".
4. **Preço na entrada (falha até a decisão de D-04).** Dado lista vazia; quando digito `frango 1,2kg 18,90`; então o item é "Frango", "1,2 kg", R$ 18,90, ou o app recusa o formato com aviso. Registrar a decisão do product-manager antes de escrever.
5. **Marcar e progresso.** Dado 3 itens; quando marco 1; então `aria-pressed=true`, "1 de 3 itens" e o item vai para o fim do grupo.
6. **Editar item e foco.** Dado item "Arroz"; quando abro ✎, altero preço para `28,90` e salvo; então "Total estimado" soma R$ 28,90 e o foco volta ao ✎ (falha hoje por D-08).
7. **Modo compra.** Dado 3 itens, 1 marcado; quando entro no modo compra, marco outro, oculto pegos e adiciono `2kg tomate`; então restam 2 itens visíveis, o novo é "Tomate 2 kg" e o rodapé mostra "2 de 4 pegos" (falha hoje por D-05).
8. **Finalizar com pendentes.** Dado 3 itens, 1 comprado; quando finalizo, escolho "Criar lista com os pendentes" e informo `1.234,56`; então existe "Mercado 2" com 2 itens e o histórico mostra R$ 1.234,56 (falha hoje por D-06).
9. **Histórico e reativar.** Dado uma compra finalizada; quando abro o histórico e escolho "Trazer só não comprados"; então uma lista nova fica ativa e um aviso confirma (falha hoje por D-14).
10. **Recorrência.** Dado lista "Feira" recorrente de 7 dias com 2 itens, 1 marcado; quando finalizo; então surge "Feira dd/mm" (hoje + 7 dias) com os 2 itens desmarcados.
Acréscimos: reordenar por teclado (▲▼) e toque; conta/sair; `?acao=nova-lista`; "Insights" com 1 compra mostra explicação.

### Portões de CI
| Portão | Valor inicial | Observação |
|---|---|---|
| Cobertura (Vitest `thresholds`) | linhas 80%, ramos 65%, funções 80%; `domain/` 90% linhas | Hoje 83,6 / 68,2 / 82,1: não derruba nada; subir 5 pontos por trimestre |
| Incluir no relatório | `all: true` com `src/lib/**/*.ts` | Hoje `FirestoreRepository.ts` some do relatório e infla a nota |
| Job de regras | Roda antes de `publicar_regras_firestore` (`needs`) | Bloqueia a publicação se uma regra falhar |
| E2E de fumaça | 0 `pageerror` e 0 violações axe "serious/critical" | Job obrigatório no PR |
| Lighthouse CI | Desempenho ≥ 0,85, LCP ≤ 2,5 s e TBT ≤ 200 ms em móvel simulado; JS inicial ≤ 250 kB gzip; acessibilidade ≥ 0,95 | Hoje desempenho 0,77; subir em etapas |
| Fumaça no preview | Pós-deploy do canal do PR | Falha trava o merge |

## Evolução 6 a 12 meses
- **0 a 1 mês:** corrigir D-01 e D-02; E2E 1, 2, 3, 5, 10; `@axe-core/playwright` no CI; ordenar o CI (regras só depois do teste).
- **1 a 3 meses:** emulador, suíte de contrato e testes de regras (S-01, S-02); testes de componente de `Modal`, checkout e insights; resolver D-03 a D-12.
- **3 a 6 meses:** portões de cobertura e Lighthouse; fumaça no canal de preview; Stryker no domínio; testes visuais em 320 e 768.
- **6 a 12 meses:** offline e atualização do service worker no E2E (depois de pré-cache); testes de carga leve das listas grandes (500+ itens); revisão trimestral dos portões; relatório de defeitos por severidade a cada release.

## Decisões pendentes
- Persistir o modo sem conta no `localStorage` ou assumir que é só sessão e mudar o texto (D-02). Define o E2E 1.
- Aceitar preço na entrada rápida ou recusar o formato com aviso (D-04).

## Conclusão do parecer
**REPROVADO** para a 5.0.0. Fundamento: D-01 (Bloqueador) impede o uso do modo sem conta, e D-02 (Alto) perde dados sem aviso verdadeiro. Pela regra da constituição, Bloqueador ou Alto em aberto impedem merge e release. Reavaliação rápida: com D-01 e D-02 corrigidos e o E2E 1 verde, o parecer passa a **APROVADO COM RESSALVAS**, se não surgir defeito novo no caminho com conta (não verificado aqui).
