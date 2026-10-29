# `packages/frontend` — Presentation (cliente)

Tudo que roda no navegador.

```
src/worker/    Web Worker da IA: recebe estado + dificuldade, devolve a jogada
src/           UI React/Canvas, áudio, Smart Auto-Zoom (nasce na SPEC-003)
src/mocks/     mocks do contrato p/ Trilha A (nasce na SPEC-003)
```

Importa do domínio só via `@ttt/shared/*`. Nenhuma task desta pasta pode
tocar em `packages/backend` (guardrail de trilhas, ver `AGENTS.md`).
