# Diagnóstico Prumo: Compra Planejada v5.0.0

- **Data:** 2026-11-09 · **Consultoria:** Prumo (Head + 9 especialistas) · **Base analisada:** branch `claude/affectionate-babbage-oa5b5c`, HEAD `ee416f5` (igual a `main`)
- **Pedido:** apontar pontos fortes e fracos do projeto e propor melhorias e evolução nos eixos técnico (código), usuário (experiência e design) e utilidade, impacto e potencial.
- **Pareceres por área** (detalhe e evidências): [arquitetura](arquitetura/diagnostico-2026-11.md) · [front-end e PWA](frontend/diagnostico-2026-11.md) · [segurança, LGPD e operação](seguranca/parecer-2026-11.md) · [qualidade e testes](qa/parecer-2026-11.md) · [indicadores de preço](dados/diagnostico-indicadores-2026-11.md) · [UX](ux/diagnostico-2026-11.md) · [design](design/diagnostico-2026-11.md) · [produto](produto/diagnostico-2026-11.md) · [negócio](negocio/diagnostico-2026-11.md)
- **Capturas de tela** citadas nos pareceres: [`docs/capturas/2026-11/`](capturas/2026-11/LEIA-ME.md).
- Rótulos: **[FATO]** verificado nesta sessão (comando, captura ou `arquivo:linha`); **[HIPÓTESE]** a confirmar; **[RECOMENDAÇÃO]** opinião fundamentada. Severidade conforme a constituição da Prumo: Bloqueador · Alto · Médio · Baixo.

## 1. Resumo executivo

1. **A base técnica é boa e rara em projeto desse porte:** domínio puro e testado (132 testes em 0,7 s), interface `Repository` com duas implementações, modelo de dados granular com dono discriminado, regras do Firestore que negam tudo por padrão, identidade visual própria e coerente com o domínio. [FATO]
2. **O produto não está tão pronto quanto o próprio plano afirma.** Encontramos 1 defeito Bloqueador (o modo "Usar sem conta" congela a interface em produção), 2 falhas de integridade nas regras do Firestore (um membro "só leitura" consegue sumir com a família de todos), 3 funcionalidades marcadas como prontas que não funcionam (estatísticas de uso nunca gravadas, presença nunca enviada, perfil nunca criado para contas novas) e 3 defeitos de dados que corrompem o histórico de preços (valor com ponto de milhar lido errado, preço antigo gravado como "pago", unidades kg/g/un misturadas). [FATO]
3. **O padrão por trás dos defeitos é um só:** a lógica é testada em memória, mas nada testa o caminho real (Firestore com regras, componentes Svelte montados, jornadas no navegador). O plano já tinha diagnosticado isso na revisão 8; o diagnóstico continua certo e a correção ainda não começou.
4. **A experiência tem identidade forte, mas pede simplificação e correções:** preço digitado vira quantidade sem aviso; o fim da compra não confirma nada; 13 modais, 4 ícones de emoji sem rótulo, 5 controles por linha de item, alvos de toque de 26–36 px, fontes de 9–12,5 px, contraste insuficiente em bordas e no tema escuro, modais sem gestão de foco e nenhum aviso ao usuário quando a sincronização falha.
5. **Utilidade e potencial:** o valor imediato está no núcleo (anotar, comprar em família, finalizar). A camada de "inteligência de preço", que é o diferencial pretendido e a base do plano Pro, hoje não tem validade estatística nem validação com cupons reais. O freemium de R$ 9,90/mês não fecha as contas com o custo de leitura atual. [HIPÓTESE fundamentada no parecer de negócio]
6. **Recomendação:** congelar funcionalidades novas por 4 semanas e fazer uma rodada de estabilização (defeitos Bloqueador e Altos, testes contra o emulador do Firestore, medição mínima); depois decidir "uso pessoal × piloto de nicho" com dados, e só então investir em lojas, push ou cobrança.

## 2. Como foi feito e o que não foi verificado

**Método.** O Head rodou tipos, testes com cobertura e build; serviu a build de produção local e percorreu as jornadas com navegador automatizado (41 capturas em 390 px e 1280 px); nove especialistas analisaram o código e a documentação em paralelo, cada um no seu papel; o Head conferiu no código os achados de maior severidade antes de consolidar.

| Verificação | Comando | Resultado [FATO] |
|---|---|---|
| Tipos | `npm run check` | 0 erros, 10 avisos |
| Testes e cobertura | `npx vitest run --coverage` | 5 arquivos, 132 testes passando em 0,7 s; cobertura 83,6% (statements), 68,2% (branches); `FirestoreRepository.ts` fora do relatório (nenhum teste o importa) |
| Build | `npm run build` | ok em 1,5 s; chunk principal 787,8 kB (237,7 kB gzip); jsPDF 129,7 kB gzip em chunk separado; sourcemaps publicados |
| Dependências | `npm audit --omit=dev` | 6 vulnerabilidades (5 altas, 1 crítica), todas transitivas e não exploráveis no uso atual (ver parecer de segurança) |
| Modo sem conta | Playwright sobre `vite preview` | `pageerror: effect_update_depth_exceeded` ao clicar em "Usar sem conta"; interface congela (ver §4, B1) |
| Offline | Playwright, `setOffline(true)` após primeira visita | recarga e nova aba falham com `net::ERR_FAILED`; cache do service worker vazio (ver §4, A-FE1) |

