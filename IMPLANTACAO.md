# Implantação — correção do convite de família

Este passo a passo não deixa nada implícito: antes de cada comando, uma
explicação do que ele faz e por quê. Se um passo parecer óbvio, ainda
assim está explicado — é melhor sobrar contexto do que faltar.

```
PARTE 1   O que foi corrigido (para você entender o "porquê" antes do "como")
PARTE 2   Preparar a branch de trabalho
PARTE 3   Trazer o código novo para a pasta do projeto
PARTE 4   Verificar que o código está correto antes de publicar
PARTE 5   Subir a branch e abrir o Pull Request
PARTE 6   Testar o preview antes de aceitar
PARTE 7   Mesclar e confirmar em produção
```

---

## Parte 1 — O que foi corrigido

**Você relatou:** o botão "Gerar convite" não fazia nada visível ao ser
clicado.

**O que a investigação encontrou — dois problemas, em duas camadas
diferentes:**

### Problema 1 — a regra de segurança negava a releitura do convite

Depois de criar um convite, o app tenta imediatamente reler a lista de
convites da família, para mostrar o código gerado na tela. Essa
releitura usava uma **consulta filtrada** (Firestore chama isso de
"list", diferente de pegar um documento específico por id, que é um
"get"). A regra de segurança tinha `allow list: if false` — ou seja,
**nenhuma consulta desse tipo era permitida, para ninguém, nunca**,
mesmo para o próprio responsável pedindo os convites da própria família.

O convite **era criado com sucesso** no banco de dados — só a etapa
seguinte, de mostrar o código na tela, é que falhava. Por isso o botão
"parecia" não fazer nada: o trabalho acontecia, mas você nunca via o
resultado.

**Correção:** a regra agora permite essa consulta específica, mas só
quando ela já vem "presa" a uma família onde quem pergunta é o
responsável — o Firestore garante isso automaticamente, recusando
qualquer consulta que não consiga provar isso para todo resultado
possível. Continua impossível para um estranho listar convites de
famílias que não são dele.

### Problema 2 — entrar com um convite (achado ao verificar a camada seguinte)

Ao investigar o fluxo inteiro do convite (não só criar, também usar), foi
encontrado um segundo bug: quando alguém tenta **entrar** numa família
usando um código, o app precisava ler os dados da família antes de
adicionar essa pessoa como membro — mas a regra de segurança só permite
ler dados de uma família para quem **já é membro dela**. A pessoa
entrando ainda não é membro no momento exato dessa leitura, então a
leitura era negada, e a entrada falhava.

**Correção:** a ordem das operações foi invertida — agora o app escreve
a nova pessoa como membro primeiro (isso não exige ler antes), e só
depois lê os dados completos da família, quando ela já é membro de
verdade e a leitura é permitida.

### Também corrigido, como reforço

Os dois pontos do código que chamavam "criar convite" e "listar
convites" não tinham tratamento para quando algo dá errado — se uma
dessas chamadas falhasse, a tela simplesmente não reagia, sem nenhuma
mensagem. Agora, se algo falhar, aparece um aviso explicando que não foi
possível gerar o convite, em vez de silêncio.

---

## Parte 2 — Preparar a branch de trabalho

**Por que criar uma branch nova:** cada mudança deve viver na própria
branch até passar pelos testes automáticos e por um preview real — é
assim que o projeto evita publicar algo quebrado direto em produção.
Nomeie a branch pelo que ela faz, não por um número de versão — evita a
confusão de branches soltas que aconteceu nas rodadas anteriores.

Abra o **PowerShell** (ou Prompt de Comando) e entre na pasta do
projeto:

```powershell
cd "C:\Projetos\Compra Planejada\compra-planejada"
```

`cd` significa "change directory" (trocar de pasta) — sem isso, os
próximos comandos rodariam na pasta errada.

Confirme que está na branch `main` e que ela está atualizada, antes de
criar a branch nova a partir dela:

```powershell
git checkout main
```

`git checkout main` troca a pasta de trabalho para o conteúdo da branch
`main` — importante fazer isso primeiro para garantir que a branch nova
nasça a partir da versão mais recente publicada, não de alguma branch
antiga esquecida.

