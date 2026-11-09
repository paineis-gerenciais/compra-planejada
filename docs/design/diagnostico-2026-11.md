# Diagnóstico visual e do design system "Cupom" — 2026-11-09

Escopo: revisão somente leitura (v5.0.0). Base: tokens em `src/app.css`, estilos locais de `src/App.svelte` e `src/lib/ui/*.svelte`, `public/manifest.json`, `index.html` e 41 capturas (mobile 390×844 @2x, desktop 1280×800, Chromium headless, modo "sem conta", tema escuro só em `desktop-03b`). Rótulos: [FATO] = lido no código/captura ou calculado à mão (fórmula WCAG 2.x, luminância relativa); [HIPÓTESE] = precisa de teste em aparelho; [RECOMENDAÇÃO]. Nada aqui muda paleta ou fontes; o que tocar nelas está marcado "exige autorização do usuário".
Caminhos de captura abaixo são relativos a `docs/capturas/2026-11/` (o Head copiou as capturas citadas para o repositório).

## 1. Resumo
- A metáfora de cupom é o melhor ativo e funciona: recibo da lista (`mobile-04`), carimbos em mono, serrilha, tracejados. A base de tokens existe e o contraste de texto do tema claro está bom.
- O problema central é de **consistência e ergonomia**, não de identidade: (a) ícones de ação são emoji coloridos fora da paleta (azul, amarelo) e sem rótulo; (b) alvos de toque de 26–36 px com token `--tap` de 44 px ignorado; (c) ~78 declarações `font-size` em px fora dos tokens, várias de 8,5 a 10 px; (d) 7 estilos de botão duplicados; (e) o tema escuro tem pares abaixo de 4,5:1, e não há como ativá-lo.
- Estado mais frequente do app é o pior desenhado: após finalizar uma compra a tela é só "Nenhuma lista ainda." sem ação (`mobile-10-apos-finalizar`).
- Três melhorias prioritárias (seção 8): barra de ferramentas com ícones SVG, rótulos e alvo 44 px; escala tipográfica e contraste (tokens); estados vazio/carregando/erro + alternador de tema.

## 2. Pontos fortes
- [FATO] Identidade única e coerente com o domínio; recibo (`Recibo.svelte`, `mobile-04`, `desktop-04`) é legível e agradável. Dica de leitura (qtd à direita, categoria em caixa alta tracejada) é fiel a um cupom real.
- [FATO] Tipografia mista bem pensada: nomes em Inter, números em mono (`app.css:10-14`). Decisão documentada no próprio CSS.
- [FATO] `--ink-light` já foi corrigido por contraste (`app.css:16`); `:focus-visible` global (`app.css:109`); `prefers-reduced-motion` tratado (`app.css:133`); `sr-only`; `env(safe-area-inset-bottom)` em rodapés (`Modal.svelte:40`, `ModoCompra.svelte:148`); `viewport-fit=cover` (`index.html:5`).
- [FATO] Item marcado usa 3 sinais (caixa verde com check, texto riscado, cor `--ink-light`): não depende só de cor (`mobile-07`).
- [FATO] Modo compra: linha de 13 px de padding, nome 17 px, barra verde de contexto, rodapé fixo com progresso e total (`mobile-07`). Direção certa.
- [FATO] Modal: folha inferior no celular e centrado ≥560 px, Esc e toque fora (`Modal.svelte:24-35`); rodapé com botões 44 px.
- [FATO] Login e onboarding legíveis, hierarquia clara, botão primário verde único por tela (`mobile-01`, `mobile-02-onboarding-1`).

## 3. Problemas
Severidade pela constituição. "Ev." = evidência.

