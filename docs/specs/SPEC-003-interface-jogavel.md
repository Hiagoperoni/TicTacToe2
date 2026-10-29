# SPEC-003 — Interface jogável (UX mobile, game feel e cliente da IA)

Fonte: [`base/05-ux-mobile-gamefeel-ai-harness.md`](base/05-ux-mobile-gamefeel-ai-harness.md),
[`docs/prd/PRD.md`](../prd/PRD.md) §4.1–4.2, §7.1, §7.3,
[`docs/tdd/TDD.md`](../tdd/TDD.md) §1.2 e §6.3,
[ADR-005](../adr/ADR-005-estrutura-monorepo-packages.md).

Papel no roadmap: **Passo 1** — Trilha A (Client/UI) dominante; a Trilha B
entrega contrato + sessão pura em `packages/shared` (sem UI). Issue Linear:
**TIC-8**.

## 0. Rastreabilidade (requisito → origem)

| ID | Requisito | Origem |
| :--- | :--- | :--- |
| R3.1 | Smart Auto-Zoom 220–280% enquadrando 85% do viewport; alvos ≥ 48×48 px | PRD §7.3 · base05 §1.1 |
| R3.2 | Two-Step Confirmation: toque 1 pré-seleciona, toque 2 confirma | PRD §7.3 · base05 §1.1 |
| R3.3 | Semiótica: quadrante ativo pulsando 1,2 Hz, ghost do destino do oponente, overlay de quadrante finalizado | base05 §1.2–1.3 |
| R3.4 | Game feel: molas amortecidas (k/d/m da tabela), screen shake em erro | base05 §2.1 |
| R3.5 | Áudio 100% sintético (Web Audio API), zero arquivos de mídia, `AudioContext` por gesto | PRD §7.3 · base05 §2.2 |
| R3.6 | IA no Web Worker com as 4 dificuldades (SPEC-002) | PRD §4.2 · SPEC-002 |
| R3.7 | 60 FPS, bundle < 2 MB, RAM < 50 MB | PRD §7.1 |
| R3.8 | Arquivo ≤ 300 linhas, `strict` sem `any`/`@ts-ignore`/`TODO` | base05 §3.2 · AGENTS.md |
| R3.9 | Mocks só na fronteira, em `packages/frontend/src/mocks/` | AGENTS.md (guardrails) |

## 1. Contrato TypeScript (fronteira client ↔ engine/sessão)

**Task 0 (pré-dispatch):** os arquivos novos abaixo são criados junto com a
aprovação desta SPEC e ficam **read-only** para as duas trilhas depois do
dispatch (AGENTS.md).

### 1.1 `packages/shared/src/contracts/ai-worker.ts`

Tipos movidos de `packages/frontend/src/worker/ai.worker.ts` (assinaturas
inalteradas; o worker passa a importar daqui):

```ts
import type { GameState } from '../domain';
import type { Difficulty } from '../ai/difficulty';

export interface AiRequest {
  readonly id: number;
  readonly state: GameState;
  readonly difficulty: Difficulty;
  readonly seed: number;
}

export interface AiResponse {
  readonly id: number;
  readonly move: { readonly board: number; readonly cell: number } | null;
  readonly iterations: number;
  readonly elapsedMs: number;
}

/** Fronteira única sessão ↔ IA: worker real em produção, fake em teste/demo. */
export interface AiPort {
  readonly request: (request: AiRequest) => Promise<AiResponse>;
}
```

### 1.2 `packages/shared/src/contracts/game-session.ts`

```ts
import type { GameState, Move, Player } from '../domain';
import type { Difficulty } from '../ai/difficulty';

export type MatchMode = 'vs-ai' | 'local-2p';

export interface GameSnapshot {
  readonly state: GameState;
  readonly mode: MatchMode;
  readonly difficulty: Difficulty;
  readonly turn: Player;
  /** true enquanto a IA calcula: a UI bloqueia toques do oponente. */
  readonly aiPending: boolean;
  readonly lastMove: Move | null;
}

export interface ResetOptions {
  readonly seed?: number;
  readonly difficulty?: Difficulty;
  readonly mode?: MatchMode;
}

export interface GameSession {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => GameSnapshot;
  /** Jogada do jogador atual. Ilegal lança RangeError e não muda o snapshot. */
  readonly play: (move: Move) => void;
  readonly reset: (options?: ResetOptions) => void;
  readonly setDifficulty: (difficulty: Difficulty) => void;
}
```

