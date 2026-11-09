# Diagnóstico dos indicadores de inteligência de preço — Compra Planejada

- **Data:** 2026-11-09 · **Demanda:** sem issue ainda · N2 (análise somente leitura) · **Autor:** data-bi-engineer
- **Escopo:** `src/lib/domain/{prices,inflacao,lista-sugerida,receipt-parse,parse,items}.ts`, `src/lib/servicos/listas.ts`, telas de preços/insights/checkout/OCR, `FirestoreRepository.ts`, `firestore.rules`, `firestore.indexes.json`. Nenhum código de produto foi alterado.
- Rótulos: [FATO] com arquivo:linha ou comando e resultado; [HIPÓTESE]; [RECOMENDAÇÃO]. Dados de simulação e linhas de cupom usados aqui são **dados fictícios**, escritos pelo analista; não medem acurácia real.
- Scripts de conferência (dados fictícios; rodados pelo analista com esbuild+node): `docs/dados/scripts/{chave,sim,ocr}.ts`.

## 1. Resumo

1. [FATO] A camada de dados é simples e auditável: preço unitário imutável por registro, domínio puro e testado. A base conceitual é boa.
2. [FATO] Três defeitos tornam parte dos indicadores incorretos hoje: (a) `itemStats` nunca é gravado (`atualizarEstatisticas` não tem chamador); (b) "1.234,56" digitado no checkout vira R$ 1,23; (c) preço antigo é copiado para listas novas e depois gravado como "pago".
3. [FATO] A chave do item ignora a unidade e não há conversão: kg, g e un do mesmo produto se misturam.
4. [HIPÓTESE, simulação fictícia] A "inflação pessoal" com ~4 compras/mês e 40% dos itens com preço oscila ±3 pp (p5–p95) com inflação real zero; com 2 compras/mês e 10 itens, ±6 a 8 pp. O IPCA do trimestre jul–set/2026 foi 0,57% (SIDRA). O indicador não separa sinal de ruído e hoje não deve ser vendido como índice (PLANO §6 o coloca no plano Pro).
5. [FATO] O "critério ≥ 80%" do OCR mede só recall do nome, por substring, em 4 itens fictícios. Não mede quantidade, preço nem precisão. Nenhuma das métricas do PLANO §5 é calculada, ao contrário do "✅" da tabela.

## 2. Fichas dos indicadores (resumidas)

Fonte comum: `priceEntries` (PriceEntry, `types.ts:127-140`) gravada em `finalizarCompra` (`listas.ts:135-136`) e `purchases` (`types.ts:103-114`). Periodicidade: recalculado no cliente a cada snapshot (tempo real, sem corte). Ausência: o indicador some ou vira `null`, sem aviso de cobertura. Linha de base e meta: não definidas para nenhum indicador.