| # | Área | Sev. | Achado | Ev. | Recomendação |
|---|---|---|---|---|---|
| P1 | Ícones | Alto | Emoji como ícone de ação: cores fora da paleta (💰 amarelo, 💡 amarelo, 👤 azul, 📷 cinza), aparência muda por sistema, sem controle de cor/peso (no escuro não se adaptam), sem rótulo visível; significado ambíguo (💡 = insights? 🕘 = histórico? 🧭 = corredores?). Carrinho 48 px do onboarding é azul-acinzentado. | `mobile-04` (barra), `desktop-03b`, `mobile-02-onboarding-1`; `TelaOnboarding.svelte:89`; `ItemLinha.svelte:70-76` (⠿ ▲ ▼ ✎ ×) | SVG inline `currentColor` + rótulo (seção 5 e M1). |
| P2 | Alvo de toque | Alto | Botão de conta 30 px, ferramentas 34 px, aba 36 px, "+ nova lista" 36 px, ação do item 36 px, `.remover` 32 px, caixa de marcar 26 px (30 no modo compra), ▲▼ ~20×16 px (fonte 10 px). `--tap` (44) só vale em botões de rodapé. ▲▼ ficam abaixo até do mínimo 24 px do WCAG 2.5.8. | `App.svelte:628,636,649,652,656`; `ItemLinha.svelte:90,95,128,139`; `TelaGerenciarFamilia.svelte:121` | M1; todo controle ≥ `--tap` (ou área de toque estendida). |
| P3 | Tipografia | Alto | Escala 11/12,5/14/16/19 é pequena para uso em pé e luz forte; ~78 `font-size` em px fora dos tokens, 15 abaixo de 11 px (8,5; 9; 9,5; 10). Rótulos de dado em mono 9–11 px (eixo do gráfico, "pega/pegou", ▲▼). | seção 7; `TelaPrecos.svelte:111-112`; `App.svelte:642,645`; `ItemLinha.svelte:115,128` | M2: piso 12 px (mono) / 13 px (sans), tokens em rem. |
| P4 | Contraste não-texto | Alto | Borda `--border` sobre `--card` é 1,46:1 (claro) e 1,28:1 (escuro): a caixa de marcar vazia, inputs e botões secundários quase somem (WCAG 1.4.11 pede 3:1 para identificar o controle). | `mobile-04` (caixas), `mobile-06` (campos); `ItemLinha.svelte:91` | token `--border-strong` para controles (seção 4). |
| P5 | Contraste tema escuro | Alto | Texto branco sobre `--green` escuro: 3,08:1 em botões primários 13 px; vermelho sobre `--amber-light` escuro 3,88:1 em erros 12,5 px. | `desktop-03b` (botão "Modo compra" claro com texto branco); `Modal.svelte:48`, `TelaLogin.svelte:114,119` | token `--on-green`; mensagens com texto `--ink`. |
| P6 | Estado vazio | Alto | Após finalizar, e em primeiro uso, a tela é só "Nenhuma lista ainda." (sem CTA, sem ilustração); lista vazia: uma frase solta. | `mobile-10-apos-finalizar`, `desktop-03b`; `App.svelte:674` | M3. |
| P7 | Tema | Médio | Tema escuro existe (`app.css:75`) mas nenhum alternador, nem `prefers-color-scheme`; `theme-color` e `background_color` fixos no claro (flash claro na abertura do PWA escuro). | `index.html:6`; `manifest.json:9-10` | M3. |
| P8 | Contraste texto | Médio | Âmbar sobre papel 3,78:1 e sobre `--amber-light` 3,63:1 em texto de 12 px (aviso do OCR). | `TelaCupomOCR.svelte:140` | texto do aviso em `--ink`; âmbar só em ícone/borda. |
| P9 | Contraste texto | Médio | Modo compra: texto branco 12 px bold sobre botão translúcido (`rgba(255,255,255,.18)` sobre verde) ≈ 4,1:1. | `ModoCompra.svelte:133-137`, `mobile-07` | fundo `--paper`, texto `--ink` (ou borda 1,5 px e fundo verde mais escuro). |
| P10 | Foco | Médio | Anel de foco é verde; sobre a barra verde do modo compra e sobre botões primários verdes fica ~1:1 do lado de fora. | `app.css:109-113`; `ModoCompra.svelte:129` | `:focus-visible` com anel duplo (2 px `--paper` + 2 px `--ink`) nessas superfícies. |
| P11 | Botões | Médio | 7 definições de botão com alturas 36/38/42/44/48 e fontes 11,5/12/13/13,5/14: `App.svelte:660,663`, `Modal.svelte:43-49`, `ModoCompra.svelte:133,155`, `TelaOnboarding.svelte:102-106`, `TelaLogin.svelte:109-114`, `EntradaRapida.svelte:105-111`. Verde+branco repetido 8 vezes. | idem | componente `Botao` único (seção 6). |
| P12 | Mono em texto longo | Médio | Botões com frase em mono bold quebram em 2 linhas ("Criar lista com os pendentes", "Usar sem conta neste aparelho"); meta-linha do histórico em mono 12 px corrida ("1 de 6 itens· R$ 85,40", sem espaço antes de "·"). | `desktop-08`, `mobile-01`, `mobile-13` | mono só para número e carimbo ≤ 2 palavras; resto em Inter 600 (decisão de caráter: ver Decisões). |
| P13 | Densidade do item | Médio | 4 ações por linha (⠿, ▲▼, ✎, ×) ocupam ~55% da largura de 358 px; o nome fica com ~150 px; ▲▼ duplicam o arrastar (decisão de acessibilidade consciente, `ItemLinha.svelte:67-69`). | `mobile-04` | modo "Reordenar" ou menu "⋯"; manter alternativa a arrastar. Validar com ux-research. |
| P14 | Entrada no celular | Médio | [HIPÓTESE] A entrada rápida fica abaixo da lista (não fixa): com lista longa, adicionar exige rolar até o fim (`desktop-08` mostra a ordem). Inputs de 15 px provocam zoom ao focar no iOS Safari. | `EntradaRapida.svelte:101`, `TelaLogin.svelte:107`, `ModalEditarItem.svelte:86`, `ModalCheckout.svelte:67`, `ModalNovaLista.svelte:64`, `TelaFamilias.svelte:116` | inputs 16 px (`--fs-lg`); testar entrada fixa com teclado em aparelho. |
| P15 | Modo compra | Médio | O cabeçalho do app (140 px de abas e ferramentas) continua visível sob a barra verde: ~200 px de "chrome" em 844. Entrada rápida é `position: fixed; bottom: 118px`, `z-index: 37` solto. | `mobile-07`, `mobile-07b`; `ModoCompra.svelte:142` | modo compra em tela cheia (esconder cabeçalho do app). |
| P16 | Desktop | Médio | Cabeçalho ocupa 1280 px (título à esquerda, ferramentas a 1100 px de distância) enquanto o conteúdo é uma coluna de 560 px; sem uso do espaço lateral; modais sem serrilha, sem relação com a metáfora. | `desktop-04`, `desktop-08` | cabeçalho com `max-width` igual à coluna; ver Evolução. |
| P17 | Modais e metáfora | Baixo | Modais são cartões arredondados genéricos em `--paper`; título em caixa alta. A metáfora some nos fluxos de dados (preços, histórico, insights). Gráfico de barras com rótulos de 8,5–9 px. | `mobile-09`, `desktop-11`; `TelaPrecos.svelte:111-112` | serrilha no topo da folha, título como "carimbo"; rótulos ≥ 12 px. |
| P18 | Marca | Médio | Nome varia: "Compra Planejada" (cabeçalho, login), "Compras" (onboarding, manifest). | `mobile-02-onboarding-1`; `manifest.json:2-3` | Head/PM decide o nome; design só aplica. |
| P19 | Avatar | Baixo | Iniciais em branco, 8,5–10 px, sobre cor de avatar rosada: [HIPÓTESE] ~3:1 (cor vem de função, não calculada aqui). | `App.svelte:642`; `TelaFamilias.svelte:106`; `ModalMoverLista.svelte:62` | iniciais ≥ 12 px bold; checar cada cor da paleta de avatar. |
| P20 | Fontes | Baixo | Fontes via Google Fonts CDN (`display=swap`): sem rede, o PWA cai para fontes do sistema e a identidade de mono desaparece; Inter 700 não é carregado, mas bold é usado em Inter (síntese). | `index.html:9-11` | hospedar WOFF2 locais e pré-cache no service worker (fronteira com frontend-engineer; licença SIL OFL, conferir). |
| P21 | Estados | Baixo | Não há skeleton/carregando visual (só texto "Carregando…" em `App.svelte:622`); erros usam texto vermelho sobre fundo âmbar (semântica trocada); sucesso só por toast. | `TelaLogin.svelte:119`, `TelaCupomOCR.svelte:139` | M3. |

