# Diagnóstico de produto: Compra Planejada (v5.0.0)

Data: 2026-11-09 · Autor: product-manager · Método: leitura de README, PLANO-EVOLUCAO-PRODUTO.md (rev. 8), `src/App.svelte`, `TelaOnboarding.svelte`, `EntradaRapida.svelte`, `stores/app.svelte.ts` e busca por termos em `src/`. Sem execução, sem usuários ouvidos, sem capturas de tela.
Rótulos: [FATO] com origem · [HIPÓTESE] · [RECOMENDAÇÃO]. Demanda sem issue ainda (N2, análise).

## 1. Resumo

- [FATO] O app cobre o ciclo lista, compra, finalização e preço, e o ciclo funciona de ponta a ponta (PLANO §inventário; `App.svelte:536-537`).
- [HIPÓTESE] O núcleo que precisa ser excelente é: abrir, adicionar item em segundos e comprar em família com a lista sincronizada. O resto (preços, insights, OCR) é camada de valor secundária que só importa depois de 3 ou 4 compras finalizadas.
- [FATO] O produto nunca foi medido: não há analytics nem contadores (Head, 2026-11-09; `grep` de `analytics|logEvent|gtag` em `src/` não retorna nada). A tabela de métricas do PLANO §5 marca "Medindo? ✅" sem mecanismo.
- [FATO] O plano gastou 4 rodadas (6 a 8) corrigindo ligação entre lógica e tela, e a rev. 8 achou um bug que bloqueava dados reais em produção (PLANO §1, rev. 8). O maior risco do produto hoje é confiabilidade, não falta de função.
- [RECOMENDAÇÃO] Antes do bloco I (lojas): (1) provar em produção que o básico funciona, (2) instrumentar o mínimo, (3) testes contra o emulador do Firestore, (4) lembrete de recompra e itens frequentes de um toque (o que o usuário sente). Congelar funções novas de periferia (mapa, mais papéis, mais modais).
- A decisão "uso pessoal ou mercado" (PLANO §7.1) governa metade do roadmap. Sem ela, bloco I e LGPD completa são apostas.

## 2. Problema, público e núcleo do produto

**Problema (uma frase, sem solução):** pessoas que dividem as compras da casa esquecem itens, compram em duplicidade e não sabem se estão pagando mais caro do que antes. [HIPÓTESE: nenhuma dessas três dores foi validada com usuário; vêm do PLANO e do onboarding.]

**Dores em ordem de frequência provável [HIPÓTESE]:**
1. Esquecer item ou comprar duplicado (acontece toda compra).
2. Dividir a tarefa: quem vai, o que já foi pego (acontece em toda casa com 2+ adultos).
3. Saber quanto gasta e se os preços sobem (mensal, exige disciplina de registrar valor).
4. Comparar mercados (raro; exige 3+ compras em mercados distintos).

**Usuário primário [HIPÓTESE]:** adulto que faz a compra da casa pelo celular, em casal ou família de 2 a 4 pessoas, no Brasil. O autor é o usuário atual (PLANO §7.1: uso pessoal aparente). Usuário secundário: o outro adulto, que quer só ver e marcar itens (papel que o app trata com 3 papéis).

**Três produtos em um?** Sim. [FATO] O PLANO descreve lista colaborativa (G), controle de gastos e preço (H1/H2/H4) e leitor de cupom (H3). O onboarding promete os três em 4 passos (`TelaOnboarding.svelte:13-34`).

**Núcleo (precisa ser excelente):** entrada rápida, lista sincronizada em tempo real, modo compra, finalizar. Metas: ≤ 8 s do abrir ao item na lista (PLANO §5).
**Camada de valor (boa o bastante, alimentada pelo núcleo):** histórico, preço por item, lista sugerida, recorrentes.
**Periferia (manter sem investir):** cupom por OCR, inflação pessoal, ordem de corredores, PDF, mover lista, 3 papéis, mapa.

