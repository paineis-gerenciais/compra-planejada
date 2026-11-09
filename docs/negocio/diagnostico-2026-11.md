# Compra Planejada: diagnóstico de estratégia e negócio (novembro de 2026)

Autor: business-strategy · Data: 2026-11-09 · Demanda: sem issue (N2, análise somente leitura)
Pergunta de negócio: vale tratar o Compra Planejada como produto de mercado, e em que forma, ou manter como produto pessoal?
Decisão que apoia: PLANO §7, item 1 ("uso pessoal ou produto de mercado?").
Rótulos: [FATO] tem fonte na seção Fontes; [HIPÓTESE] é premissa não verificada; [RECOMENDAÇÃO] é opinião fundamentada. Todas as consultas web foram feitas em 2026-11-09.

## 1. Resumo

- [RECOMENDAÇÃO] Não cobrar agora. Fazer um piloto grátis de 90 dias com 50 a 100 famílias recrutadas à mão, depois de um pacote mínimo de preparação (privacidade, exclusão de conta, leitura de dados otimizada, validação do OCR com cupons reais). Decidir go/no-go no fim (seção 9).
- [HIPÓTESE] O freemium de R$ 9,90/mês não fecha as contas hoje. Com o custo de leituras do Firestore "como está", a receita de 4% de conversão mal cobre a infraestrutura (seção 6). Com a leitura otimizada, cobre a infraestrutura mas não o tempo do mantenedor.
- [FATO] O que mais economiza (preço colaborativo vindo de NFC-e) já é entregue de graça por apps estaduais e por vários apps privados. O Compra Planejada compara só o histórico de quem o usa. A diferenciação real é a camada pessoal (inflação ponderada, previsão de recompra, lista sugerida, sem anúncios), e ela ainda não tem demanda comprovada.
- [RECOMENDAÇÃO] NFC-e não deve mais ser descartada. A premissa "não há API nacional" continua verdadeira, mas a leitura do QR code da nota é um complemento viável ao OCR (seção 4).
- [FATO] Há risco de custo ilimitado: o app assina todas as `priceEntries` e `purchases` do dono, então a leitura cresce com o tempo. O alerta de custo do Firestore está pendente (PLANO, Bloco J).

## 2. Mercado e concorrência

### 2.1 Sinais de demanda
- [FATO] IPCA de setembro de 2026: +0,82% no mês e +4,58% em 12 meses (IBGE, via notícia). Alimentação e bebidas: +0,83% no mês. O valor de 12 meses do grupo (+4,66%, alimentação no domicílio +4,21%) aparece só no comunicado da CNA, sem segunda fonte. [1][2]
- [FATO] IPCA-15 de outubro de 2026: alimentação e bebidas foi o grupo de maior alta (+0,88%); alimentação no domicílio +1,01%. [3]
- [FATO] 46% dos brasileiros pagam mais de R$ 100/mês somando assinaturas (Vindi/Opinion Box, 1.040 pessoas, jun-jul/2026). [4] Média de R$ 118/mês (Bango, 2024, inclui outros países da América Latina). [5] Os dois dados são dominados por streaming e não medem apps utilitários.
- [FATO] Programas estaduais de nota fiscal têm base grande: Nota Fiscal Gaúcha passa de 3 milhões de participantes [6]; o Menor Preço Nota Gaúcha completou 7 anos em 2026 [7]. Os números de usuários de Paraná variam entre fontes (de 100 mil a 400 mil no app, 23 milhões de cadastros no programa) e são antigos [8][9]; não os use em pitch.
- [HIPÓTESE] O tamanho total do mercado endereçável (domicílios que planejam compras em app) não foi levantado. Não há ranking de downloads no Brasil nas fontes acessadas (Sensor Tower e data.ai fora do alcance).

