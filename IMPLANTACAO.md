# Implantação — Compra Planejada (Firebase Hosting + GitHub)

Passo a passo completo, do zero, para o projeto final: **Firebase Hosting**
(não GitHub Pages), repositório
**https://github.com/paineis-gerenciais/compra-planejada**, e GitHub
Actions como ferramenta de teste de versão e merge — cada Pull Request
publica um canal de preview isolado antes de qualquer coisa ir para
produção.

Sem etapa de migração: é uma implantação nova, projeto Firebase novo,
repositório novo.

```
PARTE 1   Firebase Hosting habilitado no projeto (rápido — Auth e Firestore já existem)
PARTE 2   Repositório GitHub e primeiro push
PARTE 3   Secret de deploy (a peça que liga GitHub ↔ Firebase)
PARTE 4   Primeiro deploy e verificação
PARTE 5   Fluxo do dia a dia — PR, preview, merge, produção
```

---

## Por que Firebase Hosting em vez de GitHub Pages

A publicação anterior falhou porque o GitHub Pages estava servindo o
código-fonte (`/src/main.ts`, 404) em vez do `dist/` compilado — um erro de
configuração do **Source** em Settings → Pages. O Firebase Hosting evita
essa classe inteira de erro: o `firebase.json` desta entrega já define
explicitamente `"public": "dist"`, então não existe a possibilidade de
publicar a pasta errada por engano — é literal no arquivo, versionado
junto com o código.

---

## Parte 1 — Habilitar o Firebase Hosting

Você disse que o `firebaseConfig` já foi adicionado ao projeto
`compra-planejada`. Falta habilitar o **Hosting** em si (Authentication e
Firestore presumo já configurados de sessões anteriores — se não, ver os
itens 1.3/1.4 abaixo antes de seguir).

### 1.1 Habilitar o Hosting no Console

