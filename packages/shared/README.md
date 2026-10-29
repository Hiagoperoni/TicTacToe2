# `packages/shared` — Domínio + Application

Núcleo puro do jogo, consumido por `frontend` e `backend` **exclusivamente**
pelo alias `@ttt/shared/*`.

```
src/domain/      regras, bitboards, FSM — ZERO dependências externas, sem DOM/timer/rede
src/ai/          MCTS (arena), rollout, PRNG, presets de dificuldade
src/contracts/   tipos e schemas compartilhados (criados por SPECs, read-only após aprovação)
tests/           espelho de src/: domain/ e ai/ (vitest)
scripts/         benchmark: npx tsx packages/shared/scripts/bench.ts
```

Regras: funções puras `(state, move) => newState`, estado `readonly`,
PRNG determinístico por semente. Ver `AGENTS.md` na raiz.