### 2.2 Comparativo
| Produto | Tipo | O que faz de relevante | Preço | Fonte |
|---|---|---|---|---|
| Menor Preço Nota Paraná / Nota Gaúcha / Menor Preço Brasil (ES) | App estadual, grátis | Preço por item vindo de NFC-e, pesquisa por produto, listas salvas | Grátis | [7][8][10] |
| Economiza Club | App privado | Lê QR code da nota, base colaborativa, listas, compara estabelecimentos da região | não levantado | [11] |
| Compare a Compra | App/site privado | Custo da cesta inteira por supermercado, com preços de notas | não levantado | [11] |
| Super Lista | App privado | Histórico de preço pago, estima próxima lista por mercado; leitura de nota só no RJ | não levantado | [11] |
| Anotadíssimo | App privado | Monta a lista a partir da NFC-e, diz funcionar com qualquer estado | não levantado | [11] |
| Economiza AI, Busca Preço, Meus Preços, Meu Carrinho | Apps privados | Controle de gasto pela nota, comparação entre supermercados | não levantado | [11] |
| AnyList | Lista, global | Listas compartilhadas, premium | R$ 37,90/ano individual; R$ 54,90/ano família (App Store BR, sem data na página) | [12] |
| Bring! | Lista, global | Listas compartilhadas, premium sem anúncios | EUR 13,99/ano (Alemanha) | [13] |
| Listonic | Lista, global | Freemium com anúncios, premium sem anúncios | não levantado | [14] |
| Mobills | Finanças | Controle financeiro | R$ 99,90/ano (agregador, não confirmado) | [15] |
| Google Keep/Tarefas, Out of Milk, Lista Fácil, apps das redes (Pão de Açúcar, Carrefour, Assaí), Organizze | vários | Não pesquisados | n/d | n/d |

Limite: as descrições dos apps privados vêm de páginas promocionais; nenhuma foi verificada em loja. Lacuna: preços em reais de Bring!, Listonic e Organizze; confira nas lojas brasileiras.

## 3. Diferenciação e lacunas

| Tema | Compra Planejada | Líderes | Leitura |
|---|---|---|---|
| Inflação pessoal ponderada por frequência | Tem | Não encontrado nos apps pesquisados | [HIPÓTESE] diferencial, sem teste de demanda |
| Previsão de recompra e lista sugerida | Tem | AnyList/Bring! não destacam; Super Lista estima lista por mercado | [HIPÓTESE] diferencial parcial |
| OCR de cupom no navegador | Tem, sem validação real (alvo ≥80% só em simulação, PLANO §1) | Apps de NFC-e usam QR code | Frágil: foto de papel térmico amassado é o pior caso do OCR [HIPÓTESE] |
| Sem anúncios | Sim | Listonic usa anúncios; Bring! cobra para removê-los [13][14] | Diferencial fraco: o grátis ruim não é o problema dominante |
| Preço colaborativo entre usuários e mercados | Não tem | Estaduais e privados têm | Lacuna principal: é o que gera economia imediata |
| App nas lojas, push, widget | Não tem (Bloco I) | Todos | Lacuna de aquisição e retenção |
| Dados sob regras próprias | Sim, mas sem política de privacidade | Estaduais exigem cadastro no programa | Hoje é risco, não ativo |

[RECOMENDAÇÃO] Posicionamento defensável: "seu custo de vida no supermercado, medido por você" (inflação pessoal, histórico, família), não "o app que acha o mais barato". Na segunda disputa, o governo e os apps de NFC-e chegaram antes e têm base de dados que o app não tem.

## 4. NFC-e por QR code × OCR

