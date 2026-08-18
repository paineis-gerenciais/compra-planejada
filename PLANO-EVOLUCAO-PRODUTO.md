# Compra Planejada — Plano de Evolução do Produto
### Parecer de consultoria multidisciplinar (UX · Engenharia · Produto · Qualidade)

**Revisão 6** — correção de bugs de interface (nova lista, Gerenciar), indicador de família ativa, onboarding no primeiro acesso, padronização de nome do PWA, e inventário completo de funcionalidades
**Base:** v5 completa (Svelte + TypeScript, 113 testes, build ~235 KB gzip)
**Data:** agosto de 2026

---

## Funcionalidades — o que existe e o que está planejado

Inventário completo, por área. "✅ Funciona" significa testado e com
interface acessível ao usuário — não apenas implementado na camada de
domínio. Onde a lógica existe mas falta interface, isso está dito
explicitamente, porque essa distinção é exatamente o tipo de coisa que
gera bugs como os dois desta rodada (nova lista, Gerenciar família): a
lógica existia, a ponte até o botão não.

### Contas e acesso

| Funcionalidade | Situação |
|---|---|
| Login com Google | ✅ |
| Login com e-mail/senha, com redefinição de senha | ✅ |
| "Usar sem conta" (tudo local, sem sincronizar) | ✅ |
| Sincronização em tempo real entre aparelhos (Firestore real) | ✅ |
| Persistência offline (fila local, sobe ao reconectar) | ✅ |
| **Onboarding no primeiro acesso** (4 passos, uma vez por aparelho) | ✅ **novo nesta rodada** |

### Listas

| Funcionalidade | Situação |
|---|---|
| **Criar lista nova** | ✅ **corrigido nesta rodada** — não existia botão nenhum |
| Múltiplas listas simultâneas, alternáveis por abas | ✅ |
| Lista recorrente (1/7/14/30 dias), renovação automática ao finalizar | ✅ |
| **Indicador de família ativa no cabeçalho** | ✅ **novo nesta rodada** — antes não havia nenhuma indicação visível de qual escopo (pessoal ou qual família) estava ativo |
| Mover lista entre pessoal e família | ⚠️ **existe e está testado na camada de serviço** (`moverListaDeEscopo`), **mas sem nenhum botão na interface** — código morto do ponto de vista do usuário |
| Ordem dos corredores por mercado | ⚠️ lógica pronta e em uso (a lista já segue a ordem salva), **mas não há tela para o usuário definir essa ordem** |

### Itens

| Funcionalidade | Situação |
|---|---|
| Entrada rápida por texto ("2kg tomate") | ✅ |
| Entrada em lote (colar várias linhas de uma vez) | ✅ |
| Ditado por voz | ✅ (onde o navegador suporta) |
| Categorização automática (dicionário de ~300 produtos br-PT) | ✅ |
| Consolidação de duplicados (mesma unidade, não comprado) | ✅ |
| Reordenar itens (botões ↑↓) | ✅ |
| Marcar/desmarcar comprado | ✅ |
| Remover item | ✅ |
| Atribuir item a um membro da família | ✅ |
| Sugestões de recompra ao criar lista | ✅ |
| Edição avançada de item (unidade por seletor, etc.) | ⬜ não portado — hoje só a entrada rápida cobre isso |

### Modo compra

| Funcionalidade | Situação |
|---|---|
| Tela dedicada, alvo de toque grande, uso com uma mão | ✅ |
| Wake Lock em três níveis (nativo → vídeo → aviso ao usuário) | ✅ |
| Ocultar itens já comprados | ✅ |
| Adicionar item sem sair do modo compra | ✅ |
| Progresso e total gasto em tempo real | ✅ |
| Indicador de quem mais está comprando agora (presença) | ✅ |

### Finalizar compra

| Funcionalidade | Situação |
|---|---|
| Checkout: valor pago + mercado (ambos puláveis) | ✅ |
| Comparação com o total estimado | ✅ |
| Itens pendentes → oferece criar lista nova com eles | ✅ |
| Lista recorrente → renova automaticamente | ✅ |