Estado apenas em memória: nenhum Storage, nenhum dado pessoal (Zero-PII).

## 2. Invariantes (critérios de aceitação)

1. **Autoridade do domínio**: a UI nunca valida regra — usa
   `isLegalMove`/`applyMove` de `@ttt/shared/domain`; `RangeError` ⇒ rollback
   ao snapshot anterior + feedback de erro (screen shake, R3.4).
2. **Dois toques obrigatórios** (R3.2) em viewport móvel: toque em célula de
   sub-tabuleiro resolvido ou fora do quadrante ativo é ignorado sem efeito.
3. **Auto-zoom** (R3.1): toque no quadrante ativo expande 220–280% (85% do
   viewport); retorno a 100% após a confirmação da jogada.
4. **IA fora da thread principal** (R3.6): `search` só no worker; mesma
   semente + dificuldade ⇒ mesma jogada (determinismo SPEC-002).
5. **Mock só na fronteira** (R3.9): `packages/frontend/src/mocks/*` implementa
   `AiPort` para testes/demo; produção usa o worker real. Zero mocks em
   `packages/shared` e em lógica de negócio.
6. **Zero assets de áudio** (R3.5): nenhum `.mp3|.wav|.ogg` no repo; receitas
   sintéticas da base05 §2.2; `AudioContext` só após gesto do usuário.
7. **Limites** (R3.7, R3.8): arquivo ≤ 300 linhas; `tsc --noEmit` limpo sem
   `any`/`@ts-ignore`/`TODO`; jogadas respondidas sem frame drop (60 FPS).

## 3. Estados visuais obrigatórios (base05 §1.3)

| Estado | Zoom | Comportamento |
| :--- | :--- | :--- |
| Visão geral | 100% | quadrante ativo 100% opaco, inativos 40%; toque no ativo dispara auto-zoom |
| Sub-grid focada | 220–280% | borda pulsante 1,2 Hz; células > 48 px |
| Pré-visualização | mantido | marca temporária 50% alfa + ghost do destino no tabuleiro geral |
| Confirmação | volta a 100% | marca definitiva; onda visual no quadrante afetado |
| Quadrante finalizado | 100% | 30% opacidade + blur + glifo gigante; `pointer-events: none` |

## 4. Matriz de tarefas (paralelas, sem colisão de arquivos)

### Trilha B — contratos e sessão pura (sem UI)

| # | Arquivos exatos | Depende de | Done Definition |
| :--- | :--- | :--- | :--- |
| B1 | `packages/shared/src/contracts/ai-worker.ts` · `packages/shared/src/contracts/game-session.ts` · `packages/frontend/src/worker/ai.worker.ts` (só troca os tipos locais pelos imports) | Task 0 | `tsc --noEmit` limpo; worker com comportamento idêntico (suíte atual verde) |
| B2 | `packages/shared/src/session/local-session.ts` (novo): `createLocalSession(deps: { ai: AiPort; mode?; difficulty?; seed? }): GameSession` — turno humano → `aiPending` → jogada da IA → notificação | B1 | `packages/shared/tests/session/local-session.test.ts` verde; arquivo ≤ 300 linhas |

### Trilha A — UI, interação e game feel