**Não verificado (exige console do Firebase, aparelho real ou usuários):** regras realmente publicadas em produção e papel IAM da conta de serviço do CI; plano de cobrança (Spark ou Blaze), região, backup e alertas de custo; volume real de leituras; comportamento em iOS Safari (arrastar, Wake Lock, login por redirecionamento); OCR com fotos reais de cupom; qualquer dado de uso ou opinião de usuário. A rede desta sessão bloqueou `firebase.google.com`, então preços e cotas oficiais do Firebase ficaram como hipótese no parecer de negócio.

## 3. Pontos fortes

- **Arquitetura em camadas que funciona na maior parte do código.** `domain/` não conhece DOM nem rede; componentes recebem props e callbacks; o mesmo app roda em memória ou no Firestore trocando uma classe. [FATO: `src/lib/domain/*`, `repository.ts:89-98`]
- **Modelo de dados pensado para colaboração.** Dono discriminado (`user` ou `household`) aplicado de forma uniforme nas regras; mover lista entre pessoal e família é uma escrita, conferida nos dois lados; compras e preços imutáveis. [FATO: `firestore.rules:35-46, 62-63, 80, 91`]
- **Postura conservadora com dado financeiro.** OCR nunca grava sem revisão item a item; lista sugerida só propõe; previsão exige 3 registros. [FATO: `ocr.ts`, `TelaCupomOCR.svelte`, `inflacao.ts:87-91`]
- **Qualidade de código acima da média.** TypeScript estrito sem erros, runes do Svelte 5 bem usadas, props tipadas, assinaturas centralizadas sem vazamento aparente, bibliotecas pesadas (OCR, PDF) carregadas sob demanda, acessibilidade de base (`label`, `aria-label` em ícones de item, `focus-visible`, movimento reduzido, área segura). [FATO: parecer de front-end]
- **Operação com portão de qualidade.** CI roda tipos, testes e build antes de qualquer publicação; preview por PR; `npm ci` com lockfile; nenhum segredo no histórico. [FATO: `deploy.yml`; `git log -p` sem chaves]
- **Identidade visual memorável.** A metáfora de cupom fiscal (papel kraft, serrilha, mono para números) diferencia o produto dos concorrentes "brancos com azul" e está sistematizada em tokens, inclusive tema escuro. [FATO: `src/app.css`; capturas `mobile-04`]
- **Diferenciais de produto reais, ainda não validados:** inflação pessoal ponderada, previsão de recompra, lista sugerida, sem anúncios. Nenhum dos concorrentes pesquisados destaca os dois primeiros. [FATO: parecer de negócio, fontes de 2026-11-09]

## 4. Pontos fracos por severidade

Os identificadores remetem ao parecer de origem (ARQ arquitetura · FE front-end · SEG segurança · DAD dados · QA qualidade · UX · DES design · PRO produto · NEG negócio).

### Bloqueador

| ID | Achado | Evidência | Correção proposta |
|---|---|---|---|
| **B1 (FE)** | O modo "Usar sem conta" congela a interface na build de produção: laço infinito de reatividade (`effect_update_depth_exceeded`). O onboarding não avança e nada mais responde. O modo fica inutilizável. | [FATO] Reproduzido pelo Head com Playwright em `vite preview`. Causa: `src/lib/stores/app.svelte.ts:81-83` lê `this.itens` dentro do callback de `watchItems`; `MemoryRepository` chama o callback de forma síncrona (`MemoryRepository.ts:24-27`) dentro do `$effect` de `src/App.svelte:181-185`; a leitura vira dependência e a escrita seguinte reexecuta o efeito. Com Firestore o callback é assíncrono, por isso o modo com conta não falha. | Envolver a leitura em `untrack(() => this.itens)` (ou envolver `app.conectarItens` no `$effect`). O Head confirmou numa cópia de trabalho que a correção de uma linha resolve. Entrar com teste de regressão (componente ou E2E), porque nenhum dos 132 testes monta componente. |

### Alto

