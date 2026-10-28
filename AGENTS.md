# AGENTS.md — Ultimate Tic-Tac-Toe (TicTacToe2)

Monorepo TypeScript do Ultimate Tic-Tac-Toe: motor de domínio e IA offline
(`packages/shared`), cliente jogável (`packages/frontend`) e multiplayer
serverless (`packages/backend`), com TDD (`vitest`). Evoluindo em direção a
interface jogável, multiplayer (PartyKit) e economia F2P.

Estrutura de pastas e nomenclatura de pacotes conforme
[`docs/adr/ADR-005-estrutura-monorepo-packages.md`](docs/adr/ADR-005-estrutura-monorepo-packages.md).

## Comandos

```bash
npm install
npm test              # vitest run (test suite inteira)
npm run test:watch    # vitest em watch mode (TDD)
npm run typecheck     # tsc --noEmit — deve passar sempre
npx tsx packages/shared/scripts/bench.ts  # benchmark dos presets
```

Regra: nenhuma task é entregue com `typecheck` ou testes vermelhos.

## Estrutura

```
AGENTS.md             regras gerais do projeto (este arquivo)
docs/prd/PRD.md       requisitos de produto (v1.0.0, aprovado)
docs/tdd/TDD.md       desenho técnico (v1.1.0, aprovado)
docs/adr/             decisões estruturais (ADR-001..005)
docs/specs/           SPEC-XXX contratos ativos (fonte da verdade p/ dev)
docs/specs/base/      referências de produto de onde nascem as SPECs

packages/shared/      Domínio + Application — ZERO dependências externas
  src/domain/         regras puras + bitboards
  src/ai/             MCTS (arena), rollout, PRNG, dificuldades
  src/contracts/      tipos/Zod compartilhados (criados por SPECs)
  tests/              espelho de src/: domain/ e ai/
  scripts/            benchmark
packages/frontend/    Presentation — roda no navegador
  src/worker/         Web Worker: estado → jogada (já existe)
  src/                UI React/Canvas (nascem na SPEC-003)
packages/backend/     Infrastructure — PartyKit/Durable Objects + Supabase
  src/                servidor autoritativo (nasce na SPEC-004)
vitest.config.ts      alias @ttt/shared/* → packages/shared/src/*
tsconfig.json         paths @ttt/shared/* · include de packages/*
```

## Convenções

- **Domínio puro**: `packages/shared/src/domain/` não importa nada externo,
  não usa timer, rede, DOM nem UI. Funções puras `(state, move) => newState`.
- **Import entre pacotes**: só pelo alias `@ttt/shared/*`
  (ex.: `import { applyMove } from '@ttt/shared/domain'`). Import relativo
  cruzando `../` de um pacote para outro é proibido.
- **Estado imutável**: `readonly` nos tipos; nunca mutar `GameState`.
- **Nomenclatura**: código e identificadores em inglês; docs, comentários e
  ADRs em português. Arquivos kebab-case. Pastas de `docs/` em minúsculas.
- **Numeração SPEC-XXX**: sequencial, em `docs/specs/SPEC-XXX-<slug>.md`;
  ADRs em `docs/adr/ADR-NNN-<slug>.md`.
- **PRNG determinístico**: toda busca aceita semente; mesma semente + mesmo
  orçamento ⇒ mesma jogada.
- **TDD**: escrever teste falhando primeiro em `packages/shared/tests/`
  (ou no teste do pacote correspondente), depois implementar.

## Fluxo de especificação (obrigatório antes de dev)

1. Requisito vem de `docs/prd/PRD.md` e `docs/tdd/TDD.md`, de
   `docs/specs/base/*` ou de pedido direto do usuário.
2. Escrever `docs/specs/SPEC-XXX-*.md` contendo:
   - contrato TypeScript das interfaces de fronteira (client ↔ engine,
     client ↔ servidor);
   - matriz de tarefas paralelas **Trilha A (Client/UI/Hooks)** e
     **Trilha B (Engine/Multiplayer/Infra)** com arquivos exatos por task;
   - critério de aceite mensurável ("Done Definition") por task.
3. Submeter ao Tech Lead para validação antes do dispatch.
4. Decisão estrutural → ADR novo em `docs/adr/ADR-NNN-<slug>.md`.

## Guardrails de fatiamento

- PROIBIDO duas tasks na mesma branch/arquivo que forcem um dev a esperar
  o outro. Se elas colidirem, refatorar o corte.
- PROIBIDO requisito ambíguo: sem contrato de tipos TypeScript ou sem
  critério de aceite testável, a task não existe.
- Trilha A usa **mocks do contrato** (implementação fake em
  `packages/frontend/src/mocks/`); Trilha B não toca em UI.
- Contratos compartilhados ficam em `packages/shared/src/contracts/`,
  arquivo novo de propriedade da SPEC que o cria; depois de aprovado é
  read-only para ambas as trilhas.
- Frontend e backend só conversam via contratos de `packages/shared` —
  nenhum import de `packages/frontend` em `packages/backend` ou vice-versa.

## Roadmap atual

- [x] SPEC-001 regras/bitboards · [x] SPEC-002 MCTS · [x] Web Worker
- [x] Estrutura monorepo `packages/{shared,frontend,backend}` (ADR-005)
- [ ] **Passo 1 — SPEC-003 interface jogável** (Trilha A, com mocks)
- [ ] **Passo 2 — SPEC-004 multiplayer serverless** (Trilha B, base 03)
- [ ] Zobrist + transposição · UTTT-FEN/replay DAN · mineração de puzzles
- [ ] Pie Rule, relógio Fischer e variantes (bases 01/03/05)
- [ ] Economia F2P e pagamentos (bases 04, 06) — após multiplayer
- [ ] Privacidade/AppSec (base 07) — checklist por release