- [FATO] Não há API nacional pública de consulta de NFC-e; cada UF mantém portal próprio. As SEFAZ de ES, PR e SP publicam as URLs de consulta por QR code. A consulta por chave de acesso (44 dígitos) pede captcha. [16][17]
- [FATO] Os apps privados dizem que "cada estado precisa ser ensinado ao app" (cobertura variável); um cobre só o RJ, outro diz cobrir qualquer estado. [11] Nenhuma lista oficial e atual de cobertura por UF foi achada.
- [HIPÓTESE] Um navegador provavelmente não consegue ler a página da SEFAZ de outro domínio (política CORS); a consulta exigiria um servidor (Cloud Function, plano pago do Firebase). Isso quebra a premissa "sem backend". Verificar com um teste em 2 ou 3 UFs.
- [HIPÓTESE] O layout HTML muda sem aviso e por UF; o custo de manutenção é contínuo. Reforma tributária deve alterar leiautes de NFC-e [não verificado].
- [RECOMENDAÇÃO] Passo barato e compatível com o app sem backend: ler só o QR code na câmera (a chave de acesso já traz UF, mês, CNPJ do emitente, série e número). Isso preenche mercado e data sozinho e evita erro de digitação. Os itens continuam por OCR com revisão. Buscar os itens na SEFAZ (servidor) fica como fase 2, depois de teste jurídico e técnico.
- [RECOMENDAÇÃO] O argumento do PLANO ("não há API nacional") ainda vale para o cenário "uma integração só"; não vale como motivo para ignorar o QR code. Revisar a decisão.
- Fora do meu papel: viabilidade técnica, CORS, termos de uso das SEFAZ (ver seção 12).

## 5. Modelo de negócio e precificação

| Opção | Avaliação |
|---|---|
| Freemium R$ 9,90/mês ou R$ 69/ano (PLANO §6) | [HIPÓTESE] Alto para lista de compras. Âncoras: AnyList R$ 37,90/ano (≈ R$ 3,16/mês) [12]; Mobills R$ 99,90/ano (não confirmado) [15]. R$ 69/ano é ~1,8 vez o AnyList e a janela de justificativa é só a economia que o app provar. |
| Reposicionar preço | [RECOMENDAÇÃO] Testar R$ 29 a 39/ano e R$ 3,90/mês, só depois do piloto. Preço de teste, não de tabela. |
| Vitalício | [HIPÓTESE] Bom para caixa inicial, ruim para custo recorrente de leitura que cresce com o histórico. Só com limite de histórico. |
| Plano família | Já embutido: a família é a unidade de valor; cobrar por família, não por pessoa. |
| B2B2C com supermercados | [HIPÓTESE] Exige escala e dado de preço; inviável para um mantenedor sem base de usuários. Descartar agora. |
| Parcerias com fintech/fidelidade | [HIPÓTESE] Possível após tração (centenas de famílias ativas). Sem dados para estimar. |
| Dados agregados de preço | [FATO-LIMITE] Fora de escopo técnico. Impacto de negócio: vender dado de consumo exige base legal e anonimização efetiva (LGPD); risco reputacional alto para um produto sem política de privacidade. Não recomendo. |

Princípio de paywall [RECOMENDAÇÃO]: cobrar pelo que gera custo (histórico longo, famílias múltiplas), não pelo que é o gancho de aquisição. O OCR roda no navegador e não tem custo marginal; trancá-lo atrás de paywall reduz o uso do recurso que precisa de validação. A inflação pessoal é o diferencial; trancá-la cedo reduz o boca a boca.

O que precisa existir antes de cobrar [RECOMENDAÇÃO]:
1. Política de privacidade, termos de uso, exclusão de conta e exportação de dados (PLANO Bloco J: "não iniciado").
2. Meio de cobrança (pagamento é gatilho de escalonamento: exige aprovação do usuário e devsecops-engineer).
3. Canal de suporte e prazo de resposta.
4. Monitoramento de erro e análise de uso mínima.
5. Leitura de dados limitada (custo previsível).
6. Teste com os critérios do PLANO §5 e OCR validado (≥ 80% em 20 cupons, 3 mercados).
7. Lojas e push só se o piloto mostrar que a falta deles limita a retenção (PWA no iPhone só recebe push se instalado na tela inicial, iOS 16.4 ou superior [18]).

## 6. TCO por cenário