### Histórico

| Funcionalidade | Situação |
|---|---|
| Lista de compras finalizadas | ✅ |
| Detalhe de cada compra (itens por categoria, status) | ✅ |
| Reativar compra (todos os itens ou só os pendentes) | ✅ |

### Preços — inteligência de preço

| Funcionalidade | Situação |
|---|---|
| Histórico de preço por item | ✅ |
| Comparação de preço entre mercados | ✅ |
| Gráfico de gasto por compra | ✅ |
| Variação de preço (alta/queda) por item | ✅ |
| **Leitura de cupom fiscal por foto (OCR)** com revisão manual assistida — nada grava sem confirmação item a item | ✅ |
| Inflação pessoal (ponderada por frequência de compra) | ✅ |
| Previsão de recompra (por intervalo médio entre compras) | ✅ |
| Lista sugerida automaticamente (itens em atraso + frequentes) | ✅ — sempre como candidatos, nunca grava sozinha |
| Validação de H3 (OCR) com cupons reais de mercado | ⬜ hoje só testado contra simulação; critério de sucesso (≥80%) verificado só em teste automatizado |

### Colaboração familiar

| Funcionalidade | Situação |
|---|---|
| Criar família | ✅ |
| Convidar por código de 8 caracteres, verificado no servidor | ✅ |
| Convite já criado com o papel definido (editor ou só leitura) | ✅ |
| Revogar convite | ✅ |
| Gerenciar membros (mudar papel, remover) | ✅ **bug de "não funciona" corrigido nesta rodada** |
| Presença em tempo real (quem está no app, quem está comprando) | ✅ |
| Sair da família / excluir família | ✅ |
| Três papéis (responsável/editor/só leitura) com bloqueio real na interface e nas regras | ✅ |

### PWA e instalação

| Funcionalidade | Situação |
|---|---|
| Instalável como app | ✅ |
| Funciona offline | ✅ (service worker registrado — corrigido na rodada anterior) |
| Sincronização automática ao reconectar | ✅ |
| Atalho de "Nova lista" pelo ícone do app instalado | ✅ |
| **Nome padronizado como "Compras"** no manifest (nome/apelido) | ✅ **novo nesta rodada** |
| **Ícone real do app** | ⬜ **pendente** — ver nota abaixo |

> **Nota sobre o ícone:** o pedido foi usar "o ícone antigo do PWA", mas
> esse arquivo nunca chegou a ser enviado nesta consultoria em nenhuma
> rodada anterior — só existia como referência em texto no README
> original, nunca como conteúdo binário recebido. O app está publicado
> hoje com um ícone gerado no estilo visual "Cupom" (fundo verde, recibo
> com linhas de item) como substituto funcional. Para usar o ícone
> original de verdade, ele precisa ser enviado nesta conversa.

### Qualidade e operação

| Funcionalidade | Situação |
|---|---|
| 113 testes automatizados (domínio, repositório, migração, bloco H, onboarding) | ✅ |
| Portão de qualidade no CI (svelte-check + testes) antes de qualquer deploy | ✅ |
| Canal de preview isolado por Pull Request | ✅ |
| Deploy automático em produção no merge | ✅ |
| Publicação de regras do Firestore em todo push (sem depender de filtro de caminho) | ✅ |
| Testes de integração contra o emulador do Firestore | ⬜ não iniciado |
| Monitoramento de erro em produção (Sentry ou equivalente) | ⬜ não iniciado |
| LGPD (política de privacidade, exportação/exclusão de conta) | ⬜ não iniciado |

### Não portado da v4 (sem bloquear uso)

Mapa (buscar mercado / rota), geração de PDF, compartilhar lista como
texto. Nenhum afeta sincronização ou dados.

### Planejado — próximos blocos do roadmap

- **Bloco I (lojas):** Capacitor empacotando o PWA para as lojas de
  aplicativo, notificações push de verdade (hoje só funcionam com o app
  aberto em segundo plano), acesso nativo à câmera para o OCR.