| Indicador | Pergunta que responde | Fórmula como está (arquivo:linha) | Granularidade | Polaridade | Limitações principais |
|---|---|---|---|---|---|
| Preço unitário normalizado | Quanto paguei por unidade do item? | `unitPrice = round(it.price*100)/100`, só itens `bought` com `price>0` (`prices.ts:90-97`); `key = normalizeName(name)` (`prices.ts:93`, `categorize.ts:38-40`) | registro (item × compra × loja) | menor é melhor | Unidade fora da chave; sem conversão; arredonda a centavos (R$ 0,009/g vira 0,01); herda preço antigo (A3); `date` = momento de finalizar (`prices.ts:98`, `listas.ts:117`) |
| Variação de preço por item | O item subiu ou caiu? | `(ultimo - antigo)/antigo*100`, 1 casa, só 2 pontos extremos (`prices.ts:53-56`) | item | menor é melhor | Sem janela nem n mínimo; tela diz "do primeiro registro até agora" (`TelaPrecos.svelte`, bloco de detalhe); mistura lojas e unidades |
| Comparação entre lojas | Onde o item é mais barato? | média simples por `e.store \|\| 'sem loja'`, ordenada crescente; 1ª = "mais barato" (`prices.ts:58-71`) | item × loja | menor é melhor | Loja é texto livre sem normalização; média de todo o histórico (confunde tempo e loja); n=1 também ganha selo; "sem loja" entra no ranking; `menor` inclui promoção |
| Gasto por compra | Quanto gastei em cada compra? | `actualTotal` das últimas 12 compras com total válido, ordem cronológica (`prices.ts:109-118`) | compra | faixa (depende do orçamento) | Exclui compras sem total sem avisar quantas; 12 compras ≠ período; total digitado, não conferido com a soma dos itens; erro de milhar (A2) |
| Inflação pessoal | Minha cesta ficou mais cara? | por item: `(média preço janela atual − média janela anterior)/média anterior*100` (`inflacao.ts:44-48`); peso = nº de registros nas duas janelas (`inflacao.ts:49`); índice = Σ var×peso / Σ pesos (`inflacao.ts:55-56`); janelas de 90 d, atual × anterior (`inflacao.ts:30-32`) | cesta (item entra se tem registro nas duas janelas) | menor é melhor | Ver §3, A5 |
| Previsão de recompra | Quando devo comprar de novo? | `intervaloMedio = Σ intervalos/(n-1)` com n≥3 registros (`inflacao.ts:87-91`); `atraso = diasDesdeUltima/intervaloMedio` (`inflacao.ts:102`); em atraso se ≥ 1 (`inflacao.ts:113`) | item | faixa (atraso ≈ 1) | Ver M1, M2 |
| Lista sugerida | O que provavelmente falta? | 1º itens em atraso, 2º `itemStats` por `count` desc, fora das listas ativas, limite 15 (`lista-sugerida.ts:34-59`) | item | n/a (utilidade) | 2º ramo depende de `itemStats`, que não é gravado (A1) |
| Total estimado × pago | Gastei mais ou menos que o previsto? | `estimatedTotal = Σ price×parseFloat(qty)` de **todos** os itens (`items.ts:120-127`, `listas.ts:128`); `actualTotal` digitado (`ModalCheckout.svelte:32-36`); diferença na tela (`ModalCheckout.svelte:22-28`) | compra | faixa (perto de 0) | Inclui itens não comprados; item sem preço conta 0; qty com vírgula vira 1 (M3) |
| Acurácia do OCR | Quanto do cupom o app lê certo? | `acertos/esperados`; acerto = nome extraído contém o esperado ou vice-versa, normalizado (`receipt-parse.ts:142-153`) | item, em cupom simulado de 4 itens | maior é melhor | Ver A6 e §4 |

## 3. Pontos fortes

- [FATO] Preço unitário e registro imutável com `purchaseId`, `store`, `qty`, `date` (`types.ts:127-140`); as regras impõem `update: false` e `unitPrice > 0` (`firestore.rules:84-92`). Bom para auditoria.
- [FATO] `date` é epoch em milissegundos: sem ambiguidade de fuso na gravação.
- [FATO] `qty` já é gravada em cada `PriceEntry`: permite ponderar por gasto sem migração.
- [FATO] Domínio puro, sem rede, com testes: `npx vitest run tests/bloco-h.test.ts tests/dominio.test.ts` passou (87 testes). Conferência independente é barata.
- [FATO] Desenho conservador de produto: previsão exige 3 registros; lista sugerida e OCR nunca gravam sozinhos; confiança por linha no OCR; `paraNumero` trata milhar e decimal brasileiros (`receipt-parse.ts:56-59`); limitações documentadas nos comentários.

## 4. Pontos fracos