### 6.1 Premissas
| # | Premissa | Valor | Rótulo / fonte |
|---|---|---|---|
| P1 | Compras por família/mês | 4 | Briefing do Head |
| P2 | Itens por lista | 40 | Briefing do Head |
| P3 | Aparelhos por família | 2,5 | Briefing (2 a 3) |
| P4 | Aberturas do app por aparelho/mês | 20 | [HIPÓTESE] |
| P5 | Reabertura do listener após mais de 30 min fora gera releitura completa | sim | [HIPÓTESE], da documentação do Firestore (não consultável aqui; ver Não verificado) |
| P6 | `priceEntries` novas por família/mês | 160 (P1 × P2) | derivado |
| P7 | Documentos de itens ativos relidos por abertura | 80 | [HIPÓTESE] |
| P8 | Escritas por família/mês | 600 (4 × 126 + presença/edições ~100) | [HIPÓTESE] |
| P9 | Preço de leitura Firestore Standard | US$ 0,06 por 100 mil (limite superior dos valores públicos conhecidos); US$ 0,09 com margem de 1,5 vez para São Paulo | [HIPÓTESE]; fontes secundárias citam US$ 0,03 a 0,06 [19]; tabela de São Paulo não obtida |
| P10 | Escrita / armazenamento | US$ 0,18 por 100 mil escritas; US$ 0,18 por GiB-mês (x1,5 como margem) | [HIPÓTESE], valor de memória do modelo, não confirmado |
| P11 | Cota grátis diária | 50 mil leituras, 20 mil escritas, 1 GiB | [FATO] leituras, documentação oficial via busca [19]; demais [HIPÓTESE] |
| P12 | Hospedagem: grátis ~10 GB/mês; excedente US$ 0,15/GB | | [HIPÓTESE] |
| P13 | Câmbio | R$ 5,50 por US$ | [HIPÓTESE], não consultado |
| P14 | Apple Developer US$ 99/ano; Google Play US$ 25 uma vez | | [FATO] via guias de terceiros, não oficial [20] |
| P15 | Valor da hora do mantenedor | R$ 100 | [HIPÓTESE], custo de oportunidade, não saída de caixa |
| P16 | Tickets de suporte | 2% das famílias/mês, 15 min cada | [HIPÓTESE] |
| P17 | Conversão para Pro | 2% / 4% / 7% | [HIPÓTESE], sem benchmark com fonte |
| P18 | Receita média por pagante | R$ 7,41/mês = 60% anual (R$ 5,75) + 40% mensal (R$ 9,90) | [HIPÓTESE] |
| P19 | Desconto de taxas de loja/pagamento/impostos sobre a receita | 20% | [HIPÓTESE] |

### 6.2 Cálculo de leituras por família
Leituras/mês = aberturas × (itens + priceEntries(t) + purchases(t)) + atualizações em tempo real.
- aberturas = 2,5 × 20 = 50; priceEntries(t) = 160·t; purchases(t) = 4·t; atualizações = 600 escritas × 2 outros aparelhos = 1.200.
- Leituras(t) = 50 × (80 + 164·t) + 1.200 = 5.200 + 8.200·t.
- t=1: 13 mil · t=12: ~104 mil · t=24: ~202 mil · t=36: ~300 mil. Cresce sem teto: este é o ponto frágil de custo.
- Custo por família no mês 12: 104 mil × US$ 0,06/100 mil = US$ 0,062 (R$ 0,34); com margem de 1,5 vez, R$ 0,51.

