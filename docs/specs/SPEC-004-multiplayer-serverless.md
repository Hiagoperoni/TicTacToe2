# SPEC-004 — Multiplayer autoritativo serverless (sala, protocolo e resiliência)

Fonte: [`base/03-multiplayer-serverless-matchmaking.md`](base/03-multiplayer-serverless-matchmaking.md) §2–5,
[`docs/prd/PRD.md`](../prd/PRD.md) §5.1, §7.2,
[`docs/tdd/TDD.md`](../tdd/TDD.md) §4 (v1.1.0),
[ADR-005](../adr/ADR-005-estrutura-monorepo-packages.md).

Papel no roadmap: **Passo 2** — Trilha B (Engine/Infra) dominante; a Trilha A
entrega o cliente WebSocket e a integração com a UI existente. Issue Linear:
**TIC-10**.

## 0. Rastreabilidade (requisito → origem)

| ID | Requisito | Origem |
| :--- | :--- | :--- |
| R4.1 | Sala = actor isolado na borda, roteado por `idFromName(match_id)` (UUID v4) | PRD §5.1 · base03 §2.1 |
| R4.2 | FSM da sala com fases rígidas (requisição fora de fase é descartada) | TDD §4.1 · base03 §4.1 |
| R4.3 | Protocolo WebSocket JSON validado por Zod + `seq` por canal | TDD §4.2 · base03 §3 |
| R4.4 | Session resumption: `resume_token` HMAC-SHA256, janela de graça de 30 s (Alarms) | PRD §5.1 · base03 §4.2 |
| R4.5 | Relógio Fischer autoritativo + compensação `L_oneway = RTT/2` + drift 200 ms | PRD §7.2 · TDD §4.3 · base03 §5 |
| R4.6 | Frame ≤ 16 KB (`1009`), 10 msgs/s por conexão (`1008`), 5 conn/s por IP (`429`) | PRD §7.2 |
| R4.7 | Autoridade total do servidor: validação com o domínio compartilhado; `MOVE_REJECTED` ⇒ rollback no cliente | base03 §3.2 · AGENTS.md |
| R4.8 | Zero-PII: ids opacos + HMAC; nenhum estado de partida persistido durante o jogo | PRD §8.1 · base03 §8 |

## 1. Contrato TypeScript (fronteira client ↔ servidor)

**Task 0 (pré-dispatch):** os arquivos novos abaixo são criados junto com a
aprovação desta SPEC e ficam **read-only** para as duas trilhas depois do
dispatch (AGENTS.md). `zod` entra como dependência na Task B1.

### 1.1 `packages/shared/src/contracts/server-protocol.ts`

Esquemas de `TDD §4.2` + eventos de `base03 §3`:

```ts
import { z } from 'zod';
import { GameStatePayloadSchema } from './game-state';

/** MovePayloadSchema — TDD §4.2, literal. */
export const MovePayloadSchema = z.object({
  cellIndex: z.number().int().min(0).max(80),
  macroIndex: z.number().int().min(0).max(8),
  microIndex: z.number().int().min(0).max(8),
  dan: z.string().regex(/^[A-C]\.[a-c]$/),
  pieSwap: z.boolean().default(false),
}).strict();

export const RoomStatusSchema = z.enum([
  'WAITING_PLAYERS', 'READY_CHECK', 'IN_PROGRESS',
  'DISCONNECTED_GRACE_PERIOD', 'FINISHED',
]);

export const ClientEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('JOIN_ROOM'), roomId: z.string().uuid(), token: z.string() }),
  z.object({ type: z.literal('READY') }),
  z.object({ type: z.literal('SUBMIT_MOVE'), sequence: z.number().int().positive(), payload: MovePayloadSchema, clientTime: z.number() }),
  z.object({ type: z.literal('PING_SYNC'), clientTime: z.number() }),
  z.object({ type: z.literal('SURRENDER') }),
]);

export const ServerEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ROOM_STATE_SNAPSHOT'), roomId: z.string().uuid(), state: GameStatePayloadSchema, turn: z.union([z.literal(1), z.literal(2)]), clocks: z.object({ p1: z.number(), p2: z.number() }), sequence: z.number().int().nonnegative(), status: RoomStatusSchema }),
  z.object({ type: z.literal('MOVE_ACCEPTED'), move: MovePayloadSchema, state: GameStatePayloadSchema, turn: z.union([z.literal(1), z.literal(2)]), clocks: z.object({ p1: z.number(), p2: z.number() }), sequence: z.number().int().positive() }),
  z.object({ type: z.literal('MOVE_REJECTED'), reason: z.string(), state: GameStatePayloadSchema }),
  z.object({ type: z.literal('CLOCK_UPDATE'), p1: z.number(), p2: z.number(), active: z.union([z.literal(1), z.literal(2)]) }),
  z.object({ type: z.literal('GAME_OVER'), winner: z.union([z.literal(1), z.literal(2)]).nullable(), reason: z.enum(['WIN', 'TIMEOUT', 'RESIGNATION', 'WO']) }),
  z.object({ type: z.literal('OPPONENT_STATUS'), status: z.enum(['DISCONNECTED', 'RECONNECTED']), graceMs: z.number().nonnegative() }),
  z.object({ type: z.literal('PONG_SYNC'), serverTime: z.number() }),
  z.object({ type: z.literal('ERROR'), code: z.string() }),
]);

export type ClientEvent = z.infer<typeof ClientEventSchema>;
export type ServerEvent = z.infer<typeof ServerEventSchema>;
```