**Jobs-to-be-done:**
| Job | Fluxo atual | Toques estimados | Avaliação |
|---|---|---|---|
| Anotar o que falta, quando lembro | abrir, digitar, Enter | 3 a 4 após o app abrir [HIPÓTESE; `EntradaRapida.svelte`] | Bom. Falta itens de um toque (ver F1) |
| Comprar sem esquecer | Modo compra, tocar item | 1 por item | Bom (`App.svelte:536`) |
| Saber o que o outro já pegou | presença + sincronização | 0 | Bom [FATO: presença no PLANO] |
| Fechar a compra e registrar gasto | Finalizar, pendentes, valor, mercado | 4 a 6 | Médio: 2 modais em sequência (`App.svelte:301-310`) |
| Lembrar de comprar o que acaba | Insights (abrir 💡 e ler) | 2 + leitura | Fraco: exige iniciativa; não há lembrete |

## 3. Pontos fortes

- [FATO] Entrada por texto, lote e voz com categorização automática (`EntradaRapida.svelte`; PLANO).
- [FATO] "Usar sem conta" reduz atrito de entrada (`App.svelte:157-163`).
- [FATO] Modo compra com Wake Lock e presença: diferencial real de uso em campo (PLANO, Modo compra).
- [FATO] Leitura de cupom nunca grava sem confirmação item a item (README, decisões). Postura correta para dado financeiro.
- [FATO] Lista sugerida só como candidatos, sem gravar sozinha (PLANO, H5).
- [FATO] Domínio testado (132 testes, Head, 2026-11-09) e deploy com portão de qualidade (PLANO).

## 4. Pontos fracos

| # | Sev. | Achado | Evidência | Recomendação |
|---|---|---|---|---|
| P1 | Alto | Nenhuma medição de uso; a tabela §5 afirma "Medindo ✅" sem mecanismo | Head 2026-11-09; PLANO §5 | Corrigir a tabela já; implementar medição mínima (seção 5) |
| P2 | Alto | Falha recorrente "passa nos testes, quebra em produção"; `FirestoreRepository` sem teste de integração | PLANO §3.1 e §4; pendência 8 | Testes com emulador antes de qualquer função nova; é o item 1 do backlog |
| P3 | Alto | Promessa do onboarding sem entrega: "avisa quando algo está na hora de recomprar" mas não existe notificação nem lembrete (previsão só aparece se o usuário abrir 💡) | `TelaOnboarding.svelte:32`; busca `Notification` em `src/` sem resultado | Entregar lembrete simples (F4) ou trocar o texto; hoje é promessa não cumprida |
| P4 | Médio | Entrada rápida não sugere itens já usados: `conhecidos` serve só para categoria, sem autocompletar | `EntradaRapida.svelte:25,78` | Itens frequentes e sugestão ao digitar (F1) |
| P5 | Médio | Cabeçalho e telas carregam 4 emojis sem texto (💰 💡 📷 🕘) e uma pílula de escopo; 13 estados de modal no tipo `modalAberto` | `App.svelte:509-514`, `:60` | Menu com rótulo; mover "Preços, Insights, Cupom" para uma área "Gastos" (encaminhar a ui-product-design) |
| P6 | Médio | 4 ações secundárias fixas sob a lista (mover, corredores, PDF, compartilhar) disputam atenção com as 2 principais | `App.svelte:539-544` | Reduzir a "Compartilhar" visível; resto em menu "mais" |
| P7 | Médio | Nome inconsistente: título "Compra Planejada", onboarding e manifest "Compras" | `App.svelte:485`; `TelaOnboarding.svelte:16`; PLANO rev. 6 | Escolher um nome (decisão do usuário, D3) |
| P8 | Médio | Tema escuro existe no estado e é aplicado, mas não há alternador; `ocultarComprados` do estado também sem alternador na lista (só no modo compra, com estado próprio) | `stores/app.svelte.ts:36-37`; `App.svelte:188,529`; `ModoCompra.svelte:25` | Alternador de tema ou remover; unificar "ocultar comprados" |
| P9 | Médio | LGPD não iniciada com dados reais de famílias já em produção (e-mail, nomes, hábito de compra, presença) | PLANO inventário "Qualidade e operação" | Política de privacidade e exclusão de conta antes de convidar terceiros |
| P10 | Médio | OCR validado só com cupom simulado; meta ≥ 80% sem dado real; NFC-e traz QR code com chave de acesso e a decisão de descartá-lo foi tomada por falta de API nacional | PLANO H3 e §2; busca por `qr` em `src/` só toca `roles.ts`/`receipt-parse.ts` | Medir com 20 cupons reais (não-código) antes de promover; avaliar QR como alternativa (a decisão técnica fica com software-architect) |
| P11 | Médio | Sem busca de item, sem categorias editáveis e sem orçamento por compra ou mês | `App.svelte` (nenhum campo de busca); PLANO | Baixo custo para busca; orçamento só se o público for controle de gasto (backlog) |
| P12 | Baixo | Mapa não portado; PDF e mover lista com valor incerto | PLANO pendência 19 | Não portar mapa; manter o resto, sem evolução |
| P13 | Baixo | Planos escritos como ata de revisões (rev. 1 a 8) em arquivo único, difíceis de ler como roadmap; o inventário mistura "feito" com narrativa | PLANO inteiro | Separar roadmap curto (`docs/produto/roadmap.md`) do histórico |

