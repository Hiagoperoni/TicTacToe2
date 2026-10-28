# TicTacToe2

Ultimate Tic-Tac-Toe (Super Jogo da Velha) — motor de domínio e IA offline em
TypeScript estrito, com TDD (`vitest`).

## Comandos

```bash
npm install
npm test          # vitest (35 testes)
npm run typecheck # tsc --noEmit
npx tsx scripts/bench.ts  # benchmark dos presets de dificuldade
```

## Estrutura

```
src/domain/    regras puras, bitboards, zero dependências externas
src/ai/        MCTS (arena), políticas de rollout, PRNG, dificuldades
src/worker/    Web Worker que transporta estado → jogada
tests/         TDD: bitboards, regras, invariantes, política, MCTS
docs/specs/    especificações ativas
docs/ADR/      decisões de arquitetura
scripts/       benchmark
```

## API do domínio

```ts
import { createInitialState, legalMoves, applyMove, isTerminal } from './src/domain';

let state = createInitialState();      // livre, 81 jogadas
state = applyMove(state, { board: 4, cell: 4 });
// state.activeBoard === 4, state.player === 2
```

Funções puras: `(state, move) => newState`. Nenhum import externo, timer,
rede ou UI em `src/domain/`.

## IA

```ts
import { search } from './src/ai/mcts';
import { optionsFor } from './src/ai/difficulty';

const { move } = search(state, optionsFor('competitivo', 42));
```

- UCT negamax com `C` dinâmico (0,85 restrito / 1,25 jogada livre).
- Arena em `Int32Array`/`Float64Array`: um nó por iteração, sem objetos por nó.
- Rollout heurístico anti-suicídio (fecha trinca, bloqueia, evita Free Move).
- Determinístico para a mesma semente e o mesmo orçamento de iterações.
- Orçamento de 45 ms por lance nos presets (ver `docs/ADR/ADR-004`).

## Especificações e decisões

- `docs/specs/SPEC-001-regras-e-bitboards.md` — regras, bitboards, deadlock.
- `docs/specs/SPEC-002-mcts.md` — motor MCTS e contrato da API.
- `docs/ADR/` — bitboard de 9 bits, estado imutável, arena, orçamento de tempo.

## Roadmap

- [x] SPEC-001: regras, bitboards, redirecionamento, Free Move, deadlock
- [x] SPEC-002: MCTS (selection/expansion/simulation/backpropagation)
- [x] Web Worker de transporte
- [ ] Interface gráfica (tabuleiro jogável)
- [ ] Zobrist hashing + tabela de transposição
- [ ] Serialização UTTT-FEN e replay DAN
- [ ] Mineração de puzzles (self-play + validação de unicidade)
