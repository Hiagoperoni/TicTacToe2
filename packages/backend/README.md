# `packages/backend` — Infrastructure (servidor)

Estado autoritativo serverless: PartyKit / Cloudflare Durable Objects,
relógio Fischer, Ghost Bot e persistência assíncrona no Supabase (RPC
`finalize_match`).

```
src/   servidor, FSM da sala, schemas Zod do protocolo (nasce na SPEC-004)
```

Importa do domínio só via `@ttt/shared/*`. Nenhuma task desta pasta pode
tocar em `packages/frontend` (guardrail de trilhas, ver `AGENTS.md`).