## 5. Métricas propostas

Princípio: contadores agregados e anônimos, sem conteúdo de lista, sem identificador de pessoa fora do que o Firestore já guarda. [RECOMENDAÇÃO]

Fonte barata, sem SDK novo: dados que o app já grava (`purchases`, `lists/items`, `households`) mais um campo `criadoEm` de conta e de família; consulta feita por script administrativo, sem enviar a terceiros. Isso evita novo serviço externo (que seria linha vermelha) e cobre as métricas 1 a 4. As métricas 5 e 6 pedem um contador novo.

| Métrica | Definição | Fonte | Regra de cálculo | Linha de base |
|---|---|---|---|---|
| **North Star: compras concluídas por domicílio ativo por 28 dias** | Domicílio ativo = tem 1+ compra finalizada nos 28 dias | `purchases` (data, dono, lista) | `compras em 28d ÷ domicílios com 1+ compra em 28d`; dono = família ou usuário | Lacuna; calcular retroativo (compras são imutáveis e com data) |
| Ativação | % de contas novas com 1ª compra finalizada em 7 dias | `purchases` + data de criação da conta (Auth) | `contas com compra ≤ 7d ÷ contas criadas no período` | Lacuna; retroativo possível |
| Colaboração | % de famílias com 2+ membros que marcaram item ou finalizaram compra em 28d | `lists/items` (`boughtBy`, `addedBy`) | `famílias com ≥ 2 uids distintos em boughtBy/addedBy ÷ famílias com compra` | Lacuna; retroativo parcial |
| Retenção W4 | % de contas que têm compra na semana 4 a 5 após criação | `purchases` + data da conta | `contas com compra entre dia 22 e 35 ÷ contas criadas há ≥ 35 dias` | Lacuna; retroativo |
| Atrito de entrada | Mediana de segundos do foco na entrada ao item gravado | Contador local no aparelho (não enviado) ou teste cronometrado | Só vale em teste moderado com 5 pessoas | Meta ≤ 8 s sem medição |
| Qualidade do OCR | % de itens do cupom aceitos sem edição | Teste manual com 20 cupons reais, 3 mercados | `itens aceitos sem edição ÷ itens lidos` | Lacuna; só simulado |
| Confiabilidade | Incidentes de perda de dados e erros "permission-denied" | Registro de erros (Sentry ou equivalente, decisão do devsecops-engineer) | Contagem por semana; meta 0 | Lacuna |