| ID | Achado | Evidência | Correção proposta |
|---|---|---|---|
| **A-SEG1** | Qualquer membro da família, até "só leitura", pode reescrever `memberUids` ao sair e fazer a família sumir do painel de todos os membros (os dados ficam inacessíveis pela interface). | [FATO] `firestore.rules:120-125` restringe `members` ao próprio uid, mas não impõe nada sobre o valor de `memberUids`. | Exigir `memberUids` igual ao anterior menos o próprio uid; teste de regra no emulador. |
| **A-SEG2** | `memberUids` pode ficar fora de sincronia com `members` em três caminhos (ingresso, criação, atualização pelo responsável). Qualquer conta pode pôr o uid de outra pessoa em `memberUids` ou forçar filiação com nome e papel inventados. [HIPÓTESE] A consulta de famílias da vítima passa a ser negada inteira. | [FATO] `firestore.rules:112, 129-135, 137` (sem invariante `memberUids == keys(members)`). Hipótese do efeito exige emulador. | Invariante `memberUids.toSet() == members.keys().toSet()` em criação e atualização; limitar `affectedKeys` do responsável; manter ao menos um `owner`. |
| **A-SEG3** | Ninguém confirmou que as regras publicadas em produção são as do repositório. O plano registra que o CI falhava com 403 e que houve publicação manual; a pendência de conferência segue aberta. | [HIPÓTESE] `PLANO-EVOLUCAO-PRODUTO.md:221-231, 449`. Se a produção estiver em modo de teste, vira Bloqueador. | Comparar o ruleset ativo no console com `firestore.rules` e registrar a evidência com data. |
| **A-SEG4** | O CI usa chave JSON de conta de serviço de longa duração, entregue a actions em tag flutuante e a `firebase-tools` sem versão; o plano sugere o papel amplo `firebase.admin`. | [FATO] `deploy.yml:72-75, 92-95, 116-119`; `firestore-rules.yml`; `PLANO:244`. | Papéis mínimos, pin por SHA, versão fixa, Workload Identity Federation ou rotação da chave. IAM e secrets são linha vermelha: só com autorização do usuário. |
| **A-SEG5** | Nenhum teste cobre `firestore.rules` nem `FirestoreRepository`, e as regras são publicadas a cada push em `main`. A-SEG1 e A-SEG2 passariam despercebidos. | [FATO] `grep` em `tests/` sem referência; cobertura sem `FirestoreRepository.ts`. | Suíte `@firebase/rules-unit-testing` + emulador no CI, antes do job que publica regras. |
| **A-ARQ1** | O modo sem conta não persiste nada: o gancho `aoMudar` existe, mas nada o liga ao `localStorage`. Tudo se perde ao recarregar, embora a tela prometa "as listas ficam só neste navegador". | [FATO] `MemoryRepository.ts:6, 63` (comentário promete persistência; gancho vazio); `TelaLogin.svelte:89`. | Ligar `aoMudar` a `localStorage`/IndexedDB e hidratar no construtor, ou remover o modo e o texto. Decisão de produto. |
| **A-ARQ2** | O perfil `users/{uid}` só é criado pela migração v4. Para contas novas, `updateProfile` usa `updateDoc` e falha: salvar a ordem dos corredores dá erro e o registro de lojas falha em silêncio. | [FATO] único `saveProfile` em `migration.ts:225`; `App.svelte:249, 319, 460` (dois `.catch(() => {})`). | Criar o perfil no primeiro login ou usar `setDoc(..., { merge: true })`. Teste no emulador. |
| **A-ARQ3 / A-DAD1** | `atualizarEstatisticas` nunca é chamada: `itemStats` só existe para quem migrou da v4. Sem dados novos ficam a autocompletação, os "frequentes" da lista sugerida e as sugestões de recompra, marcados como prontos no plano. | [FATO] `listas.ts:182` sem chamador; consumidores em `App.svelte:534, 614`, `lista-sugerida.ts:29, 53`. | Atualizar no mesmo lote de `finalizarCompra`, ou derivar a frequência de `purchases`. |
| **A-DAD2** | Valor com ponto de milhar é lido errado: "1.234,56" vira R$ 1,23 no checkout, na edição de item e no OCR. A compra é imutável, então o erro fica. | [FATO] `ModalCheckout.svelte:23, 32` (`parseFloat(valor.replace(',', '.'))`); `ModalEditarItem.svelte:27`; `TelaCupomOCR.svelte:69`. | Um `parseValorBR()` único no domínio, com teste; aviso quando o total divergir muito da soma dos itens. |
| **A-DAD3** | Preço antigo é copiado para listas novas (recorrência, reativar compra, lista sugerida) e, ao finalizar, gravado como "preço pago" com data nova. Achata a inflação pessoal e falseia "menor preço" e comparação entre lojas. | [FATO] `recurrence.ts:44-47` copia `price`; `prices.ts:90-99` grava qualquer `price > 0` de item comprado. | Separar "preço de referência" (exibido) de "preço confirmado" (gravado). |
| **A-DAD4** | A chave do item ignora a unidade e não converte: "tomate" em kg, g e un colide no histórico; "tomate" e "tomates" são itens distintos. | [FATO] `prices.ts:93` (`normalizeName` só); `parse.ts:11-23, 80-89`. | `unidadeBase` e preço por unidade-base na `PriceEntry`; comparar só dentro da mesma base; singularização simples. |
| **A-DAD5** | "Inflação pessoal" sem validade estatística: peso por contagem (não por gasto), média aritmética de relativos, sem separar loja nem promoção, sem n mínimo. Em simulação com inflação real zero, o índice oscila ±3 pp (4 compras/mês) a ±7 pp (2 compras/mês). | [FATO] fórmula em `inflacao.ts:30-56`; [HIPÓTESE] magnitude da simulação (parâmetros do analista). | Rotular como "variação dos seus preços" até existir um índice v2 (mediana por item e loja, peso por gasto, n mínimo, aviso de amostra). Não vender como índice. |
| **A-DAD6** | O "critério ≥ 80%" do OCR mede só recall de nome por substring em 4 itens fictícios; não mede quantidade nem preço. O plano o descreve como "verificado". | [FATO] `receipt-parse.ts:142-153`; `tests/bloco-h.test.ts`. | Protocolo com 30 cupons reais de 5 layouts, métrica por campo, fixtures anonimizadas (parecer de dados, §5). Rebaixar o texto do plano. |
| **A-FE1** | O PWA não abre offline em partida a frio: `index.html` nunca entra no cache do service worker e não há pré-cache na instalação. README e plano afirmam "funciona offline". | [FATO] `public/sw.js:12, 35-38`; teste do Head: após a primeira visita, recarga offline falha com `net::ERR_FAILED` e o cache está vazio. | `vite-plugin-pwa` (Workbox) com pré-cache do shell e aviso de atualização. |
| **A-FE2** | Firebase Auth + Firestore são ~78% da fonte do chunk inicial (238 kB gzip) e carregam antes do login, inclusive no modo sem conta. Lighthouse local: 641 KiB de JS não usado na tela de login. | [FATO] composição por sourcemap; `App.svelte:9-12` imports estáticos. | Carregar Firestore sob demanda após a sessão; meta de ≤ 120 kB gzip no fluxo de login. |
| **A-PRO1** | Nenhuma medição de uso existe, mas o plano marca "Medindo ✅" para North Star, ativação e colaboração. | [FATO] `grep` por analytics/contadores em `src/` sem resultado; `PLANO §5`. | Corrigir o plano agora; medir a partir dos dados que o app já grava (parecer de dados, §6). |
| **A-PRO2** | O onboarding promete "avisa quando algo está na hora de recomprar", mas não existe notificação nem lembrete. | [FATO] `TelaOnboarding.svelte:32`; `grep Notification src` vazio. | Entregar lembrete simples ao abrir o app ou trocar o texto. |
| **A-UX1** | Preço digitado no fim da entrada rápida vira quantidade ("frango 1,2kg 18,90" → "Frango 1,2kg", qtd 18,9); nome fica com o peso; sem aviso. Corrompe quantidade e total estimado. | [FATO] capturas `mobile-04`, `mobile-06`; `parse.ts:80-89`. | Reconhecer "R$" ou número com 2 casas no fim como preço; mostrar na prévia; pedir confirmação quando o número final for ambíguo. |
| **A-UX2** | Pós-compra sem saída: "Nenhuma lista ainda." sem confirmação, resumo, desfazer nem chamada de ação. | [FATO] `mobile-10`; `App.svelte:546-547`. | Aviso de sucesso com desfazer e "ver histórico"; criar lista vazia ou mostrar "Começar nova lista". |
| **A-DES1** | Ergonomia abaixo do próprio padrão do projeto: alvos de 26–36 px (token `--tap` é 44), setas ▲▼ abaixo até do mínimo WCAG de 24 px, ~78 tamanhos de fonte soltos (15 abaixo de 11 px), emoji como ícones de ação sem rótulo e fora da paleta. | [FATO] `App.svelte:628-666`; `ItemLinha.svelte:90-139`; parecer de design §7. | Barra de ferramentas com SVG + rótulo e alvo 44 px; escala tipográfica em tokens com piso de 12/13 px. |
| **A-DES2** | Contraste insuficiente em controles e no tema escuro: borda sobre cartão 1,46:1 (claro) e 1,28:1 (escuro); branco sobre verde 3,08:1 no escuro; âmbar sobre papel 3,78:1. | [FATO] parecer de design §4; recalculado pelo Head em script com a fórmula WCAG (mesmos valores). | Tokens `--border-strong`, `--on-green`; avisos com texto `--ink`; só expor o tema escuro depois de corrigir. |
| **A-NEG1** | Custo de leitura sem teto: o app assina todo o histórico de compras e preços do dono. Em 12 meses, ~104 mil leituras por família por mês; com 1.000 famílias, R$ 340–510 por mês de infraestrutura "como está" contra ~R$ 237 de receita líquida a 4% de conversão. | [FATO] `FirestoreRepository.ts:160-198` sem `limit`; [HIPÓTESE] preços do Firestore (página oficial bloqueada). | Janela de leitura (90–180 dias), agregados mensais, alerta de orçamento antes de qualquer usuário externo. |