### 6.3 Resultado mensal (histórico médio de 12 meses)
| Item | (a) 1 família | (b) 1.000 famílias | (c) 20.000 famílias |
|---|---|---|---|
| Leituras/mês | 104 mil (3,5 mil/dia, dentro da cota grátis de 50 mil/dia) | 104 milhões | 2,07 bilhões |
| Firestore leituras, como está | R$ 0 | (104 mi − 1,5 mi grátis) × US$ 0,06 a 0,09/100 mil = US$ 61 a 92 = **R$ 336 a 505** | US$ 1.243 a 1.865 = **R$ 6.800 a 10.300** |
| Firestore leituras, otimizado (hipótese de −85%: janela de 90 dias + agregados) | R$ 0 | R$ 50 a 75 | R$ 1.000 a 1.500 |
| Escritas | R$ 0 | ~R$ 0 (600 mil/mês ≈ cota) | 11,4 mi × US$ 0,18 a 0,27/100 mil = R$ 113 a 170 |
| Armazenamento (~3 MB/família com índices) | R$ 0 | 3 GB, ~R$ 2 a 3 | 60 GB, ~R$ 58 a 88 |
| Hospedagem (transferência) | R$ 0 | ~R$ 0 | ~150 GB: ~R$ 115 |
| Autenticação | R$ 0 | R$ 0 | R$ 0 mas no limite: 20 mil famílias × 2,5 = 50 mil usuários ativos; confirmar o teto do plano sem custo [HIPÓTESE] |
| Lojas | R$ 0 (continua PWA) | R$ 45/mês (US$ 99/ano) + US$ 25 uma vez | idem |
| **Infraestrutura total, como está** | **R$ 0** | **R$ 340 a 510** | **R$ 7.100 a 10.700** |
| **Infraestrutura total, otimizado** | **R$ 0** | **R$ 100 a 125** | **R$ 1.300 a 1.900** |
| Manutenção (horas/mês, com IA) | 4 h | 20 h | 60 h |
| Suporte (horas/mês) | ~0 | 5 h (20 tickets) | 100 h (400 tickets) |
| Tempo do mantenedor a R$ 100/h | R$ 400 (não é caixa) | R$ 2.500 | R$ 16.000 |
| Jurídico/LGPD, único | R$ 0 | R$ 3.000 a 10.000 [HIPÓTESE] | R$ 3.000 a 10.000 + possível encarregado de dados e seguro [HIPÓTESE] |

### 6.4 Receita e resultado (Pro a R$ 7,41 por pagante, 80% líquido)
| | (b) 1.000 famílias | (c) 20.000 famílias |
|---|---|---|
| Pagantes 2% / 4% / 7% | 20 / 40 / 70 | 400 / 800 / 1.400 |
| Receita líquida/mês (n × 7,41 × 0,8) | R$ 119 / 237 / 415 | R$ 2.371 / 4.742 / 8.299 |
| Resultado em caixa, base 4%, infra como está | 237 − 510 − 45 ≈ **−R$ 320** | 4.742 − 10.700 ≈ **−R$ 6.000** |
| Resultado em caixa, base 4%, infra otimizada | 237 − 125 ≈ **+R$ 110** | 4.742 − 1.900 ≈ **+R$ 2.800** |
| Resultado com tempo a R$ 100/h, base, otimizado | 237 − 125 − 2.500 ≈ **−R$ 2.400** | 4.742 − 1.900 − 16.000 ≈ **−R$ 13.200** |
| Conversão necessária para cobrir só a infra | como está: ~7% · otimizado: ~1,5% | como está: ~7,5% · otimizado: ~1,3% |

[HIPÓTESE] Conclusão: sem otimizar a leitura, a assinatura não paga nem a infraestrutura. Otimizada, ela paga a infraestrutura e deixa uma sobra pequena; não paga o tempo de uma pessoa até as dezenas de milhares de famílias. Alcançar 20 mil famílias sem verba de aquisição é, por si só, uma premissa otimista.

## 7. Riscos
| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Custo de leitura sem teto (assinatura de todo o histórico) e sem alerta de custo (PLANO Bloco J pendente); no plano pago do Firebase um erro pode virar cobrança alta | Média | Alto | Janela de leitura, agregados, alerta de orçamento antes de qualquer usuário externo (software-architect) |
| R2 | Dados pessoais de consumo sem política de privacidade; regras de segurança já falharam em produção (PLANO Rev. 8: regras nunca publicadas direito) | Média | Alto (reputação e legal) | Pacote mínimo de privacidade e teste de regras no emulador antes do piloto (devsecops-engineer) |
| R3 | OCR sem validação com cupom real; falha mina o diferencial | Alta | Médio | Medir em 20 cupons, 3 mercados; QR code como apoio |
| R4 | Concorrência: apps estaduais grátis e apps de NFC-e já cobrem preço colaborativo; big techs (Google Keep/Tarefas) cobrem lista simples | Alta | Médio | Não competir em preço colaborativo; focar na camada pessoal e família |
| R5 | Único mantenedor (abandono, férias, doença) | Média | Alto num produto pago | Piloto grátis com aviso de beta; contrato de nível de serviço só depois de ter suporte |
| R6 | Dependência de Firebase: mudança de preço ou de cota, difícil sair do Firestore | Baixa a média | Médio | Camada de repositório já existe (interface `repository.ts`); registrar custo de saída no ADR |
| R7 | Sem lojas nem push: barreira de aquisição e retenção | Alta | Médio | Medir no piloto antes de investir em Bloco I (3 a 4 blocos) |
| R8 | Fricção de cobrança e consumidor (direito de arrependimento, nota fiscal, imposto) | Média | Médio | Jurídico antes de cobrar (usuário) |
| R9 | Scraping de SEFAZ: termos de uso e quebra de layout | Média | Médio | Não fazer na fase 1 |