**Crítica da tabela §5 atual:**
- "Medindo? ✅" em North Star, ativação e colaboração é falso hoje (Head, 2026-11-09). Corrigir para ⬜ até haver consulta.
- A meta "North Star ≥ 3 compras por família por mês" não tem justificativa registrada. [HIPÓTESE: compras semanais seriam ~4; 3 é plausível, mas sem base.]
- "Paridade v5" mede o passado (corte já feito), não resultado de usuário; retirar.
- "Confiabilidade 0 incidentes" não tem fonte; sem monitoramento de erro, 0 significa "não sei".
- Falta métrica de valor da camada de preço (ex.: % de compras finalizadas com valor pago informado), que é o que justifica o "Pro".

## 6. Backlog priorizado (RICE qualitativo)

Escala: Alcance (A), Impacto (I), Confiança (C), Esforço (E) em A/M/B. Sem dados de uso, tudo é [HIPÓTESE]; a confiança reflete isso.

| ID | Melhoria | A | I | C | E | Cenário pessoal | Cenário mercado |
|---|---|---|---|---|---|---|---|
| F0 | Confirmar em produção o roteiro de verificação (runbook Parte 5) e corrigir a tabela de métricas | A | A | A | B | Agora | Agora |
| F1 | Itens frequentes de um toque + autocompletar ao digitar | A | A | M | B | Agora | Agora |
| F2 | Testes de integração com emulador do Firestore (regras e escopo) | A | A | A | M | Agora | Agora |
| F3 | Medição mínima (consulta administrativa; seção 5) | A | M | A | B | Agora | Agora |
| F4 | Lembrete de recompra (notificação local ou aviso ao abrir) | A | A | M | M | 3 meses | 3 meses |
| F5 | Corrigir promessa do onboarding e nome único do produto | A | B | A | B | Agora | Agora |
| F6 | Simplificar cabeçalho e ações (menu com rótulo; fechar P5/P6) | A | M | M | M | 3 meses | 3 meses |
| F7 | Validar OCR com 20 cupons reais; decidir manter, melhorar ou trocar por QR NFC-e | M | A | M | M | 3 meses | 3 meses |
| F8 | Compartilhar lista por link sem conta (visualizar e marcar) | M | A | B | A | Não | 3 meses (reduz fricção do 2º usuário) |
| F9 | LGPD: política, exportação e exclusão de conta | M | A | A | M | Opcional | Obrigatório antes de abrir ao público |
| F10 | Orçamento por compra e alerta ao ultrapassar | M | M | B | M | 6 a 12 meses | 6 a 12 meses |
| F11 | Busca na lista e categorias editáveis | M | B | M | B | 6 a 12 meses | 3 meses |
| F12 | Alternador de tema e limpeza de estado morto (P8) | B | B | A | B | 4 semanas se sobrar tempo | idem |
| F13 | Monitoramento de erro em produção | A | M | A | B | 3 meses | Agora |
| F14 | Empacotar para lojas (Capacitor) | M | M | B | A | Não | 6 a 12 meses, depois de F4, F8, F9 |
| F15 | Modo desktop (layout largo) | B | B | B | M | Não | 6 a 12 meses |

**Horizontes:**
- **Próximas 4 semanas (ambos os cenários):** F0, F5, F1, F2, F3, F12. Saída: o básico comprovado, a lista mais rápida e a base de medição. Congelar mapa, novos papéis e novos modais.
- **3 meses, uso pessoal:** F4, F6, F7, F13. Sem lojas, sem LGPD completa (basta aviso de privacidade se houver terceiros na família).
- **3 meses, mercado:** F4, F6, F7, F9, F13, F8 (se a medição mostrar que o convite por código é barreira). Decisão de limite de membros no grátis (PLANO §7.4) fecha aqui.
- **6 a 12 meses, uso pessoal:** F10 e F11 conforme uso real. Parar aí.
- **6 a 12 meses, mercado:** F14, F10, F11, F15, e paywall do Pro apenas depois que ativação e retenção W4 existirem com número.