| Sev. | Achado | Evidência | Recomendação |
|---|---|---|---|
| Alto (A1) | `itemStats` nunca é gravado. Ramo "frequentes" da lista sugerida, `sugestoesDeRecompra`, `lastPrice` e `unit` das sugestões só funcionam para dados migrados do localStorage. O PLANO marca H5 como completo. | `grep -rn atualizarEstatisticas src` retorna só a definição (`listas.ts:182`); `itemStats` só é escrito em `migration.ts:168-231` | [RECOMENDAÇÃO] Chamar a atualização em `finalizarCompra` (só itens `bought`) ou derivar a frequência de `purchases`; teste de integração do fluxo. Dono: backend-engineer. |
| Alto (A2) | Valor digitado com ponto de milhar é lido errado: "1.234,56" → 1,234. `actualTotal` fica errado e a compra é imutável. Mesmo padrão em item e OCR. | `ModalCheckout.svelte:23,32`; `ModalEditarItem.svelte:27`; `TelaCupomOCR.svelte:69`. Script `chave.ts`: `parseFloat('1.234,56'.replace(',', '.'))` = 1.234 | [RECOMENDAÇÃO] Um `parseValorBR()` único no domínio (reaproveitar a lógica de `paraNumero`), com teste; rejeitar entrada ambígua. Validar `actualTotal` contra a soma dos itens (aviso se divergir > 50%). Dono: frontend-engineer. |
| Alto (A3) | Preço antigo é copiado para listas novas (recorrência, reativar compra, lista sugerida). Se o item é marcado e a compra finalizada, o preço antigo vira "preço pago" com data nova. Isso achata a inflação, falseia o menor preço e a comparação entre lojas. Não há marca de "preço confirmado". | `recurrence.ts:44-47`; `App.svelte:437-447` e `465-473` (`lastPrice`); `prices.ts:90-99` grava qualquer `price>0`. Magnitude em uso real: [HIPÓTESE], não medida | [RECOMENDAÇÃO] Campo `priceConfirmedAt`/`precoDaCompra` no item; ao copiar, guardar como `precoReferencia` (exibido, não gravado). Só preço digitado ou lido do cupom na compra vira `PriceEntry`. |
| Alto (A4) | Chave sem unidade e sem conversão. "Tomate" em kg, g e un colide: no script, menor 0,01, maior 9,00, variação 500%, unidade exibida = a do último. "tomate" ≠ "tomates" (sem plural) e `parse.ts` trata "arroz 5kg" como 5 kg de arroz, não embalagem. | `prices.ts:93`; `parse.ts:11-23,80-89`; script `chave.ts` | [RECOMENDAÇÃO] `unidadeBase` (kg, L, un) e `precoPorUnidadeBase` na `PriceEntry` (g→kg, ml→L, dz→12 un); comparar só dentro da mesma base; chave canônica com singularização simples e dicionário de sinônimos. Esforço M. |
| Alto (A5) | Inflação pessoal sem validade estatística. Peso = contagem de registros (não gasto); média aritmética de relativos (viés de alta); sem separar loja nem promoção; sem n mínimo (1 registro por janela basta); sem intervalo ou aviso de amostra. Com inflação real zero, o índice oscila. Item barato e frequente domina: pão +20% (18 reg., R$ 1) contra carne −25% (2 reg., R$ 30–40) dá +15,5%. Troca de loja do café (R$ 10→20, 1 registro) dá +100% e 1 item. | `inflacao.ts:30-32,44-49,53-56`; texto "itens que você compra com frequência" aparece com 1 item (`TelaInsights.svelte:49`). Simulação fictícia `sim.ts`, 2.000 rodadas por cenário, inflação real 0 (parâmetros assumidos por mim, [HIPÓTESE]): 4 compras/mês, 20 itens, 40% com preço → p5/p95 = −2,6/+3,0 pp; 2 compras/mês, 10 itens → −6,1/+7,7 pp, 57% das rodadas com \|x\|>2 pp | [RECOMENDAÇÃO] Índice v2 (ver §7, item 5): peso por gasto, média geométrica, mediana por item/mês, comparar mesma loja, excluir promoção, exigir ≥ 8 itens e ≥ 2 registros por janela, mostrar "dados insuficientes" e intervalo. Até lá, rotular como "variação dos seus preços", não "inflação". |
| Alto (A6) | O "critério ≥ 80%" não mede o que o plano promete ("itens corretos em 20 cupons reais de 3 mercados", `receipt-parse.ts:136-137`). A métrica é recall de nome por substring em 4 itens (1 erro = 75%); lixo extra não penaliza (10 linhas de ruído + 1 item: taxa 1,00); "leite" acerta "leite condensado". O PLANO:353-359 diz "verificado". | `receipt-parse.ts:142-153`; `bloco-h.test.ts` (teste "CRITÉRIO DE SUCESSO"); script `ocr.ts` | [RECOMENDAÇÃO] Reescrever a métrica por campo e com precisão (§5); rebaixar o texto do PLANO para "não validado". |
| Médio (M1) | Recompra sensível a outlier e a duplicata. A média dos intervalos é (último−primeiro)/(n−1): só os extremos importam. 10 intervalos de 7 d + 1 de 30 d dá 9 d (mediana 7). 2 registros no mesmo dia + 1 a 30 d dá 15 d (real: 30). Itens sem preço digitado não geram `PriceEntry`, então não entram. Quantidade ignorada. | `inflacao.ts:88-91`; `prices.ts:92`; script `sim.ts` | [RECOMENDAÇÃO] Derivar de `purchases` (itens `bought`, 1 evento por compra, com ou sem preço); mediana dos intervalos; dedupe por compra; ponderar por qty quando houver. |
| Médio (M2) | Itens abandonados dominam a lista: a ordenação é por `atrasoRelativo` sem teto, então um item parado há 700 d (atraso 98) vem antes de um regular (0,71) e fica "em atraso" para sempre. Sem "parar de sugerir". Seleção por sessão reinicia a cada recálculo. | `inflacao.ts:108,113`; `lista-sugerida.ts:34`; `TelaInsights.svelte:26-30`; script `sim.ts` | [RECOMENDAÇÃO] Descartar quando atraso > 3 (ou > 6 intervalos); ação "não sugerir mais" persistida; mostrar o motivo ("a cada 21 d, faz 26"). |
| Médio (M3) | Estimado × pago enviesado: `estimatedTotal` soma todos os itens, o pago só os comprados; `totalGasto` existe e não é usado; item sem preço = 0 sem aviso; `parseFloat("1,5")` = 1, e o campo de quantidade aceita vírgula. | `listas.ts:128`; `ModalCheckout.svelte:16`; `items.ts:124,129`; `ModalEditarItem.svelte:47`; script `chave.ts` | [RECOMENDAÇÃO] Comparar com `totalGasto` dos comprados; exibir "N itens sem preço"; normalizar qty no domínio. |
| Médio (M4) | Comparação de lojas e "menor" sem controle: loja em texto livre ("Extra" ≠ "extra"), média de todo o tempo, selo com n=1. Variação de item é ponta a ponta. | `prices.ts:47,53-60,69-71` | [RECOMENDAÇÃO] `storeKey` normalizado; média ou mediana dos últimos 90–180 d; selo só com n≥2 por loja; variação por mediana de janelas. |
| Médio (M5) | Crescimento sem limite e leitura integral. `watchPrices` e `watchPurchases` leem tudo do dono; `prune` não tem chamador; `MESES_DE_HISTORICO` (18) não é usado; `prune` usa um `writeBatch` só (limite de 500 operações: [HIPÓTESE], doc oficial não consultada). Os índices `priceEntries(key,date)` e `purchases(finishedAt)` não servem a nenhuma consulta existente (só igualdade em `owner`). Ordem de grandeza: 4 compras × 25 itens com preço ≈ 1.800 docs em 18 meses [HIPÓTESE]. | `FirestoreRepository.ts:177-183,190-198`; `grep -rn "prune\|MESES_DE_HISTORICO" src` sem uso fora da definição; `firestore.indexes.json:16-30`; `firebase.ts:50` (cache persistente atenua leituras repetidas: [HIPÓTESE]) | [RECOMENDAÇÃO] Consulta com `where('date','>=',corte)` (índice `owner.kind, owner.id, date`), `prune` em lotes de ≤ 500 ao abrir o app, ou resumo mensal (§7). Medir antes de otimizar (§10). Dono: backend-engineer. |
| Médio (M6) | `finalizarCompra` não é atômica (4 escritas sequenciais), apesar do comentário. Falha após `addPurchase` deixa compra sem preços; repetir cria compra duplicada (a lista só é apagada no fim). Tudo é imutável. | `listas.ts:108-112` (comentário) × `133,136,141,146` | [RECOMENDAÇÃO] `writeBatch`/transação (compra + preços + lista) com ids determinísticos; teste de falha parcial. |
| Médio (M7) | `date` = instante de finalizar, não da compra; data do cupom é extraída e nunca usada; `source: 'ocr'` existe no tipo e nunca é gravado (todo preço sai como `'manual'`). Não dá para medir a qualidade do OCR em produção. | `prices.ts:98-99`; `listas.ts:117`; `receipt-parse.ts:77-81`; `App.svelte:450-463` (OCR entra como item de lista); `grep -rn "source:" src` | [RECOMENDAÇÃO] Campo `compradoEm` editável no checkout (padrão = hoje); propagar `source` do item até a `PriceEntry`. |
| Médio (M8) | Métricas do PLANO §5 sem cálculo: North Star, ativação, colaboração aparecem como "✅ medindo". | `grep -rniE "analytics\|gtag\|logEvent\|measurementId\|posthog\|plausible" src package.json firebase.json index.html` = 0 ocorrências; não há `functions/` | [RECOMENDAÇÃO] Corrigir o PLANO e implementar §6. |
| Baixo | Regras não limitam `unitPrice` nem validam `key`; `deletePurchase` não apaga `priceEntries` do `purchaseId` (hoje não exposto na UI); "Gasto por compra" não tem eixo de tempo (layout é do ui-product-design). | `firestore.rules:86-88`; `FirestoreRepository.ts:167-169`; `TelaPrecos.svelte:17,42-52` | [RECOMENDAÇÃO] Teto razoável (ex.: ≤ 10.000) e `key is string`; apagar em cascata se expuser exclusão. |