## 8. Impacto potencial
- Para a família [HIPÓTESE]: economia de R$ 20 a 60/mês, vinda de (i) comparar mercados com o próprio histórico e (ii) menos compra repetida. Não encontrei estudo brasileiro que valide percentual de economia por app de lista. O benchmark de desperdício vem do UNEP via Embrapa: 94 kg/pessoa/ano de alimentos desperdiçados em casa, mas o número tem sinais conflitantes de publicação; só o recorte comestível de um piloto no Rio de Janeiro (29 kg/pessoa/ano) é bem delimitado [21]. Sem verificação, use para contexto, não para promessa.
- Teste prático: medir no piloto a variação do valor pago por item recorrente (R$/unidade) entre mercados usados pela mesma família.
- Social [HIPÓTESE]: a inflação pessoal mostra à família o que subiu no seu carrinho, diferente do IPCA médio. Com alimentação subindo 1,01% no domicílio em outubro [3], há uma narrativa de educação financeira honesta. Não prometer cálculo oficial: é índice próprio, não substitui IPCA.

## 9. Cenários e recomendação

| | 1. Pessoal/portfólio | 2. Piloto grátis de nicho (recomendado) | 3. Produto pago |
|---|---|---|---|
| Investimento | ~4 h/mês; R$ 0 de caixa | ~30 a 40 h de preparação + ~8 h/mês; caixa R$ 0 a 50/mês [HIPÓTESE] | R$ 3 a 10 mil jurídico + R$ 700 lojas no 1º ano + ~150 a 250 h (Blocos I e J do PLANO, 8 a 10 blocos) |
| Prazo | contínuo | 90 dias + 2 a 3 semanas de preparação | 4 a 6 meses até cobrar |
| Risco | Baixo; produto de vitrine sem dados de mercado | Médio: exposição de dados de terceiros (mitigada em R2) | Alto: custo de infra, suporte e jurídico antes de validar demanda |
| Retorno | Utilidade familiar e vitrine para a Prumo | Aprendizado, evidência de demanda, vitrine | Receita pequena: base R$ 237/mês com 1.000 famílias (ver 6.4) |

**Decisão sugerida [RECOMENDAÇÃO]:** cenário 2, em modo de piloto limitado, e voltar ao cenário 1 se o critério de go/no-go falhar. Não escolher o cenário 3 agora.

Por quê:
1. [HIPÓTESE] A economia depende do custo de leitura, que hoje cresce sem teto e pode superar a receita de 4% de conversão (6.4).
2. [FATO] O ganho de preço colaborativo já é gratuito no mercado; a demanda pela camada pessoal não foi testada [11][7].
3. [FATO] Produto em produção com dados pessoais e sem política de privacidade, com histórico de falha de regras (PLANO Rev. 8): o pior momento para cobrar.

**Pacote mínimo antes do piloto** (o product-manager prioriza): política de privacidade e exclusão de conta; alerta de orçamento e limite de leitura; análise de uso respeitosa à privacidade (cobrindo ativação, W4, compras/mês); coleta e medição de 20 cupons reais.