`MovePayloadSchema` é o de `TDD §4.2` sem alteração (`cellIndex` 0..80,
`macroIndex`/`microIndex` 0..8, `dan` regex `^[A-C]\.[a-c]$`, `pieSwap`
default `false` — `dan`/`pieSwap` são reservados para replay/Pie Rule e
validados, porém ignorados pelo servidor nesta spec). O servidor rejeita
payload em que `cellIndex !== macroIndex * 9 + microIndex`.

### 1.2 `packages/shared/src/contracts/game-state.ts`

Serialização do domínio para a rede (o `GameState` tem `Uint16Array`, não
serializável em JSON):

```ts
export const GameStatePayloadSchema = z.object({
  x: z.array(z.number().int().min(0)).max(9),
  o: z.array(z.number().int().min(0)).max(9),
  activeBoard: z.number().int().min(0).max(8).nullable(),
  player: z.union([z.literal(1), z.literal(2)]),
  moveCount: z.number().int().min(0),
}).strict();

export type GameStatePayload = z.infer<typeof GameStatePayloadSchema>;
export function encodeGameState(state: GameState): GameStatePayload;
export function decodeGameState(payload: GameStatePayload): GameState; // stateFromBoards + validações
```

### 1.3 `packages/shared/src/contracts/online-session.ts`

```ts
export interface OnlineSnapshot {
  readonly state: GameState;
  readonly status: RoomStatus;
  readonly myPlayer: Player;
  readonly turn: Player;
  readonly clocks: { readonly p1: number; readonly p2: number }; // ms autoritativos
  readonly opponentConnected: boolean;
  readonly pending: 'idle' | 'awaiting-server'; // optimistic UI
}

export interface OnlineSession {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => OnlineSnapshot;
  readonly submit: (move: Move) => void; // otimista; MOVE_REJECTED ⇒ rollback
  readonly surrender: () => void;
}
```

### 1.4 `resume_token` (formato — implementação em `packages/backend`)

`Base64URL(match_id ‖ player_id ‖ expires_at ‖ HMAC-SHA256(secret, data))`
(base03 §4.2). `secret` vem de variável de ambiente; `player_id` é opaco
(Zero-PII). Verificação: assinatura válida + `match_id`/`player_id` batem +
`expires_at` no futuro.

## 2. Invariantes (critérios de aceitação)

1. **Autoridade total**: o servidor valida toda jogada com
   `isLegalMove`/`applyMove` de `@ttt/shared/domain`; cliente nunca aplica
   regra (R4.7). `RangeError` ⇒ `MOVE_REJECTED` + snapshot autoritativo.
2. **FSM rígida** (R4.2): mensagem fora da fase atual é descartada sem alterar
   estado; `seq` monotônico por sala (payload fora de ordem ⇒ descarte/erro).