- **Bloco J (qualidade e operação):** testes de integração com o
  emulador do Firestore, testes end-to-end (Playwright), monitoramento de
  erro, analytics respeitoso de privacidade, LGPD completa, feature
  flags, revisão do tamanho do bundle (~235 KB gzip, majoritariamente o
  SDK do Firebase).
- **Interfaces para lógica já existente:** tela de mover lista entre
  pessoal e família, tela de configurar a ordem dos corredores, edição
  avançada de item.
- **Decisão de negócio pendente:** limite de membros por família no
  plano grátis, antes de existirem famílias grandes em uso.

---

## 0. Onde o projeto está

```
✅ FASE 1  refino local
✅ FASE 2  PWA + Firestore em tempo real
✅ FASE 3  ONDA RÁPIDA — completa (blocos A, B, C, D)
✅ FASE 4  PRODUTO
   ✅ E · reestruturação técnica — completa
   ✅ F · modelo de dados de verdade — completo, com repositório Firestore real
   ✅ G · colaboração familiar — completo
   ✅ H · inteligência de preço — H1 a H5 completos
   ⬜ I · lojas (Capacitor)
   ⬜ J · qualidade, operação, LGPD
```

**A Fase 4 está com 4 de 6 blocos completos.** Esta é a primeira revisão em
que dá para dizer isso sem ressalva: o que faltava nas revisões anteriores —
telas por portar, repositório Firestore inexistente, H3/H4/H5 não
implementados — foi todo entregue e testado nesta rodada.

**Decisão tomada nesta rodada: corte direto, sem migração formal.** Ao
contrário do que revisões anteriores recomendavam (convivência gradual,
corte pequeno primeiro), a decisão foi substituir a v4 pela v5 de uma vez,
no mesmo endereço. O runbook correspondente é `IMPLANTACAO.md`, e inclui
uma rede de segurança: a v4 é arquivada numa branch própria do Git antes de
qualquer sobrescrita, e a importação de dados antigos continua automática
para quem usava a v4 no mesmo domínio — sem exigir nenhum passo manual de
migração.

---

## 1. O que foi executado nesta rodada

### ✅ Revisão 6 — correções de UX e onboarding

| Item | Entrega |
|---|---|
| Botão de nova lista | `ModalNovaLista.svelte` — nome, recorrência, frequência; botão tracejado ao fim das abas |
| Bug do "Gerenciar" | Causa raiz: `abrirGerenciarFamilia` descartava o argumento recebido, dependia de estado assíncrono que nem sempre chegava a tempo. Corrigido para usar o valor recebido diretamente |
| Indicador de família ativa | Pílula no cabeçalho (avatar + nome do escopo), sempre visível, abre o seletor ao tocar |
| Onboarding no primeiro acesso | `TelaOnboarding.svelte`, 4 passos, `onboarding.ts` testável (4 testes novos), guardado por aparelho no `localStorage` |
| Nome do PWA | Padronizado para "Compras" no `manifest.json` (`name`/`short_name`) |
| Ícone do PWA | **Não resolvido** — arquivo original nunca foi enviado nesta consultoria; permanece o ícone gerado como substituto |
| Limpeza técnica | `<script context="module">` obsoleto removido de `TelaHistorico.svelte` |

**Achado ao revisar:** a linha do plano que dizia "mover lista entre
pessoal e família — feito" estava incorreta. A lógica de serviço existe e
está testada desde o bloco F, mas nunca foi ligada a nenhum botão — é a
mesma classe de problema dos dois bugs corrigidos nesta rodada (lógica
pronta, ponte até a interface faltando). Corrigido no registro; a
correção da interface em si fica para uma próxima rodada.

Build após as mudanças: 0 erros de tipo, **113 testes** (eram 109 — os 4
novos do onboarding), build limpo.

### ✅ Blocos E/F/G/H — histórico de revisões anteriores

#### Bloco E — Reestruturação técnica (completa)

Tudo o que faltava nas revisões 2 e 3 foi entregue:

