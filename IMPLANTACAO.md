# Implantação — Compras (revisão desta rodada)

Passo a passo completo para publicar a versão atual: correções de UX
(nova lista, Gerenciar), indicador de família ativa, onboarding, ícones
reais, mover lista entre escopos, ordem de corredores, edição avançada de
item, PDF e compartilhamento. Se o projeto já está publicado e você só
quer aplicar esta atualização, pule direto para a **Parte 3**.

```
PARTE 1   Diagnóstico do erro de CI visto no Pull Request
PARTE 2   O que mudou nesta rodada (código)
PARTE 3   Publicar a atualização
PARTE 4   Publicar as regras do Firestore manualmente
PARTE 5   Verificação pós-publicação
```

---

## Parte 1 — Diagnóstico: por que o Pull Request mostrou "Failing"

O print mostrava um check chamado **"Deploy to Firebase Hosting on PR /
build_and_preview"** falhando, enquanto todos os checks do workflow que
esta consultoria construiu (**"Deploy — Compra Planejada"** — `build_e_testes`,
`publicar_preview`, e o "Deploy Preview" postado pela própria ação de
deploy) apareciam **verdes**.

**Diagnóstico:** esse nome — "Deploy to Firebase Hosting on PR" com o job
`build_and_preview` — não corresponde a nenhum workflow desta entrega.
Ele é o nome padrão que o **próprio Firebase CLI gera automaticamente**
quando se responde "sim" à pergunta "Set up automatic builds and deploys
with GitHub?" durante o `firebase init hosting:github`. É bem provável
que isso tenha acontecido numa das execuções desse comando (a orientação
anterior era responder "não" a essa pergunta, exatamente para evitar
duplicidade — mas o prompt pode ter sido respondido diferente, ou rodado
mais de uma vez).

**Resultado prático:** o repositório ficou com **dois workflows
tentando publicar o mesmo site**. O seu (`deploy.yml`) funciona. O
gerado automaticamente pelo Firebase CLI provavelmente falha porque o
gerador padrão não sabe que este é um projeto Vite/Svelte com testes
obrigatórios antes do build — ele assume uma estrutura genérica.

### Correção

- [ ] No repositório, verificar se existem estes dois arquivos (nomes
      padrão do gerador do Firebase):
      `.github/workflows/firebase-hosting-pull-request.yml`
      `.github/workflows/firebase-hosting-merge.yml`
- [ ] Se existirem, **apagar os dois** — o `deploy.yml` desta entrega já
      cobre tudo o que eles fariam (preview em PR, produção no merge),
      com o portão de qualidade que faltava neles
- [ ] Confirmar que `.github/workflows/` fica só com `deploy.yml`
- [ ] Commit e push — o check "Deploy to Firebase Hosting on PR" deve
      parar de aparecer nos próximos Pull Requests

```powershell
Remove-Item .github\workflows\firebase-hosting-pull-request.yml -ErrorAction SilentlyContinue
Remove-Item .github\workflows\firebase-hosting-merge.yml -ErrorAction SilentlyContinue
git add -A
git commit -m "Remove workflow duplicado gerado pelo Firebase CLI"
git push origin main
```

> Esta é a explicação mais provável dado o nome exato do check que
> falhou — não foi possível confirmar lendo o log de erro em si, então
> se depois de remover esses arquivos o problema persistir, o próximo
> passo é abrir o log da execução falha no GitHub (Actions → o run
> vermelho → clicar no job → expandir o passo com o X) e copiar a
> mensagem de erro exata.

---

## Parte 2 — O que mudou nesta rodada

### Correções

| Problema relatado | Causa raiz | Correção |
|---|---|---|
| Sem botão de nova lista | Nunca existiu — `.abas` só listava o que já havia | `ModalNovaLista.svelte` + botão tracejado no cabeçalho |
| "Gerenciar" não funcionava (persistiu após correção anterior) | O botão só aparecia dentro da família **já ativa como escopo**, e a correção anterior ainda dependia de um estado (`app.casaAtual`) compartilhado com "qual lista estou vendo" | Estado próprio (`familiaEmGerenciamento`) com assinatura independente; botão de gerenciar direto em cada linha da lista de famílias, sem precisar trocar de escopo antes |

### Funcionalidades novas

| Funcionalidade | Como acessar |
|---|---|
| Indicador de família ativa | Pílula no cabeçalho, sempre visível |
| Onboarding no primeiro acesso | Automático, uma vez por aparelho |
| **Mover lista entre pessoal e família** | Botão "🔀 Mover lista" abaixo da lista ativa |
| **Ordem dos corredores por mercado** | Botão "🧭 Corredores" abaixo da lista ativa |
| **Edição avançada de item** | Ícone ✎ em cada item (unidade por seletor, categoria, preço) |
| **Gerar PDF** | Botão "🧾 PDF" abaixo da lista ativa |
| **Compartilhar como texto (WhatsApp)** | Botão "🔗 Compartilhar" — abre o seletor nativo do celular quando disponível; copia para a área de transferência como alternativa |
| Ícone do app | Substituído pelos arquivos enviados (fundo verde, recibo com check) |
| Nome do PWA | Padronizado como "Compras" (`name` e `short_name` no manifest) |