### Médio e Baixo (síntese; detalhe nos pareceres)

- **Código e arquitetura (ARQ F4–F18):** `App.svelte` concentra ~35 handlers, 13 modais e 14 chamadas diretas ao repositório, contrariando a regra de camadas; `finalizarCompra` faz 5 escritas sem lote (toque duplo duplica compra e preços); listas apagadas continuam sendo lidas; índices não correspondem às consultas; erros de assinatura só no console; estado não é limpo ao trocar de conta; `merge.ts` ("marcar vence desmarcar") só roda nos testes; excluir família deixa listas, compras e preços órfãos; código de migração v4 no bundle; nenhum ADR registrado.
- **Front-end (FE):** modais sem foco, trap nem trava de scroll; atalho `?acao=nova-lista` do manifest sem tratador; Wake Lock não readquirido ao voltar à aba; fontes do Google bloqueiam renderização e não funcionam offline; OCR baixa worker e WASM de CDN de terceiros sem SRI; tema escuro sem alternador; `role="tab"` sem teclado; 24 ocorrências de fonte 9–11 px; sem breakpoints; `orientation: portrait` trava tablet; README desatualizado.
- **Segurança e operação (SEG S-06 a S-24):** sem validação de esquema nem autoria nas regras; sem App Check nem limite de taxa; convite reutilizável até 1 ano; responsável pode sair deixando família sem dono; editor pode apagar fisicamente; sem CSP e cabeçalhos de segurança; logout não limpa o cache local do Firestore; sem verificação de e-mail; dois caminhos publicam regras sem `concurrency`; previews rodam contra o Firestore de produção; sem monitoramento, backup ou alerta de custo; `Math.random` no código de convite. **LGPD:** dados pessoais e de consumo em produção sem aviso de privacidade, exclusão de conta, exportação ou retenção definida.
- **Dados (DAD M1–M8):** previsão de recompra sensível a outliers (média dos extremos); itens abandonados dominam a lista sugerida para sempre; estimado × pago soma itens não comprados; comparação de lojas em texto livre e com n=1; `source: 'ocr'` nunca gravado; data do cupom extraída e descartada.
- **Produto (PRO P4–P13):** entrada rápida sem autocompletar; 4 ações secundárias fixas disputando com as 2 principais; nome inconsistente ("Compra Planejada" × "Compras"); sem busca nem orçamento; plano escrito como ata de revisões, não como roadmap.
- **UX e design (UX 3–30, DES P7–P21):** ver §5.2. Dois pontos que os pareceres deixaram como "não verificado" e o Head conferiu no código: remover item não pede confirmação nem oferece desfazer (`ItemLinha.svelte:76` chama `onRemover` direto; `App.svelte:208` apaga na hora) e "Sair da família" / "Excluir família" também não pedem confirmação (`TelaGerenciarFamilia.svelte:100` chama `onSair` direto), o que, somado ao achado S-09 (dados órfãos ao excluir), é um risco de perda de acesso a dados em um toque. [FATO]
- **QA:** ver §5.4 e o parecer de qualidade.