Qualidade (item 7 do pedido): moeda e locale — `formatPrice` usa `pt-BR`/`BRL` (`prices.ts:120-123`), mas as entradas só aceitam vírgula decimal sem milhar (A2). Fuso — epoch ms é correto; agregações mensais devem fixar `America/Sao_Paulo` [HIPÓTESE: sem horário de verão desde 2019, não consultado]. Duplicidade ao reativar compra — `aoReativarCompra` cria lista nova sem gravar `PriceEntry`; o risco é o eco de preço de A3, não duplicata direta.

## 5. Protocolo de validação do OCR (cupons reais)

**Objetivo.** Estimar com intervalo de confiança a taxa de acerto por campo do pipeline real (`ocr.ts` + `extrairItens`), por rede e condição de foto.

**Amostra.**
- Tamanho: 30 cupons, ≥ 400 linhas de item. Cálculo: n = 1,96²·0,8·0,2/0,05² ≈ 246 linhas para ±5 pp a 95%; os cupons são conglomerados (erros correlacionados), então sobra margem. O plano pedia 20 cupons; 20 só serve se tiverem ≥ 15 itens em média.
- Redes: ≥ 5 layouts distintos (3 redes grandes, 1 atacarejo, 1 mercado de bairro ou hortifrúti); pelo menos 6 cupons de cada rede principal. Incluir itens por peso, itens com código no início, desconto, nome quebrado em duas linhas.
- Condições: foto boa, com sombra, cupom amassado e térmico desbotado (≥ 5 de cada).
- Sem seleção favorável: usar os cupons da família em ordem de data, sem descartar os difíceis.