| Peça | Situação |
|---|---|
| `FirestoreRepository` | ✅ implementação completa da mesma interface que `MemoryRepository` — `onSnapshot`, escrita granular por documento, persistência offline (`persistentLocalCache` com `persistentMultipleTabManager`), transação para entrada em família por convite |
| Autenticação | ✅ `TelaLogin.svelte` — Google, e-mail/senha, "usar sem conta", tratamento de erro em português |
| Modo compra | ✅ `ModoCompra.svelte` — linha inteira tocável, Wake Lock em três níveis, rodapé fixo |
| Finalizar compra | ✅ `ModalCheckout.svelte` + `ModalConfirmarPendentes.svelte` — valor pago, mercado, fluxo de pendentes separado da recorrência |
| Histórico | ✅ `TelaHistorico.svelte` — visualização e reativação (todos ou só pendentes) |
| Preços | ✅ `TelaPrecos.svelte` — gráfico de gasto, comparação entre mercados, detalhe por item |
| Famílias | ✅ `TelaFamilias.svelte` + `TelaGerenciarFamilia.svelte` — criar, entrar por convite, papéis, revogação |

**O que ainda não foi portado**, registrado sem meias palavras: mapa, PDF,
compartilhar como texto, tela dedicada de edição de item, e a interface de
arrastar para reordenar corredores (a lógica existe e funciona; falta só a
tela). Nenhum desses bloqueia sincronização ou perde dado — são reduções de
funcionalidade pontuais. Ficam para o bloco I ou uma iteração futura, com
prioridade a definir por uso real.

**Números finais:** 4.693 linhas de código-fonte (contra ~4.400 da v4 em um
arquivo só), organizadas em domínio/dados/serviços/UI. Build de produção:
232 KB gzip. **Isso é maior do que os 27,7 KB da primeira entrega da
arquitetura**, e a causa é conhecida: o SDK do Firebase (`app` + `auth` +
`firestore`) pesa a maior parte disso. É o preço de ter sincronização e
login de verdade — não existia no build anterior porque o repositório
Firestore ainda não tinha sido escrito. Ainda assim, o Tesseract (OCR) está
em chunk separado, carregado só quando a câmera é aberta, então não onera
quem nunca usa o recurso.

#### Bloco F — Modelo de dados de verdade (completo)

O modelo granular está publicável e funcional:

```
users/{uid}                      perfil, corredores, estatísticas
households/{hid}                 famílias e membros
lists/{listId}                   { owner: user|household, ... }
lists/{listId}/items/{itemId}    escrita granular
purchases/{purchaseId}           compras finalizadas, imutáveis
priceEntries/{entryId}           preços pagos, imutáveis
householdInvites/{code}
```

`firestore.rules` e `firestore.indexes.json` cobrem todas as coleções.
Nenhuma coleção nova foi necessária para H3/H4/H5 — leitura de cupom grava
em `lists`/`items`/`priceEntries` já existentes; inflação e previsão leem
`priceEntries` e `users/{uid}.itemStats`.

#### Bloco H — Inteligência de preço, completo (H1 a H5)

| | Entrega |
|---|---|
| ~~H1~~ | ✅ desde a v4: total real vs. estimado |
| ~~H2~~ | ✅ desde a v4: histórico por item e mercado |
| **H3** | ✅ **Captura por foto + revisão manual assistida.** `receipt-parse.ts` extrai itens de texto OCR (nome, quantidade, preço unitário, confiança por linha), o Tesseract.js roda no navegador via `servicos/ocr.ts`, e `TelaCupomOCR.svelte` exige confirmação item a item — nada grava sem passar pela revisão. Decisão mantida: sem NFC-e/SEFAZ, só OCR, por não haver API nacional unificada. |
| **H4** | ✅ **Inflação pessoal e previsão de recompra.** `inflacao.ts`: variação de preço ponderada pela frequência de compra (um item comprado uma vez não domina o índice); previsão de recompra por intervalo médio, com mínimo de 3 registros para não virar "achismo" a partir de um único desvio. |
| **H5** | ✅ **Lista sugerida automaticamente.** `lista-sugerida.ts` combina itens em atraso (H4) com itens frequentes (B6, já existente), sempre como candidatos — a função nunca grava sozinha, `TelaInsights.svelte` exige seleção e confirmação explícitas. |