**Crítica do roadmap atual (blocos I e J):**
1. [RECOMENDAÇÃO] Bloco I (lojas, 3 a 4 blocos) antes de saber se existe público é a maior aposta de esforço do plano. Só faz sentido se a decisão for "mercado" e depois que a retenção estiver medida.
2. Bloco J mistura itens de naturezas distintas. Testes de integração e monitoramento de erro são pré-requisito (risco). LGPD é pré-requisito só se houver usuário que não seja o autor. Analytics, feature flags e reduzir bundle são otimizações.
3. O PLANO já reconhece que testes de integração subiram de prioridade (§4). Concordo e vou além: nada de função nova antes de F2 e F0.
4. "Push de verdade" (FCM + função em nuvem) é caro; um lembrete ao abrir o app ou notificação local cobre 70% do valor [HIPÓTESE] com 10% do custo. A escolha técnica é do software-architect.

## 7. Critérios de aceite dos 3 primeiros incrementos

Ordem: F0+F5 (confiança e coerência), F1 (valor percebido), F2 (risco). Medição (F3) entra junto a F0 como tarefa de apoio.

### Incremento 1: Verificação em produção e verdade sobre as métricas (F0, F5, F3)
Problema: o time acredita que o básico funciona e que mede, sem prova.
- Dado uma conta nova com Google, quando entro, crio lista, adiciono 3 itens, ativo o modo compra, marco 2 itens e finalizo informando valor e mercado, então a compra aparece no histórico com o valor e o mercado informados e o item pendente é oferecido para nova lista.
- Dado duas contas na mesma família (editor e só leitura), quando o editor marca um item, então o aparelho do outro mostra a mudança em até 5 s e a conta de leitura não consegue marcar nem remover.
- Dado o app instalado e sem rede, quando adiciono um item e volto à rede, então o item aparece no outro aparelho sem duplicar.
- Dado o PLANO §5, quando revisado, então nenhuma métrica marca "Medindo ✅" sem apontar a consulta ou o arquivo que a calcula, e o ficheiro `docs/produto/metricas.md` traz definição, fonte, regra e linha de base para as 5 primeiras linhas da seção 5.
- Dado o onboarding e o cabeçalho, quando leio o nome do produto, então é o mesmo em ambos e no manifest; e nenhuma frase promete aviso de recompra enquanto F4 não existir.
- Fora de escopo: novas telas, notificações, analytics de terceiros, LGPD completa.

### Incremento 2: Itens frequentes e autocompletar (F1)
Problema: adicionar item recorrente de toda semana exige digitar de novo.
- Dado um histórico de itens (`itemStats`) com 10 itens usados, quando abro a lista e foco a entrada vazia, então vejo até 8 itens mais frequentes não presentes na lista, e tocar um adiciona 1 unidade em 1 toque.
- Dado que digito "to", quando há "tomate" e "toalha" no histórico, então vejo sugestões ordenadas por frequência, e tocar uma sugestão adiciona com a categoria e unidade usadas antes.
- Dado um item já presente e não comprado na lista, quando toco o frequente correspondente, então o app não duplica (usa a consolidação existente) e mostra aviso curto.
- Dado papel "só leitura", quando abro a lista, então não há sugestões nem botões de adicionar.
- Dado conta nova sem histórico, quando foco a entrada, então não aparece bloco vazio ou erro.
- Medição: tempo do toque no campo ao item na lista ≤ 8 s em teste cronometrado com 5 pessoas, 3 itens cada (linha de base: medir antes).
- Fora de escopo: categorias editáveis, busca na lista, sugestão baseada em preço, IA externa.

### Incremento 3: Testes de integração com o emulador (F2)
Problema: lógica nova passa nos testes, mas falha com as regras reais (PLANO §3.1).
- Dado o emulador do Firestore e as regras de `firestore.rules`, quando um teste executa criar lista pessoal, ler como dono, ler como outro usuário, então a leitura do outro é negada e a do dono funciona.
- Dado uma família com papéis, quando editor, só leitura e responsável tentam criar, marcar e remover item, então apenas os permitidos têm sucesso.
- Dado convite por código, quando entra um usuário com código válido, expirado e revogado, então só o válido adiciona o membro.
- Dado `purchases` e `priceEntries`, quando tento `update`, então é negado; `create` pelo dono é aceito.
- Dado o escopo pessoal recém-logado, quando o app consulta listas, então a consulta usa o uid autenticado (teste que teria falhado com o bug `owner.id = 'local'`).
- O CI executa a suíte do emulador antes do deploy e falha o pipeline se qualquer teste falhar.
- Fora de escopo: testes de interface (Playwright), mudar as regras além do que os testes revelarem, migrar dados.