- [ ] [console.firebase.google.com](https://console.firebase.google.com) →
      projeto `compra-planejada` → **Hosting** (menu lateral) → **Começar**
- [ ] Pode pular os passos de "instalar CLI" e "fazer deploy" mostrados no
      assistente do Console — o GitHub Actions vai fazer isso sozinho a
      partir da Parte 3. Só precisa que o Hosting apareça como habilitado.

### 1.2 Domínios padrão gerados

O Hosting cria automaticamente:
- `compra-planejada.web.app`
- `compra-planejada.firebaseapp.com`

### 1.3 Conferir domínios autorizados para login

- [ ] **Authentication → Settings → Authorized domains**
- [ ] Confirmar que `compra-planejada.firebaseapp.com` está na lista — ele
      é auto-adicionado pelo Firebase por ser o `authDomain` do seu
      `firebaseConfig`
- [ ] Confirmar que `compra-planejada.web.app` **também** está na lista.
      Normalmente já vem pré-populado quando o Hosting é habilitado no
      mesmo projeto, mas **confira, não presuma** — se não estiver, clique
      em **Add domain** e adicione manualmente

### 1.4 Firestore e Authentication (se ainda não configurados)

- [ ] **Authentication → Sign-in method** → Google e E-mail/senha habilitados
- [ ] **Firestore Database** → criado, região `southamerica-east1`

**Critério de saída da Parte 1:** Hosting habilitado, os dois domínios
padrão confirmados em Authorized domains.

---

## Parte 2 — Repositório GitHub e primeiro push

O repositório `compra-planejada` é novo — sem histórico conflitante, sem
necessidade de `--force`.

No PowerShell/CMD, dentro da pasta do projeto:

```powershell
cd "C:\Projetos\Compra Planejada\compra-planejada"

git init
git remote add origin https://github.com/paineis-gerenciais/compra-planejada.git
```

Se o repositório no GitHub já foi criado com algum arquivo (README,
`.gitignore` por exemplo), busque-o antes de continuar:

```powershell
git fetch origin
git branch -M main
```

Copie o conteúdo desta entrega para a pasta do projeto (todos os arquivos:
`src/`, `public/`, `.github/`, `firebase.json`, `.firebaserc`,
`firestore.rules`, `firestore.indexes.json`, `package.json`, etc.).

```powershell
npm install
```

Editar `.gitignore` — crie se não existir:

```
node_modules/
dist/
.env
.env.local
*.local
```

```powershell
npm run verificar
```

- [ ] `svelte-check found 0 errors`
- [ ] `109 passed`
- [ ] build sem erro

```powershell
git add -A
git commit -m "Primeira versão: Compra Planejada"
git push -u origin main
```

- [ ] Push aceito sem erro (repositório novo, não deve haver rejeição)

**Critério de saída da Parte 2:** o código está no GitHub, branch `main`.

---

## Parte 3 — Secret de deploy (GitHub ↔ Firebase)

Esta é a peça que faltava para o GitHub Actions conseguir publicar no
Firebase Hosting em seu nome. Sem ela, o workflow desta entrega falha no
passo de deploy com erro de autenticação — de propósito, para nunca
publicar sem credencial válida.

### 3.1 Gerar a credencial (mais simples: pelo próprio Firebase CLI)

No seu computador, dentro da pasta do projeto:

```powershell
npm install -g firebase-tools
firebase login
firebase init hosting:github
```

Esse comando é interativo e faz tudo sozinho:
- pergunta a qual projeto Firebase vincular → `compra-planejada`
- pergunta o repositório GitHub → `paineis-gerenciais/compra-planejada`
- **cria a service account**, gera a credencial, e **já cadastra o secret
  automaticamente no GitHub** (`FIREBASE_SERVICE_ACCOUNT_COMPRA_PLANEJADA`
  ou nome semelhante — anote o nome exato que ele mostrar)
- pergunta se quer criar os workflows de deploy — responda **não**, porque
  esta entrega já vem com `.github/workflows/deploy.yml` pronto e mais
  completo (com portão de testes antes do deploy)

- [ ] Comando concluído sem erro
- [ ] Secret aparece em GitHub → repositório → **Settings → Secrets and
      variables → Actions**

### 3.2 Conferir o nome do secret no workflow

Abra `.github/workflows/deploy.yml` e `.github/workflows/firestore-rules.yml`
desta entrega — eles esperam o secret com o nome
`FIREBASE_SERVICE_ACCOUNT_COMPRA_PLANEJADA`. Se o assistente do passo 3.1
gerou um nome diferente, ajuste os dois arquivos para usar o nome real, ou
renomeie o secret no GitHub para bater com o esperado.

- [ ] Nome do secret confere nos dois arquivos de workflow

### 3.3 Alternativa manual (se preferir não usar o assistente)

1. Console do Google Cloud → **IAM e administrador → Contas de serviço** →
   criar uma conta de serviço no projeto `compra-planejada` com o papel
   **Firebase Hosting Admin**
2. Gerar uma chave JSON para essa conta
3. No GitHub: **Settings → Secrets and variables → Actions → New repository
   secret** → nome `FIREBASE_SERVICE_ACCOUNT_COMPRA_PLANEJADA`, colar o
   conteúdo do JSON inteiro

**Critério de saída da Parte 3:** o secret existe no repositório GitHub com
o nome que os workflows esperam.

---

## Parte 4 — Primeiro deploy e verificação

```powershell
git push origin main
```

(Se já tiver feito o push da Parte 2 e não houver mudança nova, crie um
commit vazio só para disparar o workflow: `git commit --allow-empty -m
"Dispara o primeiro deploy"` e dê push.)

- [ ] Aba **Actions** do repositório → workflow "Deploy — Compra
      Planejada" rodando
- [ ] Job `build_e_testes` verde (svelte-check + 109 testes + build)
- [ ] Job `publicar_producao` verde
- [ ] Job `publicar_regras_firestore` também verde (roda em todo push em
      `main`, sem depender de filtro de caminho alterado — ver nota
      abaixo sobre por que não usamos mais `paths:`)

> **Nota sobre a versão anterior deste workflow:** a primeira versão
> publicava as regras num workflow separado, disparado só quando
> `firestore.rules`/`firestore.indexes.json` mudavam (filtro `paths:`).
> Esse filtro depende de o GitHub conseguir comparar contra um commit
> anterior na mesma branch, e esse comportamento varia conforme como a
> branch nasceu — é um dos cantos mais inconsistentes do GitHub Actions,
> e não disparou no primeiro push real deste projeto. A correção: juntar
> a publicação de regras como um job a mais dentro do mesmo
> `deploy.yml`, disparado em todo push em `main`, sem condição de
> caminho. Reenviar regras idênticas é praticamente instantâneo e não
> tem efeito colateral, então não há custo em rodar sempre.

### Publicar as regras manualmente, sem esperar o Actions

Às vezes você só quer atualizar as regras do Firestore sem publicar o
site — por exemplo, para testar uma mudança de regra isoladamente, ou
para desbloquear um erro de permissão sem esperar o CI rodar. Um comando,
direto do computador:

```powershell
firebase deploy --only firestore:rules,firestore:indexes --project compra-planejada
```

Não builda o app, não sobe nada para o GitHub — publica só
`firestore.rules` e `firestore.indexes.json` direto no projeto.

**Pré-requisitos** (normalmente já satisfeitos se você seguiu a Parte 3):
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
mostrar "Compilando", aguarde antes de testar login ou listas no app —
índice em construção pode fazer consultas falharem ou travarem em
silêncio).