**Gabarito.** Dupla digitação por duas pessoas em planilha e conferência pelo total impresso no cupom. Cada linha: nome, quantidade, unidade, preço unitário, total da linha.

**Métricas (definição, fonte, regra).**
| Métrica | Regra | Meta proposta ([RECOMENDAÇÃO]; o product-manager define) |
|---|---|---|
| Recall de itens | linhas do gabarito encontradas ÷ linhas do gabarito (alinhamento por similaridade de nome ≥ 0,8, ordem preservada) | ≥ 95% |
| Precisão de itens | itens extraídos que correspondem a linha do gabarito ÷ itens extraídos | ≥ 90% |
| Nome | igual ao gabarito após `normalizeName` e remoção de código, qty e embalagem; versão frouxa (substring) só como diagnóstico | ≥ 85% |
| Quantidade | igual ao gabarito (tolerância 0) | ≥ 90% |
| Preço unitário e total | igual em centavos | ≥ 95% |
| **Item totalmente correto** (nome + qty + unitário) | ÷ linhas do gabarito | **≥ 80%** (é a leitura fiel do critério do plano) |
| Coerência do cupom | soma dos totais extraídos ≈ total impresso (±R$ 0,05) | ≥ 80% dos cupons |
Critério de aceite: limite inferior do IC 95% (Wilson por linha e bootstrap por cupom) ≥ meta. Relatar por rede, por condição e por classe de erro.