```powershell
git pull origin main
```

`git pull origin main` busca no GitHub (`origin`) o que há de mais
recente na branch `main` e atualiza sua cópia local. Sem isso, sua
`main` local poderia estar desatualizada em relação ao que já foi
mesclado (por exemplo, se o Pull Request da rodada anterior foi
mesclado direto pelo site do GitHub).

Agora crie a branch nova para este trabalho:

```powershell
git checkout -b corrige-convite-familia
```

`git checkout -b nome` cria uma branch nova com esse nome **e** já troca
para ela, num só comando (é um atalho para `git branch nome` seguido de
`git checkout nome`). A partir daqui, qualquer commit que você fizer vai
para essa branch, não para `main`.

---

## Parte 3 — Trazer o código novo para a pasta do projeto

Copie o conteúdo do arquivo `.zip` desta entrega **por cima** da pasta
`C:\Projetos\Compra Planejada\compra-planejada` — sobrescrevendo os
arquivos que já existem lá. Os arquivos que mudaram nesta correção são:

- `firestore.rules` (a regra de segurança corrigida)
- `src/lib/data/FirestoreRepository.ts` (o fluxo de entrar na família corrigido)
- `src/App.svelte` (tratamento de erro ao gerar convite)
- `src/lib/ui/TelaGerenciarFamilia.svelte` (botão desabilitado durante o envio)

Não precisa apagar nada antes de copiar — sobrescrever é suficiente,
porque nenhum arquivo foi removido nesta rodada.

---

## Parte 4 — Verificar que o código está correto antes de publicar

**Por que este passo nunca é opcional:** ele roda os mesmos testes que o
GitHub vai rodar automaticamente depois. Encontrar um problema aqui,
no seu computador, é muito mais rápido do que esperar o Pull Request
falhar.

```powershell
npm install
```

Este comando lê o arquivo `package.json` do projeto e baixa, na pasta
`node_modules`, qualquer biblioteca que ainda não esteja instalada na
sua máquina. Rodar sempre, mesmo quando "parece" que nada mudou nas
dependências — é rápido quando não há nada novo para baixar, e evita o
erro "Cannot find module" que já aconteceu numa rodada anterior.

```powershell
npm run verificar
```

Este comando roda, em sequência: a checagem de tipos do TypeScript
(`svelte-check`), depois os 132 testes automatizados, depois o processo
de build (que gera a versão otimizada do app). Se qualquer uma dessas
três etapas falhar, o comando para e mostra o erro — é o sinal para
parar e investigar antes de continuar.

**O que esperar na tela, se tudo estiver certo:**
```
svelte-check found 0 errors and ... warnings
...
Test Files  5 passed (5)
     Tests  132 passed (132)
...
✓ built in ...
```

- [ ] `0 errors` na checagem de tipos
- [ ] `132 passed` nos testes
- [ ] build concluído sem mensagem de erro (avisos sobre "chunks larger
      than 500 kB" são esperados e não impedem nada — são só uma
      sugestão de otimização futura, relacionada ao tamanho do SDK do
      Firebase, não um problema)

---

## Parte 5 — Subir a branch e abrir o Pull Request

Primeiro, avise o Git sobre quais arquivos você quer incluir no próximo
commit:

```powershell
git add -A
```

`git add -A` marca **todos** os arquivos que mudaram (novos, editados ou
removidos) para entrar no próximo commit. O `-A` significa "all"
(todos) — sem ele, seria preciso listar cada arquivo um por um.

Agora, registre essas mudanças como um commit, com uma mensagem
descrevendo o que foi feito:

```powershell
git commit -m "Corrige convite de familia: lista de convites negada pela regra, e entrada de novo membro negada pela mesma causa"
```

`git commit -m "mensagem"` cria um "ponto de salvamento" no histórico do
projeto, com a mensagem entre aspas explicando o que mudou. Essa
mensagem fica visível para sempre no histórico — vale escrever algo que
faça sentido para você (ou para outra pessoa) daqui a alguns meses.

Envie a branch para o GitHub:

```powershell
git push -u origin corrige-convite-familia
```