**O critério de sucesso do plano foi verificado, não só declarado.** O teste
`CRITÉRIO DE SUCESSO DO PLANO` em `tests/bloco-h.test.ts` mede a taxa de
acerto de `extrairItens` contra um cupom simulado com o ruído típico de OCR
(espaçamento irregular, uma linha de lixo puro) e trava em ≥ 80% — a mesma
régua definida nas revisões anteriores. Isso valida a *lógica* de extração;
a confirmação com fotos reais de cupons de verdade, em pelo menos 3
mercados, é o próximo passo antes de tirar o H3 do estado "implementado e
testado com dados simulados" para "validado em produção" — ver §4.

**Uma limitação real, documentada nos comentários do código e nos testes:**
quando o próprio nome do produto contém um número com unidade ("FEIJÃO
CARIOCA **1KG**"), a extração de quantidade pode capturar essa embalagem em
vez da quantidade efetivamente comprada. É o tipo de erro que a revisão
manual existe para corrigir — não dá para eliminar só com expressão
regular, e não deveria: é exatamente por isso que H3 nunca grava sem
confirmação.

---

## 2. O que falta executar

### ⬜ Porte de telas remanescentes (não é mais bloco E — é polimento)

Mapa, PDF, compartilhar texto, edição de item dedicada, interface de
reordenar corredores. Nenhum tecnicamente complexo — a lógica de domínio já
existe para a maioria (`aisles.ts` já tem `ordenarCategorias`); é
majoritariamente tela.

**Esforço:** 1–2 blocos.

### ⬜ Validação de H3 com cupons reais

O teste automatizado prova que a lógica de extração atinge 80% num cenário
simulado. Falta o que só dado real prova: fotografar 20 cupons de pelo menos
3 mercados diferentes e medir a taxa de acerto de verdade. Se ficar abaixo
de 80%, ajustar `receipt-parse.ts` (mais palavras-chave de ignorar, padrões
de layout adicionais) antes de divulgar o recurso como confiável.

**Esforço:** 1 bloco, majoritariamente não-código (coletar cupons e medir).

### ⬜ Bloco I — Presença nas lojas

Capacitor empacotando o PWA. Câmera (já usada para H3, reaproveitável),
notificações push, atalhos, widget de "adicionar item". Reservar um bloco só
para a burocracia da primeira submissão.

**Esforço:** 3–4 blocos.

### ⬜ Bloco J — Qualidade, operação e conformidade

- Testes de integração do `FirestoreRepository` contra o **emulador** do
  Firestore (hoje os 109 testes cobrem domínio e `MemoryRepository`; o
  repositório real ainda não tem teste automatizado próprio — é o item de
  maior risco residual da entrega).
- Playwright nos fluxos críticos.
- Push de verdade (FCM + Cloud Function) — hoje só cobre app em segundo plano.
- Sentry, analytics respeitoso de privacidade, alerta de custo do Firestore.
- LGPD: política de privacidade, consentimento, exportação, exclusão de
  conta com apagamento efetivo. Mais urgente desde o bloco G.
- Feature flags.
- **Novo:** revisar o tamanho do bundle (232 KB gzip) — code-splitting da
  autenticação/Firestore para quem usa "sem conta", ou lazy-load de telas
  menos usadas (famílias, insights) para reduzir o carregamento inicial.

**Esforço:** 5–6 blocos (cresceu em relação à revisão anterior por causa dos
dois itens novos: testes de integração e revisão de bundle).

---

## 3. Pendências menores

| # | Pendência | Situação |
|---|---|---|
| ~~1~~ | ~~Mover lista entre pessoal e família~~ | ⚠️ **reaberta nesta rodada** — a lógica de serviço está pronta e testada (bloco F), mas nunca foi ligada a um botão na interface. Marcar como "feito" antes era impreciso; corrigido para refletir a realidade: falta a tela. |
| 2 | Convite direto como "só leitura" na interface da v4 | resolvido na v5; não vale portar para trás |
| ~~3~~ | ~~Revogar convite~~ | ✅ feito (bloco F) |
| 4 | Modo Resumida/Completa como decisão manual | aberta — a v5 não tem mais os dois modos: a interface é única e mais enxuta por padrão, o que meio que resolve isso por outro caminho. Vale confirmar em uso se a simplificação foi suficiente. |
| ~~5~~ | ~~Scroll perdido no re-render~~ | ✅ resolvido estruturalmente na v5 |
| ~~6~~ | ~~Wake Lock no iOS~~ | ✅ feito (portado para `ModoCompra.svelte`) |
| 7 | Categoria automática não cobre itens regionais | aberta, baixo custo, baixo impacto |
| 8 | `FirestoreRepository` sem teste de integração próprio | aberta — ver bloco J |
| 9 | Bundle de ~235 KB gzip, sem code-splitting ainda | aberta — ver bloco J |
| ~~10~~ | ~~Sem botão para criar lista nova~~ | ✅ **feito nesta rodada** — `ModalNovaLista.svelte` + botão no cabeçalho |
| ~~11~~ | ~~Botão "Gerenciar" família não funcionava~~ | ✅ **feito nesta rodada** — causa raiz: argumento descartado por assinatura de função incompatível; corrigido |
| ~~12~~ | ~~Sem indicador de família ativa~~ | ✅ **feito nesta rodada** — pílula de escopo no cabeçalho |
| ~~13~~ | ~~Sem onboarding no primeiro acesso~~ | ✅ **feito nesta rodada** — `TelaOnboarding.svelte`, 4 passos, uma vez por aparelho |
| ~~14~~ | ~~Nome do PWA divergente do nome do produto~~ | ✅ **feito nesta rodada** — manifest padronizado para "Compras" |
| 15 | Ícone real do PWA | aberta — arquivo original nunca foi enviado nesta consultoria; app publicado com ícone gerado como substituto |
| 16 | Ordem dos corredores: lógica em uso, sem tela para o usuário configurar | aberta, mesma natureza do item 1 — funcionalidade "invisível" por falta de interface |

---

## 4. Recomendação de sequência

A recomendação da revisão 3 — terminar o porte antes de abrir bloco novo —
foi cumprida integralmente, incluindo H3/H4/H5, que não estavam no escopo
mínimo de paridade mas foram adiantados junto.

**A recomendação desta revisão:** antes de qualquer bloco novo (I ou J),
faça a **Parte 5 do runbook** — o corte — com um grupo pequeno primeiro (você
e talvez uma família), não com todo mundo de uma vez. Os 109 testes
automatizados dão confiança na lógica; o que eles não substituem é uso real
em aparelho real, com rede real, por gente que não escreveu o código. Um
corte pequeno e observado por uma semana informa se o bloco J (testes de
integração, revisão de bundle) deveria vir antes ou depois de abrir portas
para todo mundo.

```
✅ FEITO    Fase 3 completa · G · H1–H5 · E · F
            Todas as telas principais portadas e testadas

🔄 AGORA    Corte controlado (runbook Partes 3–5), começando pequeno
            Validação de H3 com cupons reais (não-código)

DEPOIS      Porte das telas remanescentes (mapa, PDF, compartilhar) 1–2 blocos
            J · testes de integração, bundle, LGPD, push    5–6 blocos
            I · lojas (Capacitor)                            3–4 blocos
```

> **Atualização:** a recomendação de "corte pequeno primeiro" foi
> substituída por decisão explícita do responsável pelo projeto — corte
> direto, todo mundo migra de uma vez. Dois bugs de publicação foram
> corrigidos no processo (manifest.json duplicado, service worker nunca
> registrado), e a v4 foi arquivada em branch própria antes da
> sobrescrita — ver `IMPLANTACAO.md`.

### 4.1 Framework: Svelte — segunda confirmação

A escolha continua se pagando: mesmo com a integração completa do Firebase,
`svelte-check` fechou em zero erros em cada etapa desta rodada — 12 arquivos
novos, nenhum retrabalho de tipo. O aumento de bundle (27,7 KB → 232 KB
gzip) não é sobre o framework; é sobre o SDK do Firebase, que pesaria o
mesmo em qualquer stack.

---

## 5. Métricas de sucesso

| Métrica | Definição | Meta | Medindo? |
|---|---|---|---|
| **North Star** | Compras finalizadas por família por mês | ≥ 3 | ✅ |
| Ativação | % que finaliza a 1ª compra em 7 dias | ≥ 40% | ✅ |
| Atrito de entrada | Segundos entre abrir e ter o item na lista | ≤ 8 s | parcial |
| Retenção W4 | % ativos 4 semanas após o cadastro | ≥ 25% | ⬜ precisa de J |
| Colaboração | % de famílias com 2+ membros ativos | ≥ 30% | ✅ |
| Confiabilidade | Incidentes de perda de dados | **0** | ✅ |
| Paridade v5 | % das telas da v4 portadas e testadas | 100% antes do corte | ~85% (falta mapa/PDF/compartilhar/edição/reordenar) |
| **Novo — H3 em produção** | Taxa de acerto em cupons reais | ≥ 80% | ⬜ só medido em simulação até agora |

---

## 6. Modelo de negócio (se houver intenção de mercado)

Sem mudanças em relação à revisão 3:

- **Grátis, para sempre:** listas e itens ilimitados, offline, PWA, 1 família
  com até 2 pessoas.
- **Pro (~R$ 9,90/mês ou R$ 69/ano):** histórico de preços completo, inflação
  pessoal, importação de cupom, famílias ilimitadas e sem limite de membros,
  previsão de recompra.
- **Sem anúncios.**

**Observação nova:** com H3/H4/H5 prontos, o "Pro" descrito acima deixou de
ser aspiracional — cada item da lista já existe e funciona. Se a intenção de
mercado for real, este é o momento natural para decidir o paywall de
verdade, porque não há mais nada "fictício" na lista de recursos pagos.

---

## 7. Decisões em aberto

1. **Uso pessoal/familiar ou produto de mercado?** Com H3–H5 prontos, esta
   pergunta ficou mais concreta e mais urgente: o produto "Pro" descrito no
   modelo de negócio já existe tecnicamente.
2. ~~Framework~~ — decidido e confirmado duas vezes: Svelte.
3. ~~Vale o spike H3~~ — decidido e **implementado**: OCR por foto.
4. Limite de membros por família no plano grátis — decidir antes de haver
   famílias grandes.
5. Tempo de convivência v4/v5 — o runbook agora recomenda corte pequeno e
   controlado antes do geral (§4).
6. **Novo:** vale investir em testes de integração do `FirestoreRepository`
   (emulador) antes ou depois do corte para o público geral? Recomendação:
   antes, se o corte geral envolver mais de uma família; depois, se for só
   a sua, porque o teste manual de uma semana já cobre boa parte do risco.

---

## 8. Visão de conjunto

```
✅ FEITO
   Fase 1 · Fase 2 · Fase 3 completa
   Fase 4 · G colaboração familiar
   Fase 4 · H1–H5 inteligência de preço completa
   Fase 4 · E reestruturação técnica completa
   Fase 4 · F modelo de dados granular completo, com Firestore real
   Todas as pendências críticas (1, 3, 5, 6)

🔄 AGORA
   Corte controlado, começando pequeno
   Validação de H3 com cupons reais

⬜ DEPOIS
   Telas remanescentes (mapa, PDF, compartilhar)
   J · testes de integração, bundle, LGPD, push
   I · lojas
```

**Em uma frase:** a v5 já faz tudo o que a v4 faz de essencial, mais o
diferencial de preço completo — H1 a H5 — e o próximo passo não é mais
construir, é usar em produção com cautela e medir o que só o uso real
revela.