## 5. Três olhares

### 5.1 Técnico (código)

O que está bom: separação domínio/dados/serviços/interface, tipagem estrita, testes rápidos, repositório trocável, imutabilidade onde importa, lazy loading do que é pesado. O que falta é **a ponte entre a lógica testada e o mundo real**: nenhum teste monta componente, nenhum toca o Firestore com regras, nenhum percorre uma jornada no navegador. É exatamente por isso que B1, A-ARQ2, A-ARQ3 e as falhas das regras existem sem que a suíte acuse. A segunda frente é **custo e escala**: leitura sem teto e `get()` por escrita nas regras são aceitáveis para uma família e inviáveis para um produto. A terceira é **a casca** (`App.svelte`), que virou o lugar onde as camadas se misturam.

### 5.2 Usuário (experiência e design)

**O que funciona.** O ciclo central (adicionar, marcar, finalizar) é curto; a prévia ao vivo da interpretação ("→ 2 kg Tomate · Hortifruti") dá visibilidade; o modo compra tem linha inteira tocável, fonte maior e rodapé fixo com progresso; o agrupamento por corredor é natural; há alternativa a arrastar; os estados vazios de Preços e Insights dizem o que fazer; o item marcado usa três sinais (caixa, risco e cor), sem depender só de cor; o contraste de texto do tema claro passa (tinta sobre papel 12,4:1; cinza sobre papel 5,1:1; branco sobre verde 6,2:1). [FATO: capturas `mobile-03/04/07/12`; cálculo no parecer de design]

**Fricções de maior impacto (Alto).**
- **A entrada rápida erra sem avisar quando há preço.** "frango 1,2kg 18,90" virou o item "Frango 1,2kg" com quantidade 18,9: o número final é lido como quantidade e o peso fica no nome. A dica de sintaxe não cobre preço. [FATO: `mobile-04`, `mobile-06`; `parse.ts:80-89`]
- **O fim da compra é um beco sem saída.** Depois de finalizar, a tela mostra só "Nenhuma lista ainda." com um "+" tracejado: sem confirmação, sem resumo, sem desfazer, sem botão. Parece perda de dados. [FATO: `mobile-10`; `App.svelte:546-547`]
- **Ninguém é avisado quando a sincronização falha** (ver A-FE e F9) e **não há autocompletar nem itens frequentes** (P4).

**Carga visual e ergonomia (Médio a Alto).** Cabeçalho com título, pílula de escopo, abas, "+", 4 emoji sem rótulo; 2 ações principais e 4 secundárias sempre visíveis; 5 controles por linha de item (caixa de 26 px, setas com fonte de 10 px, lápis, ×, alça) ocupando ~55% da largura; alvos de 26 a 36 px com o token `--tap` de 44 px ignorado; ~78 tamanhos de fonte em px fora dos tokens, 15 abaixo de 11 px; 7 definições de botão. No modo compra o cabeçalho do app continua visível (~38% da altura em barras fixas; ~5 itens visíveis em 844 px), o campo "+ item" flutua sobre a lista, o botão diz "Add" e o total mostra "R$ 0,00" quando ninguém informou preço. [FATO: `mobile-03/04/07/07b`; `ItemLinha.svelte:66-129`; `App.svelte:628-666`]