`git push` envia os commits da sua branch local para o GitHub
(`origin`). O `-u origin corrige-convite-familia` faz duas coisas ao
mesmo tempo: cria a branch `corrige-convite-familia` no GitHub (ela
ainda não existia lá) e "liga" a sua branch local a essa branch remota,
para que da próxima vez baste digitar `git push` sem repetir o nome.

**No navegador:**

1. Abra `https://github.com/paineis-gerenciais/compra-planejada`
2. O GitHub costuma mostrar um aviso amarelo, "corrige-convite-familia
   had recent pushes", com um botão **Compare & pull request** — clique
   nele. (Se não aparecer, vá manualmente em **Pull requests → New pull
   request**, e escolha `base: main` ← `compare: corrige-convite-familia`)
3. Clique em **Create pull request**

Isso não publica nada ainda — é só o pedido de mesclagem, que dispara os
testes automáticos e gera um link de teste isolado (a Parte 6).

---

## Parte 6 — Testar o preview antes de aceitar

Depois de criar o Pull Request, o GitHub roda o workflow automaticamente.
Isso leva de 1 a 3 minutos.

- [ ] Na própria página do Pull Request, role até os "checks" — devem
      aparecer marcados com um ✓ verde: `build_e_testes` e
      `publicar_preview`
- [ ] Um comentário automático aparece no Pull Request com um link de
      preview, algo como
      `https://compra-planejada--corrige-convite-familia-xxxx.web.app`

**Abra esse link e teste especificamente o que foi corrigido:**

- [ ] Entrar com uma conta, abrir ou criar uma família
- [ ] Ícone ⚙️ de gerenciar → **Gerar convite** → o código de 8 letras
      deve aparecer na tela imediatamente
- [ ] Copiar o link do convite gerado
- [ ] Num navegador **anônimo** (ou outra conta), colar/abrir esse link
      e entrar na família com uma conta diferente
- [ ] A pessoa nova deve aparecer na lista de membros da família
- [ ] F12 (abre as Ferramentas do Desenvolvedor) → aba **Console** → não
      deve aparecer nenhum erro em vermelho durante esse teste

Se algo não funcionar aqui, **não mescle ainda** — volte à Parte 3 e
confira se todos os arquivos foram realmente sobrescritos.

---

## Parte 7 — Mesclar e confirmar em produção

Com o preview testado e funcionando, volte à página do Pull Request no
GitHub e clique em **Merge pull request**, depois **Confirm merge**.

Isso dispara automaticamente:
- O deploy do site em produção (`compra-planejada.web.app`)
- A publicação das regras do Firestore corrigidas — **este é o passo que
  efetivamente resolve o bug**, porque é a regra publicada que estava
  bloqueando o convite

- [ ] Aba **Actions** do repositório → workflow verde, incluindo o job
      `publicar_regras_firestore`
- [ ] Abrir `https://compra-planejada.web.app` (o site de produção, não
      mais o preview) e repetir o teste da Parte 6 lá

### Limpeza final (opcional, mas recomendada)

```powershell
git checkout main
```

Volta para a branch principal.

```powershell
git pull origin main
```

Atualiza sua `main` local com o que acabou de ser mesclado.

```powershell
git branch -d corrige-convite-familia
```

Apaga a branch local `corrige-convite-familia` — o `-d` (minúsculo) só
apaga se ela já estiver mesclada em `main`, como proteção contra apagar
trabalho por engano.

```powershell
git push origin --delete corrige-convite-familia
```

Apaga a mesma branch no GitHub, já que ela cumpriu sua função (o
trabalho dela já está em `main`).

---

## Reversão, se algo der errado depois do merge

```powershell
git revert HEAD --no-edit
git push origin main
```

`git revert HEAD` cria um novo commit que desfaz exatamente as mudanças
do último commit em `main`, sem apagar o histórico (diferente de
"desfazer", que reescreveria o passado). O `--no-edit` aceita a mensagem
de commit padrão que o Git sugere, sem abrir um editor de texto. O
`git push origin main` publica essa reversão, disparando um novo deploy
automaticamente.

**Sobre as regras do Firestore:** se precisar reverter só as regras (não
o resto do código), o mesmo `git revert` já cuida disso, porque
`firestore.rules` também está sob controle de versão e o workflow
publica regras a cada push em `main`.