### Verificação no navegador

- [ ] Abrir `https://compra-planejada.web.app`
- [ ] Tela de login aparece (não branco, não 404)
- [ ] Entrar com Google — sem erro `auth/unauthorized-domain`
- [ ] Criar uma lista, adicionar um item
- [ ] F12 → Console → sem erro vermelho
- [ ] F12 → Application → Service Workers → `sw.js` ativo, escopo `/`
- [ ] F12 → Application → Manifest → nome "Compra Planejada", ícones
      carregando sem erro (192, 512 e o maskable)
- [ ] Índices do Firestore com status **Ativado** no Console (não
      "Compilando") — se ainda estiver compilando, criar lista pode
      travar ou falhar silenciosamente; aguarde antes de testar a fundo

**Critério de saída da Parte 4:** o app funciona de ponta a ponta no
endereço de produção.

---

## Parte 5 — Fluxo do dia a dia (a "ferramenta de teste de versão e merge")

A partir daqui, o processo normal de mudar o app é:

```powershell
git checkout -b nome-da-mudanca
# ... editar código ...
npm run verificar          # rodar local antes de subir, economiza um ciclo de CI
git add -A
git commit -m "Descrição da mudança"
git push -u origin nome-da-mudanca
```

No GitHub, abrir um **Pull Request** de `nome-da-mudanca` para `main`.

- [ ] O workflow builda, testa, e — se passar — comenta no próprio PR o
      link do **canal de preview** (algo como
      `compra-planejada--nome-da-mudanca-xxxx.web.app`)
- [ ] Abrir esse link, testar a mudança de verdade, num ambiente isolado
      que não afeta `compra-planejada.web.app`
- [ ] Se algo estiver errado, corrigir e dar push de novo na mesma branch —
      o preview atualiza sozinho
- [ ] Satisfeito, **Merge** do PR

O merge dispara o job `publicar_producao`: build, testes, e deploy no canal
`live`. O canal de preview daquele PR expira sozinho em 7 dias — não
precisa limpar manualmente.

**Isto substitui, por completo, qualquer necessidade de `git push --force`
no dia a dia.** Force push só voltaria a ser necessário num cenário
excepcional (reescrever histórico por algum motivo grave), o que não é o
fluxo normal de trabalho.

---

## Reversão

**Voltar produção para uma versão anterior:** reverter o merge no GitHub
(botão "Revert" no próprio PR mesclado, ou `git revert`) e dar push em
`main` — o workflow publica a versão revertida automaticamente.

**Recuperação de dados:** o Firestore não é tocado por nenhum passo deste
runbook além da Parte 1.4 (criação) e da publicação de regras — que só
define permissões, nunca apaga dados.

---

## Resumo executivo

| Parte | Serve para | Uma vez só ou recorrente? |
|---|---|---|
| 1 · Hosting + domínios | fundação no Firebase | uma vez |
| 2 · repositório | código no GitHub | uma vez (primeiro push) |
| 3 · secret | GitHub consegue publicar no Firebase | uma vez |
| 4 · primeiro deploy | confirmar que tudo funciona ponta a ponta | uma vez |
| 5 · fluxo do dia a dia | toda mudança futura | recorrente — é o processo normal |

**O que decide o ritmo:** as Partes 1 a 4 são configuração única. A Parte 5
é o processo que você vai repetir para cada mudança dali para frente —
branch, PR, preview, merge, produção — sem nunca mais precisar decidir
manualmente "para onde publicar" ou correr o risco de publicar a pasta
errada, porque isso agora está fixado no `firebase.json`.