**Contraste (o Head recalculou com a fórmula WCAG 2.x em script; os valores conferem com o cálculo manual do parecer de design).** Falham no tema claro: âmbar sobre papel 3,78:1 (texto de aviso), borda sobre cartão 1,46:1 (caixa de marcar e campos quase somem; o mínimo para controle é 3:1), branco sobre o botão translúcido do modo compra ≈4,1:1. No tema escuro: branco sobre verde 3,08:1 (botão primário), vermelho sobre fundo âmbar 3,88:1, borda sobre cartão 1,28:1. Emoji não se adaptam ao tema. [FATO: parecer de design §4, confirmado pelo Head]

**Fluxo e linguagem.** Finalizar em dois modais encadeados sem "passo 1 de 2", com "Apenas finalizar" ambíguo; "Preços" com 1 compra mostra um gráfico de 1 barra rotulada "85", sem R$; onboarding de 4 telas antes da primeira tela útil, com promessa não cumprida; termos internos ("escopo", "Insights", "Corredores", "Mover lista"); dois nomes de produto; convite em 5 passos e papéis sem explicação. [FATO: `mobile-08/09/11`, `mobile-02-*`; `TelaFamilias.svelte`, `TelaGerenciarFamilia.svelte`]

**Propostas (UX e design, por etapas, sem mudar paleta nem fontes).**
1. Rótulos nos ícones e menu "⋯" para as ações raras (Mover, Corredores, PDF); depois, barra inferior com 4 destinos: Lista · Comprar · Preços · Mais (Insights e Histórico entram em Preços; família, cupom e conta em Mais).
2. Linha de item só com caixa, nome e quantidade; editar ao tocar no nome; reordenar e remover no editor ou num modo "Reordenar"; a linha inteira alterna "comprado", como no modo compra.
3. Modo compra em tela cheia; total só quando houver preço; campo opcional "R$" ao marcar o item (o momento certo de registrar preço).
4. Finalizar num painel único (resumo, "criar lista com N pendentes" pré-marcado, valor e mercado); pós-compra com aviso "Compra salva: R$ 85,40 · Extra Savassi · [Desfazer] [Ver histórico]" e chamada para nova lista.
5. Ícones SVG (Lucide ou Phosphor, `currentColor`) sempre com rótulo; alvos ≥ 44 px; piso tipográfico de 12 px (mono) e 13 px (Inter) em `rem`; campos de 16 px (evita zoom no iOS); tokens `--on-green` e `--border-strong` (reutilizar `--ink-light` até haver autorização para cor nova); anel de foco duplo sobre superfícies verdes.
6. Estados: vazio com ação, esqueleto de carga, componente de aviso (erro, alerta, sucesso) e toast com "Desfazer"; alternador de tema (Automático, Claro, Escuro) seguindo o sistema.
7. Antes de mudar a navegação, teste moderado com 5 pessoas (tarefas T1 a T6 do parecer de UX; meta do plano: ≤ 8 s até o primeiro item) e 3 perguntas de entrevista para decidir o núcleo do produto.

**Nota do Head sobre uma divergência entre pareceres:** o parecer de design classificou o "Frango 1,2kg · 18.9" das capturas como artefato do roteiro de captura. Não é: o texto foi digitado inteiro na entrada rápida, e o interpretador tratou "18,90" como quantidade (`parse.ts:80-89`). Vale o achado do parecer de UX.

### 5.3 Utilidade, impacto e potencial

**Utilidade hoje:** alta para quem o usa (o autor e família): anotar, comprar junto, finalizar e ter histórico funcionam de ponta a ponta no modo com conta. O núcleo entrega. A camada de preço entrega menos do que promete (A-DAD2 a A-DAD6).

**Impacto potencial:** a "inflação pessoal" é uma narrativa honesta de educação financeira num país com alimentação subindo acima do índice geral (IPCA-15 de outubro de 2026: alimentação no domicílio +1,01% no mês). [FATO: fontes no parecer de negócio] Mas o ganho imediato que o público reconhece, "achar o mais barato", já é entregue de graça por apps estaduais de nota fiscal e por apps privados que leem o QR code da NFC-e. O Compra Planejada compara só o histórico de quem o usa.

**Posicionamento defensável [RECOMENDAÇÃO]:** "seu custo de vida no supermercado, medido por você e pela sua família", não "o app que acha o mais barato".

**Potencial de mercado:** o freemium de R$ 9,90/mês é ~1,8 vez o AnyList (R$ 37,90/ano) e, com o custo de leitura atual, não paga a infraestrutura com 4% de conversão. Otimizado, paga a infraestrutura e deixa sobra pequena; não paga o tempo de uma pessoa antes de dezenas de milhares de famílias. [HIPÓTESE, premissas explícitas no parecer de negócio §6] A recomendação é **não cobrar agora**: piloto grátis de 90 dias com 50–100 famílias convidadas, depois go/no-go com critérios (≥ 50 famílias ativas, retenção na 4ª semana ≥ 25%, ≥ 3 compras/família/mês, OCR ≥ 80% em cupom real, custo ≤ R$ 0,50/família/mês, ≥ 5% clicam em "Assinar Pro" num teste sem cobrança).