Observação de dado (para o Head): em `mobile-04/06/07` o "Frango 1,2kg" aparece com quantidade `18.9` e unidade "Un.", e Preço vazio; parece artefato do roteiro de captura (preço digitado no campo de quantidade). Não é achado de design.

> **Nota do Head (2026-11-09):** não é artefato. O texto "frango 1,2kg 18,90" foi digitado inteiro na entrada rápida e o interpretador tratou "18,90" como quantidade (`parse.ts:80-89`). É o achado 1 do parecer de UX (Alto) e consta no diagnóstico consolidado como A-UX1.

## 4. Tipografia e cor
### Tipografia
- [FATO] Escala atual: 11 / 12,5 / 14 / 16 / 19 (`app.css:39-43`) mais ~78 tamanhos soltos (8,5 a 32 px). Caixa alta + `letter-spacing` 0,4–0,5 px em mono para categorias (`mobile-04`) funciona como carimbo e é o melhor uso de mono; em 11 px bold é o limite.
- [RECOMENDAÇÃO] Escala semântica em `rem` (respeita preferência de tamanho do sistema), piso por família:

| Token | Valor | Uso |
|---|---|---|
| `--fs-xs` | 0,75rem (12 px) | só mono caixa alta (categoria, carimbo, selo); nunca sans, nunca texto corrido |
| `--fs-sm` | 0,8125rem (13 px) | metadados, ajuda, rótulos de campo, etiqueta "pega" |
| `--fs-md` | 0,9375rem (15 px) | texto de corpo e nome de item (Inter) |
| `--fs-lg` | 1rem (16 px) para input; 1,0625rem (17 px) nome no modo compra | campos (evita zoom iOS), título de seção |
| `--fs-xl` | 1,25rem (20 px) | título de modal / h1 |
| `--fs-num` | 2rem (32 px) | número-destaque (insights, total) |

  Regras: Inter para nomes, frases e botões longos; mono para quantidade, preço, data, selo e carimbo ≤ 2 palavras. Peso: 400 corpo, 600 ênfase, 700 só em mono. Altura de linha 1,5 corpo / 1,25 título. Nada abaixo de 12 px. Trocar fonte de botões de mono para Inter 600 **muda o caráter**; tratar como decisão do usuário (seção 11).

