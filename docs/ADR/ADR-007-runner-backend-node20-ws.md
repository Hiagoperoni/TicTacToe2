# ADR-007 — Runner do backend autoritativo: Node 20 + `ws`, actor em memória por sala

- **Status:** Aceita
- **Data:** 2026-10-28
- **Issue:** [TIC-17](https://linear.app/tictactoe2/issue/TIC-17)
- **Decisores:** O Mais (Tech Lead) + Béquin (Back-Ender); regra executiva do Mandão: simplicidade > performance quando empate (PRD)

## Contexto

A SPEC-004 (Trilha B — multiplayer serverless) modela o backend como **actor por sala** (FSM pura §3, relógio Fischer servidor-only §2.4, limites de rede §2.3, `resume_token` — SPEC-004 §1.4 · base03 §4.2), mas ainda citava artefatos de PartyKit (`packages/backend/partykit.json` na B1; hibernation/`serializeAttachment` no §7) — **PartyKit foi excluído da decisão executiva** e o runner ficou indefinido. As tasks B1 (setup) e B3 (FSM pura) progridem sem essa decisão; B6 (sala/actor, integração com sockets) não.

Requisitos do runner: WebSocket JSON + zod (via `@ttt/shared/contracts`, PR #2), 2 jogadores/sala, reconexão com `resume_token`, sem persistência durante a partida, Zero-PII, testes com sockets simulados (Done Definition da B6).

## Decisão

**Node 20 + biblioteca `ws`; actor como objeto em memória por sala**, em `packages/backend`:

- Uma instância de `Room` por sala (`packages/backend/src/room/room.ts`), encapsulando FSM + clock + limits + token; unidade de isolamento = sala, como modelado na SPEC.
- Deploy via Docker/host como processo único; **hibernação/`serializeAttachment` ficam fora de escopo** (otimização de custo → SPEC futura; a sala é volátil — desconexão sem reconexão já resolve WO pela FSM §3).
- Testes de B6 usam sockets simulados em memória (sem rede real), já definidos pela SPEC.

Rationale: zero custo adicional, zero risco de incompatibilidade de runtime (zod 4, node 20 LTS), deploy trivial, e nenhum ganho de performance exigido pelo PRD justifica o setup de bindings/wrangler dos Durable Objects.

## Consequências

- ✅ B6 desbloqueado; B1 vira `packages/backend/package.json` + `tsconfig.json` (sem `partykit.json`).
- ⚠️ **Correção de SPEC-004:** B1 não cita mais `partykit.json`; hibernation/`serializeAttachment` saem do §7 e voltam só numa SPEC futura de otimização (edição já incluída neste PR).
- ⚠️ Escala vertical: salas em memória em 1 processo — quando houver persistência/multi-processo, reavaliar (SPEC de matchmaking/persistência, base03 §8, já listada como futura).
- ❌ Alternativas rejeitadas: Cloudflare Durable Objects (actor nativo, mas setup/locação/testes mais pesados; custo em volume baixo); Bun/Deno + ws (runtimes menos maduros para o tooling atual do time).

## Referências

- SPEC-004-multiplayer-serverless.md (§1, §2.3–2.6, §3, §4)
- ADR-001 (bitboard 9 bits) — validação de lance autoritativa no servidor via `@ttt/shared/domain`
- ADR-005 (monorepo packages/)
- PR #2 (contratos de rede)
