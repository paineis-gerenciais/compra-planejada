# Implantação completa — Compras (revisão com correções críticas)

Passo a passo do zero ao ar, com todos os comandos exatos para o Prompt de
Comando/PowerShell do Windows. Esta rodada corrige dois problemas que
afetavam o app **em produção agora** (regras nunca publicadas de verdade, e
o escopo pessoal consultando um dono que não existe) — por isso a Parte 2
não é opcional, mesmo que você só queira "aplicar as novidades".

```
PARTE 1   Corrigir a permissão da conta de serviço (resolve o Anexo 1)
PARTE 2   Publicar as regras manualmente agora (resolve o Anexo 2 e o "Gerenciar")
PARTE 3   Aplicar o código desta rodada
PARTE 4   Publicar a atualização
PARTE 5   Verificação completa
```

---

## Parte 1 — Corrigir a permissão da conta de serviço

**O que estava errado:** o job `publicar_regras_firestore` falhava com
`403 The caller does not have permission` na chamada a
`firebaserules.googleapis.com`. A conta de serviço usada pelo GitHub
Actions foi criada (pelo `firebase init hosting:github`) só com o papel
**Firebase Hosting Admin** — que publica o site, mas não publica regras do
Firestore. Faltava um segundo papel na mesma conta.

### 1.1 Encontrar a conta de serviço