**Estado atual (exploratório, [FATO] com dados fictícios).** `ocr.ts`, 10 linhas escritas por mim: nome (frouxo) 9/10, quantidade 4/10, preço unitário 9/10, total 9/10; `nome` extraído carrega "1 un x" ou código em 5 de 9 itens; "CAIXA" no nome descarta o item (`receipt-parse.ts:52`); item em duas linhas vira "6 un x". Embalagem ("5KG", "1L", "12 UN") é lida como quantidade (`receipt-parse.ts:99`). Isso indica classes de erro a cobrir, não a taxa real.

**Formato de fixture.** `tests/fixtures/ocr/<rede>-<aaaammdd>-<nn>.json`:
```json
{ "id": "rede-a-20261109-01", "origem": "real-anonimizado | ficticio",
  "rede": "rede-a", "layout": "nfce-danfe | sat | outro", "condicao": "boa | sombra | amassado | desbotado",
  "motorOcr": "tesseract.js@7.x, idioma por", "textoOcr": "…texto bruto do Tesseract…",
  "gabarito": { "loja": "…", "data": "2026-11-09", "totalCupom": 76.13,
    "itens": [ { "nome": "ARROZ TIPO 1 5KG", "chave": "arroz", "qty": 1, "unidade": "un", "precoUnit": 24.90, "totalLinha": 24.90 } ] } }
```
Um teste `tests/ocr-validacao.test.ts` lê todas as fixtures, roda `extrairItens`, calcula as métricas e grava o relatório em `docs/dados/ocr-validacao-<data>.md`. Fixtures `ficticio` ficam fora do critério e levam o rótulo "Dados fictícios".

**Privacidade.** Cupom pode ter CPF, final de cartão e endereço. Só entram no repositório o texto OCR e o gabarito com esses campos removidos; as fotos ficam fora do repositório. Revisar com o devsecops-engineer antes de commitar.

## 6. Métricas de produto: como medir (sem analytics invasivo)

[FATO] Hoje não há como calcular nenhuma. [FATO] As regras só deixam ler dados do próprio dono (`podeLer`), então o cliente não consegue agregar entre famílias. [RECOMENDAÇÃO] Dois passos: (1) o cliente grava poucos campos agregados e sem conteúdo no próprio `users/{uid}`; (2) um script administrativo com credencial somente leitura, aprovada pelo usuário, soma esses campos. Cloud Function exigiria plano pago (custo e infraestrutura: gatilho de aprovação).

Campos novos em `users/{uid}.resumo`: `primeiraCompraEm` (epoch, gravado uma vez), `comprasFinalizadas` (contador), `semanasAtivas` (lista de semanas ISO com atividade, no máximo 60), `ocr` (`itensExtraidos`, `aceitosSemEdicao`, `editados`, `descartados`).

