# TicTacToe2

Ultimate Tic-Tac-Toe (Super Jogo da Velha) — monorepo TypeScript estrito com
motor de domínio, IA offline e cliente/multiplayer em `packages/`, TDD
(`vitest`).

## Comandos

```bash
npm install
npm test          # vitest (35 testes)
npm run typecheck # tsc --noEmit
npx tsx packages/shared/scripts/bench.ts  # benchmark dos presets
```

## Estrutura

```
AGENTS.md          regras gerais do projeto
docs/prd/PRD.md    requisitos de produto
docs/tdd/TDD.md    desenho técnico
docs/specs/        especificações ativas (SPEC-XXX)
docs/specs/base/   referências de produto de onde nascem as SPECs
docs/adr/          decisões de arquitetura (ADR-001..005)
packages/shared/   domínio puro + IA: src/domain, src/ai, tests/, scripts/
packages/frontend/ cliente: src/worker (Web Worker da IA) e UI
packages/backend/  servidor autoritativo (PartyKit/Supabase)
vitest.config.ts   alias @ttt/shared/* → packages/shared/src/*
```

## API do domínio

```ts
import { createInitialState, legalMoves, applyMove, isTerminal } from '@ttt/shared/domain';

let state = createInitialState();      // livre, 81 jogadas
state = applyMove(state, { board: 4, cell: 4 });
// state.activeBoard === 4, state.player === 2
```

Funções puras: `(state, move) => newState`. Nenhum import externo, timer,
rede ou UI em `packages/shared/src/domain/`.

## IA

```ts
import { search } from '@ttt/shared/ai/mcts';
import { optionsFor } from '@ttt/shared/ai/difficulty';

const { move } = search(state, optionsFor('competitivo', 42));
```

- UCT negamax com `C` dinâmico (0,85 restrito / 1,25 jogada livre).
- Arena em `Int32Array`/`Float64Array`: um nó por iteração, sem objetos por nó.
- Rollout heurístico anti-suicídio (fecha trinca, bloqueia, evita Free Move).
- Determinístico para a mesma semente e o mesmo orçamento de iterações.
- Orçamento de 45 ms por lance nos presets (ver `docs/adr/ADR-004-orcamento-tempo.md`).

## Especificações e decisões

- `AGENTS.md` — convenções, fluxo de especificação e guardrails para contribuintes/agentes.
- `docs/prd/PRD.md` — requisitos de produto: pilares, personas, mecânicas, modos,
  economia F2P, NFRs e conformidade (v1.0.0, aprovado).
- `docs/tdd/TDD.md` — desenho técnico: Clean Architecture/monorepo, bitboards,
  MCTS, PartyKit/Supabase e estratégia de testes (v1.1.0, aprovado).
- `docs/specs/base/` — specs de produto de origem (regras, IA, multiplayer,
  F2P, UX, pagamentos, privacidade) com índice e status de fatiamento.
- `docs/specs/SPEC-001-regras-e-bitboards.md` — regras, bitboards, deadlock.
- `docs/specs/SPEC-002-mcts.md` — motor MCTS e contrato da API.
- `docs/adr/` — bitboard de 9 bits, estado imutável, arena, orçamento de
  tempo, estrutura do monorepo.

## Roadmap

- [x] SPEC-001: regras, bitboards, redirecionamento, Free Move, deadlock
- [x] SPEC-002: MCTS (selection/expansion/simulation/backpropagation)
- [x] Web Worker de transporte
- [x] Estrutura monorepo `packages/{shared,frontend,backend}` (ADR-005)
- [ ] SPEC-003: interface gráfica jogável (Trilha A)
- [ ] SPEC-004: multiplayer serverless + matchmaking (Trilha B)
- [ ] Zobrist hashing + tabela de transposição
- [ ] Serialização UTTT-FEN e replay DAN
- [ ] Mineração de puzzles (self-play + validação de unicidade)