### Contraste (WCAG 2.2, razão = (L1+0,05)/(L2+0,05); luminância calculada à mão a partir do sRGB)
[FATO] Luminâncias: paper .865, card .940, ink .024, ink-light .129, green .121, red .110, amber .192, border .630, green-light .825, amber-light .828 (claro). Escuro: paper .0138, card .0207, ink .796, ink-light .351, green .291, red .261, amber .321, amber-light .0301, border .0404.

| Par (texto/fundo) | Razão | Veredito |
|---|---|---|
| ink / paper | 12,4:1 | passa |
| ink-light / paper · / card | 5,12:1 · 5,53:1 | passa (11–12 px ainda é pequeno) |
| green / paper · card · green-light | 5,36 · 5,80 · 5,13 | passa |
| branco / green (botão primário) | 6,15:1 | passa |
| red / paper · amber-light; branco / red | 5,73 · 5,50 · 6,57 | passa |
| amber / paper · amber-light | **3,78 · 3,63** | **falha texto normal (4,5)**; passa só como ícone/borda (3:1) |
| branco / barra translúcida do modo compra (≈#62866B) | **≈ 4,1:1** | **falha** em 12 px bold |
| border / card (caixa vazia, campos) | **1,46:1** | **falha 3:1 (não-texto)** |
| Escuro: ink / paper | 13,2:1 | passa |
| ink-light / card · paper | 5,68 · 6,28 | passa |
| green / paper · card | 5,35 · 4,83 | passa |
| **branco / green escuro** | **3,08:1** | **falha** (botão primário 13 px) |
| amber / card · amber-light | 5,26 · 4,63 | passa (margem curta) |
| red / paper · card | 4,87 · **4,40** | falha em card |
| **red / amber-light** | **3,88:1** | **falha** (mensagem de erro) |
| border / card | **1,28:1** | **falha 3:1** |

Cor como único sinal: [FATO] item marcado tem 3 sinais (ok). [FATO] `TelaPrecos.svelte:124-125` colore valor `ok` (verde) / `alto` (vermelho) sem ícone: se não houver texto "acima/abaixo", é só cor (verificar o markup; daltonismo vermelho/verde). Adicionar seta ou palavra.

Correções propostas (tokens, sem mudar a paleta): `--on-green: #FFFFFF` (claro) e `#211F1B` (escuro; 5,35:1 sobre o verde escuro); mensagens de erro e aviso em fundo `--card`, texto `--ink`, borda esquerda 3 px na cor semântica (red ≥5,7:1, amber 3,78:1 como elemento gráfico ≥3:1). `--border-strong`: opção A, reutilizar `--ink-light` (5,5:1 sobre card; sem cor nova); opção B, novo neutro `#8A7F6C` claro (≈3,7:1 sobre card, ≈3,4:1 sobre paper) e `#7D7464` escuro (≈3,2:1 sobre card), família kraft; **extensão de paleta: exige autorização do usuário**. Valores B calculados à mão, reconferir com ferramenta.

## 5. Iconografia: proposta de mapeamento
- [RECOMENDAÇÃO] SVG inline (sem biblioteca em runtime), importados individualmente de **Lucide** (24×24, traço 2 px, `stroke="currentColor"`, cantos redondos). Licença ISC (parte herdada do Feather, MIT) [HIPÓTESE: confirmar no repositório oficial antes de adotar; Phosphor, MIT, é a alternativa]. Cada ícone ~0,3–0,5 KB inline [HIPÓTESE]. O app já usa SVG inline no check do item (`ItemLinha.svelte:40`): padrão existente.
- Regras: ícone sempre com rótulo visível nas ferramentas principais, `aria-hidden="true"` no SVG e nome acessível no botão; tamanho 22 px dentro de alvo 44 px; cor `--ink` (ferramentas) ou `--ink-light` (secundário), `--green` para ação primária; no escuro herda automaticamente.

| Ação | Hoje | Ícone Lucide | Rótulo visível |
|---|---|---|---|
| Preços (gasto e variação) | 💰 | `chart-column` | Preços |
| Insights ("o que sua cesta está dizendo") | 💡 | `lightbulb` | Dicas |
| Ler cupom (OCR) | 📷 | `scan-line` (ou `camera`) | Cupom |
| Histórico de compras | 🕘 | `history` | Histórico |
| Conta | 👤 | `user-round` (ou avatar com inicial) | aria-label "Conta" |
| Nova lista | `+` | `plus` (aba tracejada) | aria-label "Nova lista" |
| Modo compra | 🛒 | `shopping-cart` | Modo compra |
| Mover lista | 🔀 | `arrow-right-left` | Mover |
| Corredores (ordem do mercado) | 🧭 | `route` | Corredores |
| PDF | 🧾 | `file-text` | PDF |
| Compartilhar | 🔗 | `share-2` | Compartilhar |
| Voz | 🎤 | `mic` (gravando: `mic` + fundo `--red`) | aria-label |
| Editar / remover | ✎ / × | `pencil` / `trash-2` | aria-label (já existe) |
| Arrastar / subir / descer | ⠿ ▲ ▼ | `grip-vertical` / `chevron-up` / `chevron-down` | aria-label (já existe) |
| Finalizar / ok | ✓ | `check` | texto |

Os nomes "Dicas" e "Cupom" são sugestão de rótulo curto; texto final é do Head/PM.

## 6. Componentes e estados
Legenda: ok = existe e adequado, parcial, falta. Estados: padrão, foco, hover, desabilitado, carregando, vazio, erro, sucesso.

| Componente | Situação | Lacunas |
|---|---|---|
| Botão | 7 definições (P11). Variantes de fato: primário verde, secundário card, perigo (`Modal.svelte:49`), tracejado de remover (`mobile-06`), translúcido (modo compra), link (`TelaLogin.svelte:118`). | sem hover/pressed/carregando; desabilitado só por `opacity`; ver `Botao` abaixo. |
| Input | label acima, borda `--border`, fundo variável (paper no login/entrada, card no checkout: `TelaLogin.svelte:107`, `ModalCheckout.svelte:67`), foco só pelo anel global. | sem ajuda/erro associado ao campo (`aria-describedby`), placeholder padrão do navegador (cinza ≈4:1, [HIPÓTESE]), borda 1,46:1. |
| Abas de listas | ativa = tinta; inativa = card + `--ink-light`; overflow horizontal sem indício (sem fade); `+` tracejado. | alvo 36 px, sem indicador de rolagem. |
| Pílula de escopo | 30 px, mono 11 px, avatar 19 px com texto 8,5 px (`App.svelte:632-645`). | alvo; seta 9 px; desabilitada = opacity 0,7. |
| Item da lista | normal ok; marcado ok (3 sinais); arrastando `opacity .5` (`ItemLinha.svelte:87`) sem elevação ou placeholder; atribuído = etiqueta mono 10 px; editando = modal. | alvos P2; etiqueta 10 px; sem hover/pressed. |
| Modal | folha/centrado coerente. | sem alça visual, sem serrilha; botões `:global(.rodape button)` vazam estilo; foco/aria fora do meu papel. |
| Toast | pílula `--ink`; `z-index: 70` literal (`App.svelte:671`, token `--z-toast` é 60). | sem variante erro/sucesso, sem ação "Desfazer". |
| Vazio / carregando / erro | texto simples (P6, P21). | M3. |
| Tema escuro | tokens completos para 11 cores; serrilha usa `--card` e adapta (`desktop-03b`); emoji não adaptam; sem alternador. | P5, P7. |

Componente alvo `Botao` (frontend-engineer): `variante` = primario | secundario | terciario | perigo; `tamanho` = padrao (min 44) | grande (min 48, modo compra); `carregando`; `desabilitado`. Primário: fundo `--green`, texto `--on-green`; secundário: fundo `--card`, borda `--border-strong`, texto `--ink`; terciário: sem borda, texto `--green` sublinhado; perigo: fundo `--red`, texto `--on-red` (claro: branco, 6,57:1; escuro: `#211F1B` sobre `#D2705E` ≈ 4,7:1, a reconferir). Hover (ponteiro fino): escurecer 6%; pressed: `transform: translateY(1px)`; carregando: spinner 16 px + rótulo mantido, largura fixa.

## 7. Desvios de tokens (arquivo:linha)
[FATO] Principais valores fora dos tokens:
- `font-size` em px (~78 ocorrências): `App.svelte:629,634,642,645,652,656,660,664,670`; `ItemLinha.svelte:108,115,128,133`; `TelaPrecos.svelte:105,111,112,117,118,122,123,127,129,130`; `TelaGerenciarFamilia.svelte:106,111-114,116,118-122`; `TelaFamilias.svelte:103,106,109,110,113,115-117`; `TelaInsights.svelte:98,99,102-108`; `TelaCupomOCR.svelte:139,140,144,149,154`; `ModoCompra.svelte:132,135,152,153`; `Modal.svelte:44`; `TelaLogin.svelte:107,109,118-120`; campos de 15 px em `EntradaRapida.svelte:101`, `ModalEditarItem.svelte:86`, `ModalCheckout.svelte:67`, `ModalNovaLista.svelte:64`.
- Menores que 11 px: `TelaPrecos.svelte:111` (9), `:112` (8,5), `:130` (9); `App.svelte:642` (8,5), `:645` (9); `TelaGerenciarFamilia.svelte:116` (10), `:122` (9,5); `ItemLinha.svelte:115,128` (10); `TelaInsights.svelte:108` (10); `ModalMoverLista.svelte:62` (10); `ModalOrdemCorredores.svelte:99` (10).
- Dimensões de alvo/forma: `App.svelte:628` (30), `:636` (30), `:649` (36), `:652` (36), `:656` (34), `:664-666` (38); `ItemLinha.svelte:90,95` (26/30), `:139` (36); `TelaGerenciarFamilia.svelte:121` (32); `ModoCompra.svelte:136` (36), `:155` (48); `EntradaRapida.svelte:106` (42).
- Cor literal: `#fff` em `App.svelte:642,661`, `ModoCompra.svelte:129,134,144,156`, `Modal.svelte:48-49`, `TelaOnboarding.svelte:106`, `TelaLogin.svelte:114`, `EntradaRapida.svelte:110-111`, `ItemLinha.svelte:98`, `TelaGerenciarFamilia.svelte:109,116`, `TelaFamilias.svelte:106`, `ModalMoverLista.svelte:62`; `rgba` em `Modal.svelte:26,33`, `App.svelte:672`, `ModoCompra.svelte:134`, `TelaFamilias.svelte:105`. (Cores do logotipo do Google em `TelaLogin.svelte:58-61` são legítimas.)
- Z-index literais: `App.svelte:671` (70), `ModoCompra.svelte:142` (37), `:147` (36); tokens `--z-fab` e `--z-toast` existem.
- Espaçamento solto: `padding: 11px`, `13px`, `9px 11px`, `6px`, `7px` espalhados (ex.: `TelaLogin.svelte:107`, `Modal.svelte:45`, `App.svelte:633`); `--sp-5: 22px` e `--sp-6: 30px` fogem do grid de 8.
- Sombra e overlay sem token: `Modal.svelte:26,33`, `App.svelte:672`.

Tokens que faltam [RECOMENDAÇÃO]: `--tap-lg: 48px` (modo compra); `--icon: 22px`; `--border-strong`; `--on-green`, `--on-red`; `--surface` / `--surface-raised` (hoje paper/card fazem o papel); `--shadow-sm/md/lg` e `--overlay`; `--sp-*` em múltiplos de 4/8 (4, 8, 12, 16, 24, 32); `--fs-*` semânticos (seção 4); `--focus-ring` (duplo); `--r-sheet`. Documentação inexistente: criar `docs/design/design-system.md` mínimo com: princípios (cupom = recibo, mono = número/carimbo, Inter = nome), tabela de tokens (cor com razões, tipografia, espaço 8 pt, forma, alvo, elevação, z-index, movimento), catálogo de componentes (Botão, Campo, Aba, Pílula, ItemLinha, Modal/Folha, Toast, Aviso, EstadoVazio, Ícone) com estados, regras de acessibilidade (piso de fonte, alvo, contraste, foco) e regra de revisão visual: "PR não adiciona `px` de fonte nem hex fora de `app.css`".

## 8. Especificação das 3 melhorias prioritárias
### M1. Barra de ferramentas e alvos de toque (P1, P2, P13)
- **Comportamento:** as 4 ferramentas (Preços, Dicas, Cupom, Histórico) saem do canto da linha das abas e viram uma faixa própria sob as abas, 4 colunas iguais, cada uma ícone (22 px) acima de rótulo; a faixa **rola com o conteúdo** (não é fixa) para não aumentar o cabeçalho fixo. Conta vira botão 44 px (avatar/iniciais ou `user-round`). Abas e `+` com 44 px de altura; indicador de overflow (fade de 24 px à direita com `mask-image`) e `scroll-snap-type: x proximity`.
- **Medidas (390 px):** faixa com padding `--sp-4` laterais, `gap: --sp-2`; célula ≈ 83×56 px; ícone 22; rótulo Inter 500 `--fs-sm` (13 px) `--ink`; raio `--r-md`; borda 1 px `--border-strong`; fundo `--card`. Cabeçalho fixo previsto: ≈ 164 px (hoje 139), faixa de ferramentas +64 px fora do fixo.
- **Linha do item:** caixa de marcar com área de toque 44×44 (caixa visual 26 px, 28 no modo compra, via padding/`::before`); ✎ e × com 44 px **ou** substituídos por menu "⋯" (Editar, Subir, Descer, Remover); ⠿ e ▲▼ só no modo "Reordenar" (botão no cabeçalho do recibo). Dependência de UX: confirmar fluxo com ux-research antes de implementar a variante "menu".
- **Estados:** padrão; hover (ponteiro fino) fundo `--green-light`; pressed `translateY(1px)`; foco anel duplo (`--focus-ring`); desabilitado opacidade 0,5 + `cursor: not-allowed`; ativo (painel aberto) fundo `--green-light`, borda `--green` e `aria-expanded`/`aria-pressed` coerente.
- **Tokens:** `--tap`, `--icon`, `--border-strong`, `--fs-sm`, `--sp-2/4`, `--r-md`, `--focus-ring`. Componentes: `Botao` (variante secundario), `Icone`.
- **Aceite visual:** em 390 px, nenhum controle interativo < 44×44 px de área de toque (medir no inspetor); sem rolagem horizontal da página; cada ferramenta com ícone SVG e rótulo visível; nenhum emoji em ação; cabeçalho fixo ≤ 170 px; no tema escuro ícones legíveis (≥3:1).

### M2. Escala tipográfica e contraste por token (P3, P4, P5, P8, P9, P10)
- **Comportamento:** substituir os tamanhos em px por `--fs-*` (seção 4); piso de 12 px (mono) e 13 px (sans); inputs 16 px; `--border-strong` em caixa de marcar, inputs e botões secundários; `--on-green`/`--on-red`; avisos de âmbar/erro em fundo `--card` com texto `--ink`; botão translúcido do modo compra vira `--paper`/`--ink`; anel de foco duplo em superfícies verdes.
- **Medidas:** ver tabela de escala; altura de linha 1,5 corpo, 1,25 títulos; gráfico de preços com rótulos 12 px (largura mínima de barra 26 px já existente; se faltar espaço, rotular a cada 2 barras).
- **Estados:** foco visível 3:1 contra qualquer superfície (anel `--paper` interno + `--ink` externo); desabilitado: contraste não exigido, mas texto continua legível (opacidade ≥ 0,5).
- **Tokens:** `--fs-xs..xl`, `--fs-num`, `--border-strong`, `--on-green`, `--on-red`, `--focus-ring`.
- **Aceite visual:** nenhum `font-size` em px nem hex fora de `app.css` (verificável por `rg`); todos os pares da tabela da seção 4 ≥ 4,5:1 (texto) e ≥ 3:1 (borda de controle, foco) nos dois temas; texto de 12 px aparece só em mono caixa alta; zoom do navegador a 200% sem corte nem rolagem horizontal; entrada rápida a 16 px sem zoom automático em iOS (teste em aparelho).

### M3. Estados vazio/carregando/erro e alternador de tema (P6, P7, P21)
- **Vazio ("sem listas", pós-finalizar):** cartão-recibo com serrilha-topo e base (`.serrilha-topo/.serrilha-base` já existem), ilustração SVG de 96 px em traço (`--ink-light`, detalhe `--green`), título mono `--fs-lg`, texto Inter `--fs-md` `--ink-light`, CTA primário "Criar lista" (48 px) e secundário "Ler cupom". Lista vazia: mesma estrutura, mais compacta, apontando a entrada rápida. Textos finais: Head/PM.
- **Carregando:** skeleton de 3–4 linhas de item (barras `--border`, raio `--r-sm`, pulso 1,2 s; sem animação com `prefers-reduced-motion`), `aria-busy` e texto "Carregando…" em `aria-live="polite"`.
- **Erro/aviso/sucesso (`Aviso`):** fundo `--card`, borda esquerda 3 px (`--red`, `--amber`, `--green`), ícone `circle-alert` / `triangle-alert` / `circle-check` + texto `--ink`; ação opcional ("Tentar de novo"); toast com mesma gramática e ação "Desfazer" quando reversível.
- **Alternador de tema:** em "Sua conta": grupo "Aparência" com 3 opções (Automático, Claro, Escuro; padrão Automático segue `prefers-color-scheme`), controle segmentado de 3 botões 44 px com `role="radiogroup"`; aplicado em `<html data-tema>`; script mínimo no `<head>` antes da pintura (evita flash), `color-scheme: light dark`, duas `<meta name="theme-color">` (`#3F6B4A` claro; escuro a definir, ex.: `--paper` escuro `#211F1B`) e `background_color` do manifest conforme decisão (manifest só aceita um valor: manter claro). Persistência: preferência local do aparelho.
- **Tokens:** `--surface`, `--card`, `--ink-light`, `--green`, `--sp-4/5`, `--r-lg`, `--dur-base`. Componentes: `EstadoVazio`, `Skeleton`, `Aviso`, `SeletorTema`.
- **Aceite visual:** "Nenhuma lista ainda" sempre acompanhado de ação primária visível sem rolar em 390×844; skeleton aparece em < 100 ms e some sem salto de layout; erros legíveis (≥4,5:1) nos dois temas; trocar tema não causa flash claro na abertura; `desktop-03b` refeito com botão primário `--on-green` ≥ 4,5:1.

## 9. Evolução 6–12 meses
- Biblioteca de componentes documentada (catálogo estático em `prototypes/` ou Storybook se a equipe adotar; primeiro `design-system.md`), com regra "PR sem px de fonte nem hex solto".
- Ícone do app e splash: o ícone atual não foi inspecionado; redesenhar sobre o motivo de cupom/serrilha em `--paper`/`--green`, versão maskable com área segura de 80%; splash em `--paper`.
- Ilustrações de estado vazio no estilo cupom (traço único, 3–4 cenas: lista nova, compra finalizada, sem histórico, offline).
- Motion discreto: carimbo de "pego" (check com escala 0,9→1 em `--dur-fast`), item saindo ao finalizar, serrilha que "rasga" ao finalizar compra (≤ 400 ms, respeitando `prefers-reduced-motion`).
- Desktop: cabeçalho e coluna alinhados, depois layout em duas colunas (lista + painel de preços/histórico) aproveitando a largura.
- Acessibilidade por design: contraste e alvos checados no PR, alto contraste/tamanho de fonte do sistema, `forced-colors` para a serrilha e os tracejados (hoje decorativos), ícones sempre com rótulo.
- Telas de família (ver abaixo): unificar avatar, selo ("badge") e linha de membro em componentes.

### Famílias (leitura de código, sem captura)
[FATO por leitura] Mesmos desvios: alvos `.mini` 11 px/4 px de padding e `select` 11 px (`TelaGerenciarFamilia.svelte:114,120`), `.remover` 32 px (`:121`), selo 9,5 px (`:122`), nota 11,5 px (`:112`), avatar 28/32 px com iniciais 10–12 px (`:116`, `TelaFamilias.svelte:106`). O código de convite em mono 19 px com `letter-spacing: 3px` (`:111`) é um bom "carimbo". Papéis e remoção de membro são ações destrutivas ao lado de seletor sem separação visual: usar variante `perigo` e distância. Estados de erro de código inválido seguem o padrão problemático de P21.

## 10. Fora do meu papel
- Fluxos e heurísticas (decisão de modo "Reordenar" vs menu, entrada rápida fixa, desfazer em remover/finalizar, texto de microcopy, nome do produto): ux-research / product-manager.
- Implementação de `Botao`, `Icone`, tema, hospedagem de fontes, service worker, gestão de foco de modais, `aria-*`: frontend-engineer.
- Auditoria WCAG formal, nomes acessíveis dos emoji hoje existentes, teste em aparelho (iOS zoom, teclado virtual): qa-engineer.
- Métricas e gráficos de Preços/Insights (tipo de gráfico, definição de "ok/alto"): data-bi-engineer.
- Dado do artefato `18.9` na captura: Head.

## 11. Decisões que dependem do usuário
1. Botões de texto longo em Inter 600 em vez de mono (muda caráter, mantém fontes). Recomendado: sim para frases com mais de 2 palavras.
2. `--border-strong` novo (`#8A7F6C` / `#7D7464`) em vez de reutilizar `--ink-light` (sem cor nova). Recomendado: começar com `--ink-light`; a cor nova exige autorização.
3. Ícones SVG no lugar de emoji (muda aparência do cabeçalho; coerente com a identidade). Recomendado: sim.

## 12. Não verificado
- Razões de contraste calculadas à mão (sem ferramenta): reconferir com script ou DevTools; valores com `≈` dependem de mistura alfa ou de cor sugerida. Comando sugerido (Head): `python3 -c` com a fórmula WCAG sobre os hex de `app.css`, ou aba Acessibilidade do DevTools.
- Capturas só em Chromium headless; emoji em iOS/Android não vistos; telas de família, estado "arrastando", "atribuído", teclado virtual, notch e entrada rápida em celular real não foram capturados.
- Gráfico de Preços: se a variação alto/ok tem texto além da cor (`TelaPrecos.svelte:124-125`): checar o markup renderizado.
- Licença e nomes dos ícones Lucide (ISC) e versão: conferir no repositório oficial antes de adotar; tamanho em KB estimado.
- Zoom automático de inputs de 15 px no iOS (standalone e Safari): testar em aparelho.
- Ícones do app (`icon-192/512`) não inspecionados.
- Protótipo em 360 px e 1280 px não produzido; se desejado, criar em `prototypes/cupom-barra-ferramentas/` e conferir no navegador (`python3 -m http.server` na pasta e abrir com viewport 360 e 1280).
