# AGENTS.md — Ultimate Tic-Tac-Toe (TicTacToe2)

Motor de domínio e IA offline de Ultimate Tic-Tac-Toe em TypeScript estrito,
com TDD (`vitest`). Evoluindo em direção a cliente jogável, multiplayer
serverless (PartyKit) e economia F2P.

## Comandos

```bash
npm install
npm test              # vitest run (test suite inteira)
npm run test:watch    # vitest em watch mode (TDD)
npm run typecheck     # tsc --noEmit — deve passar sempre
npx tsx scripts/bench.ts  # benchmark dos presets de dificuldade
```

Regra: nenhuma task é entregue com `typecheck` ou testes vermelhos.

## Estrutura

```
src/domain/     regras puras + bitboards — ZERO dependências externas
src/ai/         MCTS (arena), rollout, PRNG, dificuldades
src/worker/     Web Worker: estado → jogada
tests/          espelho de src/: domain/ e ai/
docs/PRD.md     requisitos de produto (v1.0.0, aprovado)
docs/TDD.md     desenho técnico (v1.0.0, aprovado)
docs/specs/     SPEC-XXX contratos ativos (fonte da verdade p/ dev)
docs/specs/base/  referências de produto de onde nascem as SPECs
docs/ADR/       decisões estruturais (bitboard, imutabilidade, arena, tempo)
scripts/        benchmark
```

## Convenções

- **Domínio puro**: `src/domain/` não importa nada externo, não usa timer,
  rede, DOM nem UI. Funções puras `(state, move) => newState`.
- **Estado imutável**: `readonly` nos tipos; nunca mutar `GameState`.
- **Nomenclatura**: código e identificadores em inglês; docs, comentários e
  ADRs em português. Arquivos kebab-case.
- **Numeração SPEC-XXX**: sequencial, em `docs/specs/SPEC-XXX-<slug>.md`.
- **PRNG determinístico**: toda busca aceita semente; mesma semente + mesmo
  orçamento ⇒ mesma jogada.
- **TDD**: escrever teste falhando primeiro em `tests/`, depois implementar.

## Fluxo de especificação (obrigatório antes de dev)

1. Requisito vem de `docs/PRD.md` e `docs/TDD.md`, de `docs/specs/base/*`
   ou de pedido direto do usuário.
2. Escrever `docs/specs/SPEC-XXX-*.md` contendo:
   - contrato TypeScript das interfaces de fronteira (client ↔ engine,
     client ↔ servidor);
   - matriz de tarefas paralelas **Trilha A (Client/UI/Hooks)** e
     **Trilha B (Engine/Multiplayer/Infra)** com arquivos exatos por task;
   - critério de aceite mensurável ("Done Definition") por task.
3. Submeter ao Tech Lead para validação antes do dispatch.
4. Decisão estrutural → ADR novo em `docs/ADR/ADR-NNN-<slug>.md`.

## Guardrails de fatiamento

- PROIBIDO duas tasks na mesma branch/arquivo que forcem um dev a esperar
  o outro. Se elas colidem, refatorar o corte.
- PROIBIDO requisito ambíguo: sem contrato de tipos TypeScript ou sem
  critério de aceite testável, a task não existe.
- Trilha A usa **mocks do contrato** (implementação fake em
  `tests/mocks/` ou `src/contracts/mock.ts`); Trilha B não toca em UI.
- Contratos compartilhados ficam em arquivos novos, de propriedade da
  SPEC que os cria; depois disso são read-only para ambas as trilhas.

## Roadmap atual

- [x] SPEC-001 regras/bitboards · [x] SPEC-002 MCTS · [x] Web Worker
- [ ] Interface gráfica (tabuleiro jogável) — Trilha A
- [ ] Multiplayer serverless + matchmaking (base 03) — Trilha B
- [ ] Zobrist + transposição · UTTT-FEN/replay · mineração de puzzles
- [ ] Economia F2P e pagamentos (bases 04, 06) — após multiplayer
- [ ] Privacidade/AppSec (base 07) — checklist por release