**Go/no-go no dia 90** (todos os critérios, medidos com análise de uso):
| Métrica | Go | Observação |
|---|---|---|
| Famílias ativas (≥ 1 compra finalizada) | ≥ 50 | recrutamento manual; o PLANO usa metas de ativação ≥ 40% e W4 ≥ 25% (§5) |
| Retenção na 4ª semana | ≥ 25% | meta do PLANO §5 |
| Compras finalizadas/família/mês | ≥ 3 | North Star do PLANO §5 |
| Famílias com 2+ membros ativos | ≥ 30% | PLANO §5 |
| OCR em cupom real | ≥ 80% | PLANO §5 |
| Intenção de pagar (teste de porta falsa: botão "Assinar Pro" que registra o clique, sem cobrar) | ≥ 5% dos ativos clicam; entrevista com 10 deles sobre R$ 3,90/mês e R$ 29/ano | [HIPÓTESE] limiar |
| Custo de leitura | ≤ R$ 0,50 por família/mês | alvo para viabilizar 4% de conversão |
Falhou em dois ou mais: voltar ao cenário 1 (sem custo). Passou: abrir cenário 3 em versão enxuta, com preço testado.

## 10. Decisões para o usuário (máximo 3 opções, uma recomendada)
**D1. Qual trajetória do produto?**
- A (recomendada): piloto grátis de 90 dias com 50 a 100 famílias, depois go/no-go. Efeito: caixa quase zero, evidência real de demanda, esforço de 2 a 3 semanas de preparação.
- B: manter pessoal. Efeito: custo zero, nenhuma evidência de mercado, sem exposição de dados de terceiros.
- C: já cobrar. Efeito: exige jurídico, pagamento, lojas e suporte; risco de pagar para descobrir que não há demanda.

**D2. Quem pode ver o produto no piloto?** (depende de D1=A)
- A (recomendada): convite por indicação, até 100 famílias, com aviso de beta. Efeito: suporte administrável.
- B: público aberto com divulgação. Efeito: mais dados, mas custo e suporte sem teto.
- C: só você e família. Efeito: igual ao cenário 1.

**D3. Custo recorrente novo.** Aprovar a conta Blaze (se ainda no Spark) com alerta de orçamento? [Gatilho de escalonamento: custo recorrente.]
- A (recomendada): sim, com limite de alerta de R$ 50/mês e janela de leitura antes de abrir o piloto.
- B: continuar no plano sem custo e limitar o piloto a 30 famílias. Efeito: o app para de ler ao atingir a cota.
- C: adiar. Efeito: o piloto fica parado.