### Verificação local antes de publicar

```powershell
npm run verificar
```

- [ ] `svelte-check found 0 errors`
- [ ] **118 passed** (eram 113 — 5 testes novos: 4 de compartilhamento como texto, mais os já existentes de onboarding)
- [ ] build sem erro

---

## Parte 3 — Publicar a atualização

```powershell
cd "C:\Projetos\Compra Planejada\compra-planejada"

git add -A
git commit -m "Corrige nova lista e Gerenciar; adiciona mover lista, corredores, edição avançada, PDF e compartilhar; ícones reais; onboarding"
git push origin main
```

- [ ] Aba **Actions** → workflow "Deploy — Compra Planejada" verde
      (`build_e_testes`, `publicar_producao`, `publicar_regras_firestore`)
- [ ] Nenhum check "Deploy to Firebase Hosting on PR" aparece mais (Parte 1)

---

## Parte 4 — Publicar as regras do Firestore manualmente

Esta rodada não mudou `firestore.rules` nem `firestore.indexes.json` — as
funcionalidades novas (mover lista, ordem de corredores, edição de item)
usam permissões que já existiam (`lists`, `items`, `users`). Não é
obrigatório publicar regras desta vez. Ainda assim, o comando fica
registrado aqui porque é de uso recorrente — sempre que uma mudança futura
tocar nas regras, ou para desbloquear um erro de permissão sem esperar o
CI:

```powershell
firebase deploy --only firestore:rules,firestore:indexes --project compra-planejada
```

Não builda o app, não sobe nada para o GitHub — publica só as regras e os
índices, direto no projeto.

**Pré-requisitos:**
- [ ] `firebase login` feito nesta máquina
- [ ] `.firebaserc` na pasta do projeto apontando para `compra-planejada`
      (se der erro `Not in a Firebase app directory`, rode
      `firebase use compra-planejada` primeiro)

**Saída esperada:**

```
=== Deploying to 'compra-planejada'...

i  deploying firestore
i  firestore: reading indexes from firestore.indexes.json...
i  cloud.firestore: checking firestore.rules for compilation errors...
✔  cloud.firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
i  firestore: deploying indexes...
✔  firestore: deployed indexes in firestore.indexes.json successfully
✔  Deploy complete!
```

**Confirmação:** Console do Firebase → **Firestore Database → Regras**
(data de publicação atualizada) e → **Índices** (status **Ativado**; se
mostrar "Compilando", aguarde antes de testar no app — índice em
construção pode fazer consultas falharem ou travarem em silêncio).

---

## Parte 5 — Verificação pós-publicação

Abrir `https://compra-planejada.web.app` (ou o domínio configurado) e
conferir, nesta ordem:

- [ ] Ícone e nome corretos ao instalar o PWA (fundo verde, "Compras")
- [ ] Primeiro acesso num navegador anônimo/aparelho novo mostra o
      onboarding de 4 passos
- [ ] Pílula de escopo no cabeçalho mostra "Minhas listas" ou o nome da
      família corretamente
- [ ] Botão "+" no cabeçalho abre o modal de nova lista e cria de verdade
- [ ] Numa família: abrir "Listas compartilhadas", tocar no ícone ⚙️ de
      **qualquer** família da lista (não precisa estar com ela ativa) —
      o modal de gerenciamento abre
- [ ] "Mover lista" lista os destinos corretos e move de verdade (conferir
      que os itens continuam lá depois de mover)
- [ ] "Corredores" abre com as categorias da lista atual, reordena e salva
- [ ] Tocar no ✎ de um item abre a edição avançada; salvar reflete na lista
- [ ] "PDF" baixa um arquivo com os itens agrupados por categoria
- [ ] "Compartilhar" abre o seletor do celular (ou copia o texto no
      desktop) com a lista formatada, itens marcados `[x]`/`[ ]`
- [ ] F12 → Console → sem erro vermelho em nenhum dos fluxos acima

---

## Reversão

Se algo quebrar depois do push:

```powershell
git revert HEAD --no-edit
git push origin main
```

O workflow publica a versão revertida automaticamente. Nenhum passo desta
rodada altera dados existentes no Firestore — mover lista muda o campo
`owner` do documento (reversível, os itens não são tocados), e as demais
funcionalidades são leitura/escrita normal já coberta pelas regras
existentes.