**NFC-e:** a decisão do plano de descartar a nota fiscal "por não haver API nacional" continua verdadeira para a integração completa, mas não justifica ignorar o **QR code**: ler o código na câmera preenche loja e data sem erro e sem servidor; buscar os itens na SEFAZ fica como fase 2, com servidor e análise jurídica. [RECOMENDAÇÃO]

## 6. Plano de evolução

Princípio: **nada novo antes de estabilizar e medir.** Esforço: P (até 1 dia), M (até 1 semana), G (mais de 1 semana). Responsáveis conforme o RACI da Prumo.

### Horizonte 1: estabilizar (próximas 4 semanas, vale para qualquer cenário)

| # | Entrega | Resolve | Responsável | Esforço |
|---|---|---|---|---|
| 1 | Corrigir B1 (`untrack`) com teste de regressão E2E do modo sem conta | B1 | frontend-engineer, qa-engineer | P |
| 2 | Invariantes de `households` nas regras + suíte de regras no emulador no CI, antes do job que publica regras | A-SEG1, A-SEG2, A-SEG5 | backend-engineer, qa-engineer | M |
| 3 | Conferir regras publicadas e papel IAM; pin das actions; versão fixa do `firebase-tools`; um só caminho de publicação | A-SEG3, A-SEG4, S-15 | usuário (console) + devsecops-engineer | P |
| 4 | Perfil criado no primeiro login; `atualizarEstatisticas` no lote de `finalizarCompra`; `finalizarCompra` atômico e idempotente | A-ARQ2, A-ARQ3, F6 | backend-engineer | P–M |
| 5 | `parseValorBR` único; preço de referência separado do preço confirmado; `source` propagado | A-DAD2, A-DAD3, M7 | frontend-engineer | P–M |
| 6 | Decidir e executar o modo sem conta: persistir em `localStorage` ou remover | A-ARQ1 | usuário decide; frontend-engineer | P |
| 7 | Corrigir o plano: "Medindo" para ⬜, OCR para "não validado", inventário alinhado ao código; atualizar README | A-PRO1, A-DAD6, FE | Head, product-manager | P |
| 8 | Medição mínima a partir dos dados existentes (`purchases`, `users.createdAt`) e campos agregados em `users/{uid}.resumo`, com script administrativo | A-PRO1 | data-bi-engineer, devsecops-engineer (aprovação do usuário: dados pessoais) | M |
| 9 | Nome único do produto e texto do onboarding sem promessa não cumprida | A-PRO2, P7 | usuário decide; Head | P |
| 10 | `npm update dompurify re2js vite vitest`; Dependabot semanal; `coverage/` no `.gitignore` | S-18, S-24 | frontend-engineer, devsecops-engineer | P |
| 11 | Entrada rápida: reconhecer preço no fim do texto e mostrar na prévia; aviso quando o número final for ambíguo | A-UX1 | frontend-engineer | P |

### Horizonte 2: experiência e confiabilidade (até 3 meses)

| # | Entrega | Resolve | Responsável | Esforço |
|---|---|---|---|---|
| 12 | `vite-plugin-pwa`: pré-cache do shell, fontes e OCR hospedados no próprio app, aviso de nova versão | A-FE1, S-12, FE | frontend-engineer | M |
| 13 | Firestore carregado sob demanda após a sessão; meta ≤ 120 kB gzip no login; `sourcemap: 'hidden'` | A-FE2, S-19 | frontend-engineer | M |
| 14 | `Modal` em `<dialog>` nativo (foco, trap, Esc); indicador de sincronização e erros visíveis; esqueleto de carga | FE Médios, F9 | frontend-engineer, ui-product-design | P–M |
| 14b | Pós-compra com confirmação, desfazer e chamada para nova lista; finalizar num painel único | A-UX2, UX 15 | frontend-engineer, ui-product-design | P–M |
| 15 | Simplificação da interface conforme §5.2: ícones SVG com rótulo e alvo de 44 px, escala tipográfica em tokens, menu "⋯" para ações raras, tokens de contraste, estados vazio/carga/erro, alternador de tema; depois, barra inferior validada com 5 usuários | A-DES1, A-DES2, UX 5–13, P5, P6 | ui-product-design, ux-research, frontend-engineer | M–G |
| 16 | Itens frequentes de um toque e autocompletar na entrada rápida | P4 | frontend-engineer | P–M |
| 17 | Lembrete de recompra ao abrir o app (sem push) | A-PRO2 | frontend-engineer | M |
| 18 | Janela de leitura (90–180 dias), filtro `deletedAt`, índices alinhados às consultas, `prune` em lotes; medir leituras antes e depois | A-NEG1, F7, F8, M5 | backend-engineer | M |
| 19 | Validação do OCR com 30 cupons reais (protocolo do parecer de dados §5) e leitura do QR code da NFC-e para loja e data | A-DAD6, NFC-e | usuário (coleta), data-bi-engineer, frontend-engineer | M |
| 20 | Decompor `App.svelte`: modais com carga própria e controladores por área; ADRs 0001–0009 retroativos | F5, F11 | software-architect, frontend-engineer | M |
| 21 | Cabeçalhos de segurança (CSP, `frame-ancestors`, `Permissions-Policy`); limpeza do cache no logout; convite ≤ 7 dias e de uso limitado; `crypto.getRandomValues` | S-08, S-11, S-13, S-20 | devsecops-engineer, backend-engineer | P–M |
| 22 | Pacote mínimo de privacidade: aviso no login, caminho de exclusão de conta (mesmo manual), retenção definida | LGPD | devsecops-engineer + jurídico (usuário) | M |