3. **Limites de rede** (R4.6): frame > 16 KB ⇒ fechamento `1009`; > 10 msgs/s
   na conexão ⇒ `ERROR`/`1008`; > 5 conexões/s por IP ⇒ HTTP `429` (contagem
   volátil, sem log de IP).
4. **Relógio só no servidor** (R4.5): decremento por `Fischer`; se
   `|(Δt_servidor − L_oneway) − Δt_cliente| > 200 ms`, ignora o cliente;
   modos do PRD §4.1 (Bullet 60+1, Blitz 120+2, Rápido 180+3, Competitivo
   300+5).
5. **Resiliência** (R4.4): desconexão em `IN_PROGRESS` ⇒ graça de 30 s
   (alarme garantido); reconexão com `resume_token` válido dentro da janela ⇒
   `ROOM_STATE_SNAPSHOT` e retomada; expirado/inválido ⇒ `GAME_OVER reason:WO`.
6. **Sem persistência durante a partida** (R4.8): estado vive só no actor;
   nada de Supabase/Storage nesta spec; logs sem IP/PII.
7. **Contrato único** (R4.3): frontend e backend só conversam via
   `packages/shared/src/contracts/*`; zero import cruzado de pacotes.

## 3. Máquina de estados da sala (TDD §4.1)

| Origem | Evento | Destino | Guarda/ação |
| :--- | :--- | :--- | :--- |
| `WAITING_PLAYERS` | 2 jogadores conectados | `READY_CHECK` | associa sockets; timer de 10 s |
| `READY_CHECK` | `READY` de ambos | `IN_PROGRESS` | sorteia inicial; inicia Fischer; emite `resume_token` |
| `READY_CHECK` | timeout 10 s | `FINISHED` | cancela sem MMR |
| `IN_PROGRESS` | `webSocketClose` | `DISCONNECTED_GRACE_PERIOD` | pausa turno; alarme +30 s; `OPPONENT_STATUS` |
| `DISCONNECTED_GRACE_PERIOD` | `JOIN_ROOM` + token válido | `IN_PROGRESS` | cancela alarme; `ROOM_STATE_SNAPSHOT` |
| `DISCONNECTED_GRACE_PERIOD` | alarme expira | `FINISHED` | `GAME_OVER reason:WO` |
| `IN_PROGRESS` | terminal / `SURRENDER` / timeout | `FINISHED` | congela sala; `GAME_OVER` |

## 4. Matriz de tarefas (paralelas, sem colisão de arquivos)

### Trilha B — servidor autoritativo (sem UI)

| # | Arquivos exatos | Depende de | Done Definition |
| :--- | :--- | :--- | :--- |
| B1 | `package.json` raiz (workspaces, `zod`) · `packages/backend/package.json` · `packages/backend/tsconfig.json` · **runner: Node 20 + `ws` (ADR-007)** | — | `npm install` + `tsc --noEmit` limpos |
| B2 | `packages/shared/src/contracts/server-protocol.ts` · `game-state.ts` · `online-session.ts` (Task 0) · **endurecimento de `stateFromBoards`** (`packages/shared/src/domain/rules.ts`: `activeBoard` fora de 0..8 ou sub-tabuleiro resolvido ⇒ `RangeError` — corrige débito conhecido) | B1 | `packages/shared/tests/contracts/server-protocol.test.ts` + teste novo de `stateFromBoards` verde; suíte antiga verde |
| B3 | `packages/backend/src/room/fsm.ts` (transições puras da §3) | B1 | `packages/backend/tests/fsm.test.ts` cobre todas as linhas da tabela |
| B4 | `packages/backend/src/clock/fischer.ts` (Fischer + `L_oneway` + drift 200 ms) · `packages/backend/src/net/limits.ts` (16 KB, 10/s, 5 conn/s) | B1 | `packages/backend/tests/clock.test.ts` e `packages/backend/tests/limits.test.ts` verde |
| B5 | `packages/backend/src/room/resume-token.ts` (issue/verify HMAC-SHA256) | B1 | `packages/backend/tests/resume-token.test.ts` verde (assinatura, expiração, troca de `player_id`) |
| B6 | `packages/backend/src/room/room.ts` (actor: wiring FSM+clock+limits+token, handlers `connect/message/close/alarm`, broadcast) · `packages/backend/tests/room.test.ts` | B2–B5 | integração: 2 sockets simulados completam uma partida ponta a ponta |