## 8. Decisões para o usuário

**D1. O produto é de uso pessoal ou de mercado?** (bloqueia bloco I, LGPD e modelo de negócio)
- (a) Uso pessoal e familiar [recomendada para as próximas 4 semanas]: congelar lojas, LGPD e paywall; investir em F0 a F7. Efeito: menos esforço, risco baixo.
- (b) Mercado: manter F9, F8, F14 no roadmap e medir ativação e retenção antes de lançar. Efeito: mais 3 a 5 meses de esforço, custo recorrente possível.
- (c) Adiar a decisão por 8 semanas, medindo com F3 e usando com 3 famílias convidadas. Efeito: decide com dado, e o roadmap das 4 semanas é o mesmo.
Recomendo (c): as 4 primeiras semanas servem aos dois cenários.

**D2. O que fazer com o leitor de cupom (OCR)?**
- (a) Medir com 20 cupons reais e decidir depois [recomendada].
- (b) Esconder atrás de um rótulo "experimental" até medir. Efeito: reduz risco de dado errado.
- (c) Trocar por leitura do QR da NFC-e (escopo maior, exige parecer técnico). Efeito: potencialmente mais exato, esforço maior.

**D3. Nome do produto: "Compra Planejada" ou "Compras"?**
- (a) Compra Planejada, em todo lugar [recomendada: é o nome do repositório e da URL].
- (b) Compras (curto, mas genérico e difícil de achar).
- (c) Nome novo (só se houver D1-b).

**D4. Aprovar congelar o escopo (sem mapa, sem novos papéis, sem novos modais) até concluir os incrementos 1 a 3?**
- (a) Sim [recomendada]; (b) Sim, com exceção do que o usuário pedir; (c) Não.

## 9. Fora do meu papel

- Concorrência, precificação do Pro e viabilidade comercial: business-strategy. (O PLANO §6 de R$ 9,90/mês não tem base citada.)
- Escolha entre notificação local, FCM e aviso ao abrir; desenho do emulador e do CI; possível leitura do QR da NFC-e; reduzir bundle: software-architect.
- Monitoramento de erro, privacidade e LGPD (texto jurídico e retenção): devsecops-engineer, com apoio jurídico (a Prumo não substitui parecer jurídico).
- Desenho do menu, hierarquia dos botões, redução de modais e tema escuro: ui-product-design.
- Avaliação heurística e teste de usabilidade (tempo de 8 s, entendimento do onboarding): ux-research.
- Cálculo e ficha formal dos indicadores da seção 5: data-bi-engineer.
- Criar issues e milestones: delivery-manager.

## 10. Não verificado

- Nenhum comando executado nesta análise (sem terminal). Os números de testes e build vêm do Head, 2026-11-09.
- Não li `ModoCompra`, `TelaInsights`, `TelaPrecos`, `TelaCupomOCR`, `ModalCheckout` por inteiro, nem `firestore.rules`, `IMPLANTACAO.md`; afirmações sobre esses vêm do PLANO e do `App.svelte`. Verificar: se os insights oferecem alguma saída fora de 💡; se o modo compra permite finalizar em ≤ 2 toques.
- Contagem "14 modais" vem do tipo `modalAberto` (13 valores) mais a tela de onboarding e a de login; conferir (`App.svelte:60`).
- Todas as dores, o público e os toques estimados são [HIPÓTESE]: nenhum usuário foi ouvido (ux-research deve confirmar).
- Verificar com o dado real: quantas contas, famílias e compras existem em produção (consulta no console do Firebase) para fixar a linha de base das métricas.
- Sem capturas de tela, nada visual foi avaliado.