| Métrica | Definição | Fonte | Regra de cálculo |
|---|---|---|---|
| North Star | % de famílias com ≥ 3 compras finalizadas no mês (a meta do plano é "≥ 3 por família") | `purchases` (`owner.kind='household'`, `finishedAt`) | contar por `owner.id` e mês em `America/Sao_Paulo`; retroativo, sem campo novo; excluir contas de teste |
| Ativação | % dos cadastrados na semana S com 1ª compra em ≤ 7 d | `users.createdAt` (`types.ts:158`) e `resumo.primeiraCompraEm` | numerador: `primeiraCompraEm − createdAt ≤ 7 d`; denominador: cadastros da coorte com ≥ 7 d de idade |
| Retenção W4 | % da coorte com atividade na semana 4 (dias 22–28) | `resumo.semanasAtivas` | "ativo" = finalizar compra ou editar lista; abrir o app não conta; coorte por semana de cadastro |
| Colaboração | % de famílias com ≥ 2 membros ativos no mês | `households.memberUids` (`types.ts:48`) e `purchases.finishedBy` (`listas.ts:130`) | membros distintos em `finishedBy` no mês ≥ 2 ÷ famílias com ≥ 2 membros; retroativo |
| Atrito de entrada ≤ 8 s | p50 do tempo entre abrir e o 1º item adicionado | medição local (`performance.now`) | histograma de 5 faixas em `resumo`; opcional |
| H3 em produção | % de itens lidos aceitos sem edição (proxy) | `resumo.ocr`, `source:'ocr'` | `aceitosSemEdicao ÷ itensExtraidos`; [HIPÓTESE] superestima acerto (usuário pode aceitar erro); não substitui o §5 |
| Confiabilidade | incidentes de perda de dados = 0 | issues do GitHub | contagem por rótulo; fora do app |

Linha de base e meta de cada uma: a definir pelo product-manager após 4 semanas de coleta.

## 7. Novos indicadores propostos

Esforço: P = até 1 dia, M = até 1 semana, G = mais de 1 semana (estimativa, [HIPÓTESE]).

| # | Indicador | Valor para a decisão | Dados necessários | Esf. |
|---|---|---|---|---|
| 1 | Cobertura de preço (% dos itens comprados com preço informado, por compra) | Mostra quando os demais indicadores são confiáveis; condiciona A5 e M1 | `purchases.items[].price` e `bought` (já existem) | P |
| 2 | Gasto por categoria e por mês | Onde está o dinheiro; base do orçamento | Σ `qty×price` de itens `bought` por `category` em `purchases` (já existe); "Sem categoria" explícita | P |
| 3 | Orçamento mensal × realizado | Controle de gasto | campo novo `orcamentoMensal` no perfil ou família; realizado = Σ `actualTotal` do mês (cai para soma dos itens) | M |
| 4 | Preço por unidade-base | Habilita comparar kg, L e un com segurança | `unidadeBase`, `precoPorUnidadeBase`, `storeKey` na `PriceEntry` (schema 4→5, `types.ts:188`); reprocessar o histórico no cliente | M |
| 5 | Inflação pessoal v2 | Variação confiável da cesta | Índice encadeado mensal: relativo por item = mediana do mês ÷ mediana do mês anterior na mesma loja; agregação por média geométrica ponderada pelo gasto da janela anterior; mínimo de 8 itens e 2 registros por janela; intervalo por bootstrap de itens; "dados insuficientes" abaixo do mínimo | G |
| 6 | Comparação com IPCA | Dá referência externa à variação pessoal | Série pública do IBGE (ver abaixo) em arquivo estático `public/ipca.json` | M |
| 7 | "Onde comprar cada item" | Economia por troca de loja | Mediana por item × loja nos últimos 90–180 d (n ≥ 2 por loja), com `storeKey` e preço por unidade-base | M |
| 8 | Alerta de preço no momento da compra | Evita pagar caro | Ao digitar o preço: razão ao p50 dos últimos 90 d do item (n ≥ 5), "18% acima do usual"; cálculo no cliente; push exigiria Function (G, não recomendado agora) | P |
| 9 | Economia obtida | Prova de valor | (mediana 90 d do item − preço pago) × qty, só quando positiva e n ≥ 3; separar "troca de loja" de "promoção"; rotular "estimativa" | M |
| 10 | Gasto mensal com comparação ao mesmo mês do ano anterior | Tendência | Σ por mês de `purchases` | P |