### Portão de decisão (fim do horizonte 2): uso pessoal × piloto de nicho

Com 4 a 8 semanas de medição e 3 famílias convidadas, o usuário decide. Tudo o que vem abaixo só faz sentido no cenário de piloto ou mercado e tem **custo recorrente** (plano Blaze, Cloud Functions), um gatilho de escalonamento que exige aprovação explícita.

### Horizonte 3: só se houver mercado (6–12 meses)

| # | Entrega | Responsável | Esforço |
|---|---|---|---|
| 23 | Inflação pessoal v2 (mediana por item e loja, peso por gasto, n mínimo, intervalo), comparação com IPCA via arquivo estático do SIDRA, "onde comprar cada item", orçamento mensal | data-bi-engineer, frontend-engineer | G |
| 24 | Cloud Function de exclusão de conta e exportação (LGPD completa); App Check; projeto Firebase de homologação; PITR/backup; Sentry; alerta de orçamento | devsecops-engineer, backend-engineer | G |
| 25 | Push (FCM) para lembretes; convite por link que entra sozinho | backend-engineer, frontend-engineer | M–G |
| 26 | Capacitor e lojas (exige login nativo, exclusão de conta no app, câmera nativa) | mobile-engineer | G |
| 27 | Teste de preço (R$ 29–39/ano, R$ 3,90/mês) com meio de pagamento, suporte e termos | business-strategy, usuário | G |

## 7. Decisões para o usuário

Cada decisão com até 3 opções; a recomendada vem primeiro.

**D1. Trajetória do produto.** (a) **Decidir em 8 semanas, medindo**: fazer o horizonte 1, convidar 3 famílias e medir; efeito: o trabalho das 4 primeiras semanas serve a qualquer cenário. (b) Uso pessoal: congelar lojas, LGPD completa e cobrança. (c) Piloto grátis de 90 dias com 50–100 famílias já após o horizonte 1: exige o pacote mínimo de privacidade e alerta de custo antes.

**D2. Modo "Usar sem conta".** (a) **Corrigir e persistir no aparelho** (B1 + A-ARQ1): mantém a porta de entrada sem cadastro. (b) Corrigir B1 e manter sem persistência, com texto honesto ("os dados somem ao fechar"). (c) Remover o modo.

**D3. Leitor de cupom (OCR).** (a) **Medir com 30 cupons reais** e decidir depois; até lá rotular como "experimental". (b) Trocar o rótulo e congelar. (c) Investir já na leitura do QR code da NFC-e com busca de itens na SEFAZ (exige servidor e análise jurídica).

**D4. Nome do produto.** (a) **"Compra Planejada"** em todo lugar (repositório, URL, título). (b) "Compras". (c) Nome novo, só com D1-c.

**D5. Congelar escopo** (sem mapa, novos papéis ou novos modais) até concluir o horizonte 1. (a) **Sim.** (b) Sim, com exceções pedidas por você. (c) Não.

**D6. Custo recorrente.** Só se D1 for (c): aprovar plano Blaze com alerta de orçamento (sugestão R$ 50/mês) antes de abrir o piloto. Sem isso, o app para de ler ao atingir a cota gratuita.

## 8. Riscos e pendências

| Risco | Severidade | Mitigação | Como verificar |
|---|---|---|---|
| Regras em produção divergentes do repositório | Alto (pode ser Bloqueador) | Conferir no console hoje | Console > Firestore > Regras > histórico; comparar com `firestore.rules` |
| Dados pessoais e de consumo em produção sem aviso de privacidade nem exclusão de conta | Alto | Pacote mínimo de privacidade antes de convidar terceiros | Existência de aviso no login e de procedimento de exclusão documentado |
| Histórico de preços já contaminado por A-DAD2 e A-DAD3 | Médio | Corrigir os parsers; avaliar limpeza dos registros afetados (operação destrutiva: exige autorização) | Consulta nos `priceEntries` por valores anômalos |
| "Funciona nos testes, quebra em produção" se repetir | Alto | Emulador + testes de componente/E2E no CI (itens 1 e 2) | Pipeline falha ao quebrar regra ou jornada |
| Custo do Firestore sem alerta | Médio hoje, Alto em piloto | Alerta de orçamento; janela de leitura | Console > Uso; Cloud Billing > orçamentos |

## 9. Próximos passos imediatos

1. Usuário responde D1 a D5 (D6 só se D1-c).
2. Head abre a issue do diagnóstico e as issues do horizonte 1 (criar issues em lote exige autorização).
3. Primeira rodada: itens 1, 2 e 3 do horizonte 1 (defeito Bloqueador, regras e emulador, conferência das regras publicadas).