1. [console.cloud.google.com](https://console.cloud.google.com) → selecionar o projeto **compra-planejada**
2. Menu → **IAM e administrador** → **IAM**
3. Localizar a conta que tem um nome parecido com
   `github-action-XXXXXXXXXX@compra-planejada.iam.gserviceaccount.com`
   (o mesmo nome que apareceu na mensagem de erro anterior, ao rodar
   `firebase init hosting:github`)

### 1.2 Adicionar o papel que falta

1. Clicar no ícone de lápis (editar) na linha dessa conta
2. **Adicionar outro papel**
3. Buscar e selecionar: **Firebase Rules Admin** (`roles/firebaserules.admin`)
4. Também adicionar: **Cloud Datastore Index Admin** (`roles/datastore.indexAdmin`) — necessário para publicar `firestore.indexes.json`, um passo que nem chegou a ser tentado porque a etapa anterior (regras) já falhava antes
5. **Salvar**

- [ ] Conta de serviço agora tem pelo menos três papéis: Firebase Hosting
      Admin, Firebase Rules Admin, Cloud Datastore Index Admin

> **Alternativa mais simples, se preferir não gerenciar papéis um a um:**
> em vez dos três papéis específicos, adicionar um único papel amplo,
> **Firebase Admin** (`roles/firebase.admin`), que cobre tudo isso e
> qualquer necessidade futura de CI/CD do projeto. Para um projeto
> pessoal, é a opção mais simples de manter — menos preciso em termos de
> privilégio mínimo, mas sem risco de faltar permissão de novo a cada
> funcionalidade nova.

**Critério de saída:** a conta de serviço tem permissão para publicar
regras e índices, não só o site.

---

## Parte 2 — Publicar as regras manualmente agora

**Por que isso é urgente, não só um passo de rotina:** como o CI nunca
conseguiu publicar as regras (Parte 1), é bem provável que as regras
publicadas hoje no Firestore **não sejam a versão do projeto — sejam
regras antigas, incompletas, ou o padrão restritivo que o Firebase cria
sozinho.** Isso explica todos os erros do Anexo 2 (`Missing or
insufficient permissions` em `watchLists`, `watchPrices`, `watchPurchases`,
`watchMyHouseholds`): o aplicativo pode estar perfeito e ainda assim não
funcionar, porque o que está de guarda no banco de dados é outra coisa.

Publicar manualmente, com a sua conta de dono do projeto (que já tem
todas as permissões), resolve isso **imediatamente**, sem esperar o CI:

```powershell
cd "C:\Projetos\Compra Planejada\compra-planejada"

firebase login

firebase use compra-planejada

firebase deploy --only firestore:rules,firestore:indexes --project compra-planejada
```

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

- [ ] Console do Firebase → **Firestore Database → Regras** → data de
      publicação atualizada para agora
- [ ] **Firestore Database → Índices** → todos com status **Ativado**
      (se aparecer "Compilando", aguardar antes de seguir — pode levar de
      minutos a algumas horas)

**Teste imediato, antes de continuar:** recarregue o app publicado
(`https://compra-planejada.web.app`) e abra o Console do navegador (F12).
Os erros `Missing or insufficient permissions` devem sumir. Se ainda
aparecerem depois deste passo, o problema não é mais as regras — é a
Parte 3 (o código do escopo) que ainda não foi publicada.

---

## Parte 3 — Aplicar o código desta rodada

### O que mudou

| Problema relatado | Causa raiz encontrada | Correção |
|---|---|---|
| Erros de permissão no console (Anexo 2) | **Bug crítico**: `app.escopo` nascia com um `owner.id` de valor `'local'` (placeholder) e nunca era atualizado com o uid real depois do login. Toda consulta no escopo "Minhas listas" pedia dados de um dono que não existe, e as regras (corretas!) recusavam | `App.svelte` agora sincroniza `app.escopo` com o uid real no login e no logout |
| "Gerenciar" ainda não abria | Consequência do bug acima: um `await` sem tratamento dentro de `abrirGerenciarFamilia` travava a função (por causa do erro de permissão) antes de o modal ser aberto | Modal abre primeiro; busca de convites agora tem `try/catch` — uma falha ali não impede mais o modal de abrir |
| Deploy de regras falhando no CI (Anexo 1) | Conta de serviço sem o papel necessário | Ver Parte 1 (ação fora do código, no Console do Google Cloud) |

### Funcionalidades novas

| Funcionalidade | Como usar |
|---|---|
| **Sair da conta** | Ícone 👤 no cabeçalho → "Sair da conta" |
| **Arrastar e soltar** para reordenar itens e corredores | Ícone ⠿ em cada linha — os botões ▲▼ continuam existindo como alternativa acessível por teclado/leitor de tela |

### Verificação local antes de publicar

```powershell
npm install
npm run verificar
```

- [ ] `svelte-check found 0 errors`
- [ ] **132 passed** (eram 118 — 11 testes novos de arrastar/soltar, 3 de sair da conta indiretamente cobertos pelos existentes)
- [ ] build sem erro

> `npm install` está listado explicitamente aqui, e não como um passo
> implícito: esta consultoria já causou confusão antes ao presumir que
> "atualizar os arquivos" incluía atualizar dependências. Sempre rode
> `npm install` antes de `npm run verificar` quando aplicar uma entrega
> nova — o `package.json` pode ter ganhado uma biblioteca nova (aconteceu
> com `tesseract.js` e depois com `jspdf`) que só é baixada nesse passo.

---

## Parte 4 — Publicar a atualização

```powershell
git add -A
git commit -m "Corrige escopo pessoal com uid real, Gerenciar, adiciona sair da conta e arrastar-soltar"
git push origin main
```

- [ ] Aba **Actions** → workflow "Deploy — Compra Planejada" verde nos
      quatro jobs (`build_e_testes`, `publicar_producao`,
      `publicar_regras_firestore`)
- [ ] Desta vez `publicar_regras_firestore` também deve ficar verde —
      é o teste de que a Parte 1 funcionou

---

## Parte 5 — Verificação completa

Abrir `https://compra-planejada.web.app`, de preferência num navegador
anônimo/aparelho ainda não testado, e conferir nesta ordem:

- [ ] Login funciona sem erro
- [ ] **A tela inicial já mostra as listas que você criou antes** —
      este era o sintoma do bug do escopo; se ainda aparecer vazio,
      confira se a Parte 2 e a Parte 3 foram realmente aplicadas
- [ ] Botão "+" aparece no cabeçalho e cria lista nova
- [ ] F12 → Console → **sem nenhum erro `Missing or insufficient
      permissions`**
- [ ] Ícone 👤 → mostra nome/e-mail da conta → "Sair da conta" funciona e
      volta para a tela de login
- [ ] Entrar de novo → listas continuam lá
- [ ] Numa família: tocar no ⚙️ de qualquer família da lista (sem
      precisar estar com ela ativa) → o modal de gerenciamento abre
- [ ] Arrastar um item pelo ⠿ para outra posição dentro da categoria —
      a ordem persiste depois de recarregar a página
- [ ] Arrastar uma categoria no modal "Corredores" — mesma verificação
- [ ] Os botões ▲▼ ainda funcionam como alternativa (teste ao menos uma
      vez com o teclado, tabulando até o botão e apertando Enter)
- [ ] "Mover lista", "PDF", "Compartilhar", edição de item (✎) — todos
      continuam funcionando (regressão da rodada anterior)

---

## Reversão

**Código:**
```powershell
git revert HEAD --no-edit
git push origin main
```

**Regras:** só reverta se a Parte 2 tiver causado um problema novo — o
que seria incomum, já que as regras publicadas são as mesmas que já
existiam no repositório, só que agora realmente chegando ao Firestore.
Se precisar, republique a versão anterior do `firestore.rules` pelo
mesmo comando da Parte 2.

**Nada nesta rodada apaga dados.** O bug do escopo fazia o app *não
encontrar* listas que já existiam — ele nunca as excluiu. Depois da
correção, elas voltam a aparecer normalmente.

---

## Resumo de uma tela

| Parte | O que resolve | Onde é feito | Obrigatória? |
|---|---|---|---|
| 1 · IAM | Anexo 1 (CI falhando) | Console do Google Cloud | Sim, para o CI voltar a funcionar |
| 2 · publicar regras manualmente | Anexo 2 (permissões no app) | Terminal, agora | **Sim, imediatamente** — é a causa mais provável do app não funcionar hoje |
| 3 · aplicar código | Escopo com uid errado, Gerenciar, + 2 funcionalidades novas | Terminal | Sim |
| 4 · publicar | Leva tudo para produção | `git push` | Sim |
| 5 · verificação | Confirma que resolveu de verdade | Navegador | Sim |

**Se você só puder fazer uma coisa agora:** rode a Parte 2. É provável
que ela sozinha resolva a maior parte dos sintomas visíveis hoje.