**IPCA (SIDRA), consultado em 2026-11-09:**
- Variação mensal Brasil: `https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/63/p/last%203?formato=json` → jul/2026 0,07%; ago/2026 −0,32%; set/2026 0,82%. Acumulado jul–set = 0,57% (cálculo: 1,0007 × 0,9968 × 1,0082 − 1).
- Número-índice (base dez/1993 = 100): `.../t/1737/n1/all/v/2266/p/last%204` → jun 7.652,37; set 7.695,82 (+0,57%, confere).
- Alimentação e bebidas: `.../t/7060/n1/all/v/63/p/202609/c315/7170` → set/2026 0,83%.
- Para comparar com a variação pessoal, usar a razão entre os níveis médios das mesmas janelas, não a soma de variações mensais.
- [HIPÓTESE] O IPCA pondera por estrutura de gasto (POF) e usa média geométrica nos agregados elementares; a metodologia do IBGE não foi consultada. A comparação é de ordem de grandeza, não de igualdade.
- Painel de Preços do governo federal: **não verificado**; o acesso a `https://paineldeprecos.planejamento.gov.br/` retornou 403 (bloqueio Cloudflare) em 2026-11-09. [HIPÓTESE] refere-se a compras públicas, não ao varejo de supermercado; não recomendo como referência da cesta.
- CORS da API SIDRA a partir do navegador: **não verificado**. [RECOMENDAÇÃO] arquivo estático atualizado mensalmente por rotina agendada (workflow de CI: tema do devsecops-engineer), para não depender da API em tempo de execução e não enviar dados do usuário.

## 8. Modelo de dados para sustentar os novos indicadores

1. **Fase 1 (cliente).** Consulta com filtro de data (18 meses), `prune` ativo em lotes, campos novos em `PriceEntry` (§7 item 4, `priceConfirmedAt`, `compradoEm`, `source` correto). Calcular tudo no cliente. Suficiente para famílias pequenas.
2. **Fase 2 (só se a medição pedir).** Coleção `resumos/{ownerKey}_{aaaamm}` escrita no mesmo `writeBatch` de `finalizarCompra`: gasto total, gasto por categoria, nº de compras, cobertura de preço, mediana de preço por item (chave × loja). A leitura cai de milhares de documentos para ~12.
3. **Cloud Function:** não recomendada agora (custo e infraestrutura exigem aprovação). Só se precisarmos de métricas confiáveis entre usuários sem script administrativo.

## 9. Fora do meu papel

- Layout dos gráficos (gasto por compra sem eixo de tempo, escala por barra) → ui-product-design; rótulos e avisos de amostra na tela → ux-research e ui-product-design.
- Correção de A1, A2, A3, M3 → frontend-engineer e backend-engineer; transação, regras, índices, prune (A1, M5, M6, regras) → backend-engineer.
- Campos de `resumo` e script administrativo: LGPD, consentimento, credencial e rotina de CI → devsecops-engineer, com aprovação do usuário (dados pessoais, infraestrutura).
- Metas, linha de base e relevância das métricas do §6 e do §5 → product-manager. Preço e promessa do plano Pro, que vende "inflação pessoal" (`PLANO:§6`) → business-strategy.

## 10. Não verificado

- Comportamento no Firestore real ou emulador: leituras por abertura, tempo do primeiro snapshot, efeito do cache persistente, limite de 500 operações por `writeBatch`. Procedimento: emulador com 2.000 e 10.000 `priceEntries` fictícios, medindo antes e depois de qualquer mudança.
- OCR com imagens e Tesseract reais; layouts reais de cupom. Só linhas fictícias foram testadas.
- Simulação de inflação: parâmetros (ruído de 1%, diferença de loja de 8%, promoção de 20% em 10% das compras, frequência de itens) são meus; resultados indicativos.
- Cobertura de testes: não rodei `--coverage`; os 132 testes e as coberturas vêm do Head. Rodei `bloco-h` (20) e `bloco-h` + `dominio` (87).
- Metodologia do IPCA, abolição do horário de verão, doc de limites do Firestore e CORS do SIDRA: não consultados.