| # | Arquivos exatos | Depende de | Done Definition |
| :--- | :--- | :--- | :--- |
| A1 | `packages/frontend/package.json` (React/Vite/jsdom) · `package.json` raiz (npm workspaces) · `tsconfig.json` raiz (`jsx: react-jsx`) · `packages/frontend/vite.config.ts` · `packages/frontend/index.html` · `packages/frontend/src/main.tsx` · `scripts/check-limits.mjs` (linhas > 300 e mídias proibidas) · script `check` no raiz | — | `npm run check` roda tsc + vitest + check-limits e passa |
| A2 | `packages/frontend/src/ui/board.tsx` · `packages/frontend/src/ui/quadrant.tsx` · `packages/frontend/src/ui/cell.tsx` | A1, B1 | renderiza 81 células a partir de `GameState`; `aria-label` por célula; quadrante resolvido inerte |
| A3 | `packages/frontend/src/ui/interaction/auto-zoom.ts` · `packages/frontend/src/ui/interaction/two-step.ts` | A2 | auto-zoom 220–280% + confirmação em dois toques (R3.1, R3.2) |
| A4 | `packages/frontend/src/ui/highlights.tsx` (borda 1,2 Hz, ghost do destino, overlay finalizado) | A2 | estados da §3 visíveis e testados |
| A5 | `packages/frontend/src/ui/motion.ts` (molas k/d/m da base05 §2.1, screen shake) | A1 | animações a 60 FPS; shake dispara no rollback |
| A6 | `packages/frontend/src/audio/synth.ts` · `packages/frontend/src/audio/recipes.ts` | A1 | 5 receitas da base05 §2.2 sem arquivos de mídia; init por gesto |
| A7 | `packages/frontend/src/session/worker-ai.ts` (`AiPort` real via worker) · `packages/frontend/src/session/use-game-session.ts` (hook sobre `GameSession`) · `packages/frontend/src/mocks/fake-ai.ts` (`AiPort` determinístico p/ testes/demo) | B2, A2 | modo `vs-ai` jogável ponta a ponta; mock só em testes/demo |

Trilhas não colidem: B edita apenas `packages/shared/src/{contracts,session}`
(+ a troca de tipos no worker); A edita apenas `packages/frontend` e os
arquivos de configuração da raiz (A1 é o único que toca na raiz).

## 5. Casos de teste obrigatórios

1. `packages/shared/tests/session/local-session.test.ts`
   - jogada ilegal lança `RangeError` e `getSnapshot()` permanece idêntico;
   - modo `vs-ai`: humano joga → `aiPending=true` → resposta da IA aplicada →
     turno volta ao humano (com `AiPort` fake);
   - mesma `seed` + dificuldade ⇒ mesma jogada (determinismo);
   - `reset()` restaura `createInitialState()` e `lastMove = null`;
   - `subscribe` notifica 1× por mudança; `unsubscribe` encerra.
2. `packages/frontend/tests/ui/board.test.tsx` — 81 células; jogadas
   renderizadas; glifo gigante + `pointer-events:none` em quadrante resolvido.
3. `packages/frontend/tests/ui/interaction.test.tsx` (docblock
   `@vitest-environment jsdom`) — 1º toque pré-seleciona (50% alfa), 2º toque
   na mesma célula aplica; toque ilegal não altera estado; toque no quadrante
   ativo dispara o auto-zoom.
4. `packages/frontend/tests/ui/highlights.test.tsx` — borda do quadrante
   ativo; ghost do destino após pré-seleção; overlay de quadrante finalizado.
5. `packages/frontend/tests/audio/synth.test.ts` — usa apenas nós Web Audio
   (nenhum `fetch` de mídia); `resume()` chamado após gesto.
6. `packages/frontend/tests/session/use-game-session.test.tsx` — hook com
   `fake-ai`: snapshots, `aiPending` e rollback (R3.4).

## 6. Fora de escopo desta spec

Multiplayer/servidor (SPEC-004); analisador pós-jogo (PRD §4.3); variantes
`FOG_OF_WAR`/`CHAOS_BLOCKED_CELLS` e Pie Rule; economia/cosméticos (bases 04 e
06); E2E Playwright (TDD §6.3 — entra quando a UI estabilizar); auditoria
completa de acessibilidade.

## 7. Validação

Tech Lead valida antes do dispatch (AGENTS.md §fluxo de especificação).
Implementação: issues **TIC-11** (Trilha A) e contrato/sessão via **TIC-8**.
