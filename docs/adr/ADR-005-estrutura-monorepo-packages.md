# ADR-005 — Estrutura do monorepo: `packages/shared` · `packages/frontend` · `packages/backend`

**Status:** Aceita  
**Data:** 28/10/2026  
**Decisão de:** Hiago (dono do projeto)  
**TDD relacionado:** [`docs/tdd/TDD.md`](../tdd/TDD.md) §1 (v1.1.0)

## Contexto

O TDD v1.0.0 descrevia quatro pacotes (`packages/core`, `packages/shared`,
`packages/ui`, `packages/party-server`), mas o código foi implementado em
`src/domain`, `src/ai`, `src/worker` (árvore plana, anterior à aprovação do
TDD). Com a UI (SPEC-003) e o servidor (SPEC-004) prestes a nascer, era
preciso decidir a árvore de diretórios antes de escrever os contratos —
os caminhos de cada task dependem dessa escolha.

Restrições:

- o domínio puro (regras, bitboards, MCTS) é consumido pelo **frontend**
  (partida offline contra o bot) e pelo **backend** (validação autoritativa
  e Ghost Bot);
- as trilhas A e B não podem compartilhar arquivos editáveis (guardrail do
  `AGENTS.md`);
- a raiz deve manter o `AGENTS.md` geral e a `docs/` organizada por tipo.

## Decisão

Árvore do repositório:

```
AGENTS.md            regras gerais do projeto (contribuintes e agentes)
docs/
  prd/PRD.md         requisitos de produto (v1.0.0)
  tdd/TDD.md         desenho técnico (v1.1.0)
  adr/               decisões de arquitetura (ADR-001..005)
  specs/             SPEC-XXX contratos ativos + specs/base/ de origem
packages/
  shared/            Domínio + Application: src/domain, src/ai,
                     src/contracts, tests/, scripts/
  backend/           Infrastructure: PartyKit/Durable Objects, Supabase
  frontend/          Presentation: src/worker, UI React/Canvas
vitest.config.ts     alias @ttt/shared/* → packages/shared/src/*
tsconfig.json        paths @ttt/shared/* e include de packages/*
```

1. **Um único pacote de domínio, `packages/shared`**, funde o `core` e o
   `shared` do TDD: regras/IA puras em `src/domain` e `src/ai` (zero
   dependências externas, zero DOM) e contratos em `src/contracts`.
2. **`packages/frontend`** recebe tudo que roda no navegador — hoje o Web
   Worker da IA, amanhã UI, áudio e renderização.
3. **`packages/backend`** recebe o servidor autoritativo (PartyKit,
   Supabase) — nasce na SPEC-004.
4. **Import entre pacotes** é feito só pelo alias `@ttt/shared/*`
   (`tsconfig.json` + `vitest.config.ts`); import relativo cruzando
   `../` entre pacotes é proibido.
5. **`package.json` por pacote e npm workspaces ficam para quando uma SPEC
   introduzir dependências** (React/Vite no frontend, PartyKit no backend).
   Hoje há um único `package.json` na raiz.
6. `docs/` é organizada por tipo (`prd/`, `tdd/`, `adr/`, `specs/`),
   sempre em minúsculas, com `AGENTS.md` na raiz.

## Alternativas consideradas

| Alternativa | Por que não |
| :--- | :--- |
| Manter os 4 pacotes do TDD (`core`+`shared`+`ui`+`party-server`) | Cria 4 pastas onde há 2 consumidores; o owner definiu `backend` + `frontend`. |
| Domínio dentro de `packages/backend` | Frontend dependeria do pacote "backend" e o bundle puxaria camada de servidor. |
| Domínio dentro de `packages/frontend` | PartyKit dependeria do pacote "frontend"; servidor ficaria acoplado à UI. |
| Adiar a decisão e manter `src/` | Toda SPEC escrita agora teria caminhos que mudariam depois (retrabalho em specs, testes e imports). |

## Consequências

- TDD atualizado para **v1.1.0** (§1.1, §1.2 e §6 renomeiam os pacotes;
  desenho técnico inalterado).
- `AGENTS.md`, `README.md`, `docs/specs/base/README.md` e as SPECs 001/002
  apontam para os caminhos novos.
- Código movido com `git mv` (histórico preservado): `src/domain|ai` →
  `packages/shared/src/`, `src/worker` → `packages/frontend/src/worker`,
  `tests/` e `scripts/` → `packages/shared/`.
- Verificado após a movida: `tsc --noEmit` limpo e 35/35 testes verdes.
- As SPECs 003 e 004 nascem escrevendo caminhos `packages/*` e contratos em
  `packages/shared/src/contracts/` (arquivo novo, propriedade da SPEC,
  read-only para as duas trilhas depois de aprovado).