## 11. Fontes (consultadas em 2026-11-09)
1. IPCA setembro de 2026 (+0,82%, 12 meses +4,58%): https://brasil61.com/n/ipca-sobe-0-82-em-setembro-pressionado-pela-energia-eletrica-e-pelos-alimentos-bras2617281 (apenas resumo de busca; página não aberta)
2. CNA, comunicado técnico do IPCA, 14/out/2026 (alimentação e bebidas +4,66% em 12 meses): https://cnabrasil.org.br/storage/arquivos/files/Ed.18-CT-IPCA-IPCA-14.OUT.2026.pdf (resumo de busca; PDF não aberto)
3. IPCA-15 de outubro de 2026: https://investidor10.com.br/noticias/ipca-15-precos-sobem-0-32-em-outubro-puxados-por-alimentacao-123446/ e https://static.poder360.com.br/uploads/2026/10/ipca_15_2026_out.pdf (resumo de busca)
4. Vindi/Opinion Box, Relatório Assinaturas 2026: https://canaltech.com.br/mercado/quase-50-dos-brasileiros-gastam-mais-de-r-100-com-assinaturas-por-mes/ (resumo de busca)
5. Bango, Relatório Assinaturas 2024: https://mercadoeconsumo.com.br/10/06/2024/economia/brasileiros-gastam-em-media-r-1-416-em-assinaturas-digitais-por-ano/
6. Nota Fiscal Gaúcha, 11 anos: https://www.coad.com.br/home/noticias-detalhe/120083/nota-fiscal-gaucha-completa-11-anos-com-mais-de-3-milhoes-de-cidadaos-participantes
7. Menor Preço Nota Gaúcha, 7 anos: https://estado.rs.gov.br/aplicativo-menor-preco-nota-gaucha-do-governo-do-estado-chega-a-sete-anos-levando-mais-economia-em-tempo-real-aos-consumidores
8. Menor Preço Paraná: https://www.parana.pr.gov.br/Noticia/Aplicativo-Menor-Preco-ajuda-economizar-tambem-durante-pandemia
9. Nota Paraná, 23 milhões de cadastros: https://www.bemparana.com.br/noticia/programa-nota-parana-chega-aos-tres-anos-com-mais-de-23-milhoes-de-cadastros
10. Menor Preço Brasil no ES: https://sefaz.es.gov.br/sefaz-adota-menor-preco-brasil-como-unico-apl
11. Apps privados de NFC-e (páginas promocionais): https://economiza.club/ · https://compareacompra.com/ · https://superlistaadm-dev.github.io/ · https://anotadissimo.app/ · https://buscapreco.net/ · https://economizaai.app/ · https://consumidormoderno.com.br/9-aplicativos-economizar-compras/
12. AnyList na App Store BR: https://apps.apple.com/br/app/id522167641
13. Bring! Premium: https://www.mobiflip.de/?p=401895
14. Listonic: https://listonic.com/compare-apps/listonic-vs-bring
15. Mobills (agregador): https://us.fitgap.com/products/mobills-personal-finance
16. SEFAZ-ES, QR code NFC-e: https://sefaz.es.gov.br/qr-code
17. SEFAZ-PR, QR code NFC-e: https://sped.fazenda.pr.gov.br/NFCe/Pagina/QR-Code · SEFAZ-SP: https://portal.fazenda.sp.gov.br/servicos/nfce/Paginas/WebServices.aspx
18. Push web em iOS (16.4+, tela inicial): https://documentation.onesignal.com/docs/web-push-for-ios
19. Firestore, preço e cota grátis (acesso à página oficial bloqueado; resumo de busca): https://firebase.google.com/docs/firestore/pricing · https://cloud.google.com/firestore/pricing
20. Taxas Apple e Google (guias de terceiros): https://magora-systems.com/apple-developer-fee/ · https://magora-systems.com/google-play-developer-account-cost/
21. UNEP Food Waste Index 2024 via Embrapa: https://embrapa.br/busca-de-noticias/-/noticia/87972089/world-squanders-over-1-billion-meals-a-day-according-to-un

## 12. Fora do meu papel
- Prioridade e escopo do pacote mínimo e do piloto: product-manager.
- Otimização de leitura, janela de histórico, agregados, CORS e viabilidade de buscar NFC-e: software-architect.
- LGPD em detalhe, regras de segurança, exclusão de dados, enquadramento de agente de pequeno porte: devsecops-engineer.
- Métricas de análise de uso (definição, fonte, cálculo): data-bi-engineer.
- CNPJ/MEI, tributação, direito de arrependimento, termos de uso das SEFAZ, contrato com lojas: usuário e jurídico.

## 13. Não verificado
- Preços oficiais do Firestore e Hosting em São Paulo e a cota do plano de Auth: bloqueados pela rede da sessão (firebase.google.com e cloud.google.com sem tabela). Procedimento: abrir a página oficial, localizar "southamerica-east1" na tabela do Firestore Standard, atualizar P9 a P12 e recalcular 6.3.
- Se o projeto Firebase está no Spark ou no Blaze: conferir no console (Uso e faturamento).
- Comportamento de cobrança de leituras na reconexão de listener (P5): confirmar na documentação "Understand Cloud Firestore billing".
- Preços de Listonic, Bring!, Organizze e dos apps de NFC-e em reais, e sua cobertura por UF: conferir nas lojas brasileiras e nos sites.
- IPCA: os dados de 12 meses vêm de notícias e do CNA, não da tabela do IBGE (SIDRA).
- Câmbio, valores de jurídico, conversão, aberturas por mês, escritas e leituras por família: todas hipóteses. Calibrar com 30 dias de uso real no piloto.
- Cálculos conferidos à mão; sem planilha. Recomendo montar uma planilha com P1 a P19.
