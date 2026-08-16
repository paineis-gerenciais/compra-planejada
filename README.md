# Compra Planejada

PWA de lista de compras com sincronização entre aparelhos, listas
compartilhadas em família, modo compra, leitura de cupom fiscal por foto e
inteligência de preço (histórico, inflação pessoal, previsão de recompra).

**Stack:** Svelte 5 + TypeScript + Vite · Firebase (Auth + Firestore) ·
Firebase Hosting · GitHub Actions (deploy automático + canal de preview por
Pull Request).

**Repositório:** https://github.com/paineis-gerenciais/compra-planejada
**Projeto Firebase:** `compra-planejada`

---

## Estado do projeto

Todas as telas principais estão portadas e testadas: recibo, entrada
rápida, modo compra, finalizar compra (com pendentes e recorrência),
histórico, preços, famílias (criar/entrar/gerenciar/papéis/convites),
leitura de cupom com revisão assistida (OCR), e insights de inflação
pessoal + lista sugerida.

Ainda não portado: mapa, geração de PDF, compartilhar como texto, tela
dedicada de edição de item, interface de arrastar para reordenar
corredores. Nenhum desses afeta sincronização ou dados — são reduções de
funcionalidade pontuais.

Ver `PLANO-EVOLUCAO-PRODUTO.md` para o roadmap completo e
`IMPLANTACAO.md` para o passo a passo de publicação.

---

## Rodar localmente

```bash
npm install
npm run dev          # servidor de desenvolvimento (localhost:5173)
npm run verificar    # tipos + testes + build — rodar antes de cada push
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Vite em modo desenvolvimento |
| `npm run check` | `svelte-check` com TypeScript estrito |
| `npm run test` | 109 testes (Vitest) |
| `npm run build` | gera `dist/` |
| `npm run preview` | serve `dist/` localmente — o teste mais fiel ao que vai para produção |

---

## Arquitetura

```
src/
├── app.css                  design system "Cupom" (tokens)
├── main.ts                  registra o service worker
├── App.svelte                casca da aplicação
└── lib/
    ├── domain/               lógica pura, sem DOM e sem rede
    │   ├── types.ts          modelo de dados
    │   ├── parse.ts          entrada rápida ("2kg tomate")
    │   ├── categorize.ts     dicionário de ~300 produtos br-PT
    │   ├── items.ts          consolidação, posições, ordenação
    │   ├── merge.ts          reconciliação entre aparelhos
    │   ├── prices.ts         histórico e comparação de preços
    │   ├── aisles.ts         ordem dos corredores
    │   ├── recurrence.ts     listas recorrentes
    │   ├── roles.ts          papéis e convites
    │   ├── receipt-parse.ts  extração de itens de texto OCR
    │   ├── inflacao.ts       inflação pessoal e previsão de recompra
    │   └── lista-sugerida.ts geração de candidatos de lista automática
    ├── data/                 persistência
    │   ├── repository.ts         interfaces
    │   ├── MemoryRepository.ts   implementação em memória (testes, modo sem conta)
    │   ├── FirestoreRepository.ts implementação real (produção)
    │   └── migration.ts          leitura de dados antigos do localStorage
    ├── servicos/             casos de uso (única camada que fala com o repositório)
    ├── stores/               estado reativo (runes do Svelte 5)
    ├── auth/                 inicialização do Firebase e autenticação
    └── ui/                   componentes
```

**A regra que sustenta tudo:** componente `.svelte` não chama repositório
direto, e nada em `domain/` conhece DOM ou rede. É o que permite testar 109
casos em menos de 1 segundo, sem navegador e sem emulador — e o que torna
possível rodar o app inteiro sem conta, trocando `FirestoreRepository` por
`MemoryRepository` sem tocar em nenhuma tela.

### Modelo de dados (Firestore)

```
users/{uid}                      perfil, corredores, estatísticas
households/{hid}                 famílias e membros
lists/{listId}                   { owner: user|household, ... }
lists/{listId}/items/{itemId}    escrita granular
purchases/{purchaseId}           compras finalizadas, imutáveis
priceEntries/{entryId}           preços pagos, imutáveis
householdInvites/{code}
```

`owner` decide quem lê e quem escreve, e é ele que torna possível mover uma
lista entre pessoal e família — troca de um campo, os itens acompanham sem
serem reescritos.

---

## Decisões de projeto

**Svelte, não React.** Bundle sem runtime, modelo mental próximo ao HTML
puro, e nenhuma decisão acessória de gerência de estado a tomar.

**Preço unitário, nunca total da linha.** "2 kg por R$ 18" e "1 kg por R$ 9"
são o mesmo preço; sem normalizar, comparar mercados vira ruído.

**Compras e preços são imutáveis.** As regras do Firestore proíbem
`update` nessas coleções — preço pago é fato consumado, corrige-se apagando
e lançando de novo.

**No merge, marcar vence desmarcar.** Duas pessoas no mercado marcando o
mesmo item quase nunca é conflito real; desmarcar é correção deliberada e
só prevalece se for mais recente.

**Leitura de cupom nunca grava sozinha.** O OCR (Tesseract.js, rodando no
navegador) produz candidatos com nota de confiança por linha; a tela de
revisão exige confirmação item a item antes de qualquer gravação.

---

## Deploy

Publicação automática via GitHub Actions + Firebase Hosting:

- **Pull Request** → build, testes, e deploy num **canal de preview**
  isolado (URL temporária, expira em 7 dias) — é a forma de testar uma
  mudança antes do merge, sem afetar quem já usa o app.
- **Push em `main`** (PR mesclado) → build, testes, e deploy no **canal
  live** (produção).

Nenhum dos dois publica se `npm run check` ou `npm run test` falhar.

Passo a passo completo, incluindo a configuração única de secrets do
GitHub e do Firebase: `IMPLANTACAO.md`.