### Trilha A — cliente WebSocket (UI intocada)

| # | Arquivos exatos | Depende de | Done Definition |
| :--- | :--- | :--- | :--- |
| A1 | `packages/frontend/src/net/room-client.ts` (`OnlineSession` sobre WS: connect/`JOIN_ROOM`/reconexão com `resume_token`, valida `ServerEventSchema`) · `packages/frontend/tests/net/room-client.test.ts` (WebSocket fake) | Task 0 (B2) | cliente conecta, recebe snapshot, rejeita evento inválido, reconecta |
| A2 | `packages/frontend/src/mocks/mock-room.ts` (servidor fake em memória que emite os `ServerEvent`s) | Task 0 | UI e testes rodam sem backend (guardrail de mocks) |
| A3 | `packages/frontend/src/session/online-session.ts` (controller `OnlineSession` sobre `RoomClient`: optimistic submit + rollback em `MOVE_REJECTED`, relógios) · `packages/frontend/tests/session/online-session.test.ts` | A1, A2 | jogada otimista + rollback + `GAME_OVER` testados |

Trilhas não colidem: B edita `packages/backend` + `packages/shared/src`
(raiz só em B1); A edita apenas `packages/frontend`.

## 5. Casos de teste obrigatórios

1. `packages/shared/tests/contracts/server-protocol.test.ts` — todo evento
   válido passa no Zod; payloads malformados (tipo errado, `cellIndex`
   fora de 0..8, `cellIndex !== macro*9+micro`, campo extra) falham;
   `encodeGameState`/`decodeGameState` round-trip idêntico.
2. `packages/shared/tests/domain/rules.test.ts` (atualizado) —
   `stateFromBoards` com `activeBoard` fora de range ou em sub-tabuleiro
   resolvido lança `RangeError`.
3. `packages/backend/tests/fsm.test.ts` — todas as transições da §3,
   inclusive descarte de evento fora de fase.
4. `packages/backend/tests/clock.test.ts` — Fischer com incremento; drift
   > 200 ms ignora `clientTime`; relógio nunca fica negativo.
5. `packages/backend/tests/limits.test.ts` — frame de 17 KB ⇒ `1009`;
   11ª msg/s ⇒ `1008`; 6ª conn/s ⇒ `429`.
6. `packages/backend/tests/resume-token.test.ts` — verificação OK; token
   adulterado/expirado/wrong player ⇒ rejeição.
7. `packages/backend/tests/room.test.ts` (integração) — partida completa de
   2 clientes; desconexão ⇒ graça 30 s ⇒ reconexão retoma sem perda;
   W.O. ao expirar; jogada ilegal ⇒ `MOVE_REJECTED` com estado autoritativo.
8. `packages/frontend/tests/session/online-session.test.ts` — otimismo,
   rollback e relógios com `mock-room`.

## 6. Done Definition global

- `npx tsc --noEmit` com 0 erros e `npx vitest run` 100% verde (suíte atual +
  novos testes) antes de qualquer PR.
- Integração da §5.7 passa sem tocar em `packages/frontend/src/ui/**`.
- Nenhum `any`/`@ts-ignore`/`TODO`; arquivos ≤ 300 linhas; zero PII em código
  ou logs; push sempre em branch com PR (AGENTS.md).

## 7. Fora de escopo desta spec

Fila de matchmaking, janela ΔMMR, Glicko-2 e Ghost Bot (base03 §6 → SPEC
futura); persistência Supabase/`finalize_match`/leaderboards (base03 §8 ·
TDD §5 → SPEC futura); anti-cheat comportamental (entropia/CPL, base03 §7);
variantes
de tabuleiro, Pie Rule no servidor, replay DAN/PGN; espectadores.

## 8. Validação

Tech Lead valida antes do dispatch (AGENTS.md §fluxo de especificação).
Implementação: issue **TIC-13** (Trilha B) com contrato via **TIC-10**;
cliente via Trilha A da mesma SPEC.
