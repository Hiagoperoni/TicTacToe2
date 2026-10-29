# Technical Design Document (TDD) — Ultimate Tic-Tac-Toe Engine & Platform

**Versão:** 1.1.0  
**Status:** Aprovado para Implementação  
**Histórico:** v1.1.0 — nomenclatura de pacotes atualizada para
`packages/shared` · `packages/frontend` · `packages/backend` conforme
[ADR-005](../adr/ADR-005-estrutura-monorepo-packages.md); desenho técnico
inalterado. v1.0.0 — aprovação inicial.  
**Arquitetura Base:** Clean Architecture, Domain-Driven Design (DDD), Monorepo TypeScript, Serverless Stateful Edge (Cloudflare / PartyKit) & Supabase (PostgreSQL Zero-PII).

---

## 1. Visão Geral da Arquitetura de Software (Clean Architecture)

A arquitetura do projeto é dividida em um Monorepo Monolítico com isolamento estrito de responsabilidades seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**. 

### 1.1 Diagrama de Camadas da Aplicação

```
+-----------------------------------------------------------------------+
|                       PRESENTATION LAYER                              |
|   (packages/frontend - React, Canvas 2D, Web Audio, PWA Hooks)        |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
|                       APPLICATION LAYER                               |
|   (packages/shared - Use Cases, DTOs, Zod Schemas)                    |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
|                          DOMAIN LAYER                                 |
|   (packages/shared - Bitboards, UTTT Rules FSM, MCTS, Glicko-2)       |
|                     * ZERO External Dependencies *                    |
+-----------------------------------------------------------------------+
                                  ▲
                                  │
+-----------------------------------------------------------------------+
|                      INFRASTRUCTURE LAYER                             |
|   (packages/backend - Cloudflare DO / PartyKit, Supabase Client)      |
+-----------------------------------------------------------------------+
```

### 1.2 Mapeamento de Pacotes do Monorepo

*   **`packages/shared` (Domain + Application Layer):** Regras matemáticas do jogo, representação binária via Bitboards, máquina de estados finitos (FSM), motor MCTS (Monte Carlo Tree Search), alocador de memória em Arena (Zero-GC), cálculo de Glicko-2 e os contratos da aplicação — schemas Zod, tipos TypeScript exportados, eventos do protocolo WebSocket, constantes do jogo e geradores de hashes HMAC. O núcleo (`packages/shared/src/domain` e `packages/shared/src/ai`) **possui zero dependências externas ou de DOM/Navegador**; os contratos ficam em `packages/shared/src/contracts`.
*   **`packages/frontend` (Presentation Layer):** Contém os componentes React, motor de renderização gráfica em Canvas 2D com suporte a alta densidade de pixels (DPI scaling), gerenciador de animações por física de molas (Springs), sintetizador procedural Web Audio API, *Smart Auto-Zoom* e o Web Worker da IA (`packages/frontend/src/worker`).
*   **`packages/backend` (Infrastructure Layer):** Servidor autoritativo serverless baseado em Cloudflare Durable Objects (via PartyKit). Gerencia salas de jogo, sincronização de relógio Fischer, resiliência de conexão, fallback para Ghost Bots e persitência assíncrona no Supabase via RPCs.

---

## 2. Representação de Estado com Bitboards $O(1)$ e Operações Binárias

Para evitar alocações de objetos no Heap do V8 durante milhões de simulações do MCTS, todo o estado do jogo é compactado em um único buffer contíguo de 256 bits (`Uint32Array` de 8 posições de 32 bits).

### 2.1 Mapeamento Exato da `Uint32Array[8]`

$$\\text{BitboardState} = \\text{Uint32Array}(8)$$

| Índice da `Uint32Array` | Intervalo de Bits | Mapeamento do Estado do Jogo |
| :--- | :--- | :--- |
| `[0]` | `0..26` | **Jogador X:** Ocupação nos Micro-tabuleiros `0`, `1` e `2` (9 bits por micro-tabuleiro). |
| `[1]` | `0..26` | **Jogador X:** Ocupação nos Micro-tabuleiros `3`, `4` e `5` (9 bits por micro-tabuleiro). |
| `[2]` | `0..26` | **Jogador X:** Ocupação nos Micro-tabuleiros `6`, `7` e `8` (9 bits por micro-tabuleiro). |
| `[3]` | `0..26` | **Jogador O:** Ocupação nos Micro-tabuleiros `0`, `1` e `2` (9 bits por micro-tabuleiro). |
| `[4]` | `0..26` | **Jogador O:** Ocupação nos Micro-tabuleiros `3`, `4` e `5` (9 bits por micro-tabuleiro). |
| `[5]` | `0..26` | **Jogador O:** Ocupação nos Micro-tabuleiros `6`, `7` e `8` (9 bits por micro-tabuleiro). |
| `[6]` | `0..26` | **Estado Macro:** Vitórias de X (`0..8`), Vitórias de O (`9..17`), Empates (`18..26`). |
| `[7]` | `0..5` | **Controle:** `activeMacro` (`0..3`, valor 0-8), `freeMove` (bit `4`), `activePlayer` (bit `5`: `0=X`, `1=O`). |

### 2.2 Máscaras Binárias e Lookup Table $O(1)$ de Vitória

A detecção de vitória em qualquer micro-tabuleiro $3 \\times 3$ utiliza máscaras de 9 bits aplicadas sobre o deslocamento binário do sub-tabuleiro correspondente:

```typescript
// Máscaras de vitória de 9 bits para uma grade 3x3
export const WIN_MASKS = [
  0x007, // Linha Superior (bits 0, 1, 2 = 0b000000111)
  0x038, // Linha Central  (bits 3, 4, 5 = 0b000111000)
  0x1C0, // Linha Inferior (bits 6, 7, 8 = 0b111000000)
  0x049, // Coluna Esquerda(bits 0, 3, 6 = 0b001001001)
  0x092, // Coluna Central (bits 1, 4, 7 = 0b010010010)
  0x124, // Coluna Direita (bits 2, 5, 8 = 0b100100100)
  0x111, // Diag. Principal(bits 0, 4, 8 = 0b100010001)
  0x054  // Anti-Diagonal  (bits 2, 4, 6 = 0b001010100)
] as const;

// Tabela de consulta pré-calculada (Lookup Table) para avaliação O(1)
export const WIN_TABLE = new Uint8Array(512); // 2^9 combinações
for (let mask = 0; mask < 512; mask++) {
  WIN_TABLE[mask] = WIN_MASKS.some(wm => (mask & wm) === wm) ? 1 : 0;
}
```

---

## 3. Algoritmo Monte Carlo Tree Search (MCTS) & Zero-GC Engine

Para viabilizar simulações de até 100.000 iterações por segundo sem pausa de *Garbage Collection*, o motor MCTS utiliza uma estrutura de **Zero-GC Arena Allocator** rodando em **Web Workers** paralelos.

### 3.1 Arena Allocator com Arrays Paralelos

```typescript
export class MCTSArena {
  public maxNodes: number;
  public nodeCount: number;
  public visits: Int32Array;
  public rewards: Float64Array;
  public parent: Int32Array;
  public firstChild: Int32Array;
  public numChildren: Uint16Array;
  public moveCode: Uint16Array;

  constructor(maxNodes = 200000) {
    this.maxNodes = maxNodes;
    this.nodeCount = 0;
    this.visits = new Int32Array(maxNodes);
    this.rewards = new Float64Array(maxNodes);
    this.parent = new Int32Array(maxNodes);
    this.firstChild = new Int32Array(maxNodes);
    this.numChildren = new Uint16Array(maxNodes);
    this.moveCode = new Uint16Array(maxNodes);
  }

  public allocateNode(parentIdx: number, move: number): number {
    const idx = this.nodeCount++;
    this.visits[idx] = 0;
    this.rewards[idx] = 0.0;
    this.parent[idx] = parentIdx;
    this.firstChild[idx] = -1;
    this.numChildren[idx] = 0;
    this.moveCode[idx] = move;
    return idx;
  }

  public reset(): void {
    this.nodeCount = 0;
  }
}
```

### 3.2 Fórmulas MCTS (UCB1 & Softmax Temperature)

1. **Navegação UCB1 (Upper Confidence Bound 1):**
   
   $$\\text{UCB1}(s, a_i) = \\frac{W(a_i)}{N(a_i)} + C \\cdot \\sqrt{\\frac{\\ln N(s)}{N(a_i)}}$$
   *   $C = 0,85$ para jogadas em quadrantes restritos (foco em otimização local).
   *   $C = 1,25$ para jogadas livres (*Free Move*) (foco em exploração global).

2. **Seleção de Ação com Temperatura (Softmax):**
   
   $$P(a_i) = \\frac{N(a_i)^{\\frac{1}{T}}}{\\sum_{j} N(a_j)^{\\frac{1}{T}}}$$

3. **Tempo de Reflexão Humanizado ($t_{\\text{pensamento}}$):**
   
   $$t_{\\text{pensamento}} = t_{\\text{base}} + \\alpha \\cdot H(S) + \\beta \\cdot \\left(1 - \\frac{N_{\\text{max1}} - N_{\\text{max2}}}{N_{\\text{total}}}\\right)$$

---

## 4. Arquitetura Multiplayer Autoritativa com PartyKit / Durable Objects

### 4.1 Ciclo de Vida da Sala e Máquina de Estados (FSM)

```
[Cliente 1 & 2] ─── WS Handshake ───► [Cloudflare Worker (Edge Router)]
                                                    │
                                          idFromName(match_id)
                                                    │
                                                    ▼
                                     [Durable Object: RoomActor]
                                                    │
     ┌──────────────────────────────────────────────┴──────────────────────────────────────────────┐
     │                                                                                             │
     ▼                                                                                             ▼
[WAITING_PLAYERS] ──(2 Conectados)──► [READY_CHECK] ──(Ambos Ready)──► [IN_PROGRESS] ──(Partida Fim)──► [FINISHED]
                                                                            │                              │
                                                                   Queda da Conexão                        ▼
                                                                            │                     [Persistência Async]
                                                                            ▼                     Supabase RPC:
                                                             [DISCONNECTED_GRACE_PERIOD]         finalize_match()
                                                              (Timer 30s via Alarm API)
```

### 4.2 Esquemas Zod do Protocolo de Eventos WebSocket

```typescript
import { z } from "zod";

export const MovePayloadSchema = z.object({
  cellIndex: z.number().int().min(0).max(80),
  macroIndex: z.number().int().min(0).max(8),
  microIndex: z.number().int().min(0).max(8),
  dan: z.string().regex(/^[A-C]\.[a-c]$/),
  pieSwap: z.boolean().default(false)
}).strict();

export const ClientEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("JOIN_ROOM"), roomId: z.string().uuid(), token: z.string() }),
  z.object({ type: z.literal("READY") }),
  z.object({ type: z.literal("SUBMIT_MOVE"), sequence: z.number().int().positive(), payload: MovePayloadSchema, clientTime: z.number() }),
  z.object({ type: z.literal("PING_SYNC"), clientTime: z.number() })
]);
```

### 4.3 Relógio Fischer & Anti-Stalling

*   **Ajuste do Tempo Consumido:**
    $$\\Delta t_{\\text{corrigido}} = \\max\\left(0, \\Delta t_{\\text{servidor}} - L_{\\text{oneway}}\\right), \\quad L_{\\text{oneway}} = \\frac{\\text{RTT}}{2}$$
*   **Limite de Tolerância de Drift Anti-Cheat:**
    $$T_{\\text{drift\_threshold}} = 200\\text{ ms}$$
*   Se $|\\Delta t_{\\text{servidor}} - L_{\\text{oneway}} - \\Delta t_{\\text{cliente}}| > 200\\text{ ms}$, o servidor ignora a estimativa do cliente e aplica $\\Delta t_{\\text{servidor}}$ autoritativamente.

---

## 5. Modelo de Dados e Segurança no Supabase (PostgreSQL Zero-PII)

### 5.1 DDL da Tabela `users` Unificada e Políticas RLS

```sql
-- TABELA DE USUÁRIOS UNIFICADA (ZERO-PII)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_device_id VARCHAR(64) UNIQUE,
    google_sub VARCHAR(255) UNIQUE,
    apple_sub VARCHAR(255) UNIQUE,
    discord_sub VARCHAR(255) UNIQUE,
    age_gate_status VARCHAR(16) NOT NULL DEFAULT 'UNDER_13' CHECK (age_gate_status IN ('UNDER_13', 'TEEN_13_17', 'ADULT_18_PLUS')),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESTRICTED', 'BANNED', 'PENDING_DELETION')),
    
    -- Parâmetros Glicko-2
    rating NUMERIC(8,2) NOT NULL DEFAULT 1500.00,
    rd NUMERIC(8,2) NOT NULL DEFAULT 350.00,
    volatility NUMERIC(8,6) NOT NULL DEFAULT 0.060000,
    
    -- Retenção
    streak_count INT NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
    streak_freezes INT NOT NULL DEFAULT 0 CHECK (streak_freezes >= 0),
    last_played_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- POLÍTICA DE LEITURA PÚBLICA DE PERFIS (APENAS DADOS NÃO SENSÍVEIS)
CREATE POLICY "Leitura pública de perfis de jogadores"
    ON public.users FOR SELECT
    USING (true);

-- POLÍTICA DE ATUALIZAÇÃO RESTRITA AO PRÓPRIO USUÁRIO
CREATE POLICY "Usuário atualiza apenas seu próprio perfil"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);
```

### 5.2 Stored Procedure Atômica `finalize_match`

```sql
CREATE OR REPLACE FUNCTION public.finalize_match(
    p_match_id VARCHAR(64),
    p_player_white_id UUID,
    p_player_black_id UUID,
    p_winner_id UUID,
    p_pgn_replay TEXT,
    p_variant VARCHAR(32),
    p_time_control VARCHAR(32),
    p_white_r_new NUMERIC(8,2),
    p_white_rd_new NUMERIC(8,2),
    p_white_vol_new NUMERIC(8,6),
    p_black_r_new NUMERIC(8,2),
    p_black_rd_new NUMERIC(8,2),
    p_black_vol_new NUMERIC(8,6),
    p_gold_reward_white INT,
    p_gold_reward_black INT
) RETURNS VOID AS $$
BEGIN
    -- 1. Inserção no histórico de partidas
    INSERT INTO public.match_history (
        match_id, player_white_id, player_black_id, winner_id, pgn_replay,
        variant, time_control, white_rating_before, white_rating_after, black_rating_before, black_rating_after
    ) SELECT
        p_match_id, p_player_white_id, p_player_black_id, p_winner_id, p_pgn_replay,
        p_variant, p_time_control, w.rating, p_white_r_new, b.rating, p_black_r_new
    FROM public.users w, public.users b WHERE w.id = p_player_white_id AND b.id = p_player_black_id;

    -- 2. Atualização dos parâmetros Glicko-2
    UPDATE public.users SET rating = p_white_r_new, rd = p_white_rd_new, volatility = p_white_vol_new, last_played_at = NOW() WHERE id = p_player_white_id;
    UPDATE public.users SET rating = p_black_r_new, rd = p_black_rd_new, volatility = p_black_vol_new, last_played_at = NOW() WHERE id = p_player_black_id;

    -- 3. Inspecção e crédito de carteira virtual
    UPDATE public.virtual_wallets SET gold_balance = gold_balance + p_gold_reward_white, updated_at = NOW() WHERE user_id = p_player_white_id;
    UPDATE public.virtual_wallets SET gold_balance = gold_balance + p_gold_reward_black, updated_at = NOW() WHERE user_id = p_player_black_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Estratégia de Testes e Qualidade (TDD, Fuzzing e Property-Based)

Para garantir que o software seja resiliente, livre de bugs de estado e imune a travamentos de memória, a estratégia de testes segue a Pirâmide de Testes Automatizados com abordagem **Test-Driven Development (TDD)**.

```
                  /                  / E2E \  (Playwright - UI & Web Audio)
                /-------'               /  Integ.  \ (Vitest - PartyKit & Supabase RPC)
              /------------             /   Fuzzing    \ (fast-check - 100k Sequências de Bitboards)
            /----------------           /     Unidade      \ (Vitest - Core Math, Bitboards, MCTS & FSM)
          /--------------------```

### 6.1 Testes Unitários de Regras e Bitboards (`packages/shared`)

*   **Testes de Vitória $O(1)$:** Cobertura de 100% das 8 combinações de vitória em micro-tabuleiros contra as máscaras `WIN_MASKS`.
*   **Testes de FSM & Redirecionamento:** Validação de jogadas válidas, imposição de *Free Move* em quadrantes encerrados e atribuição correta de `DRAW_NEUTRAL`.
*   **Testes de Consistência MCTS:** Verificação do alocador de Arena garantindo 0 vazamentos de ponteiro e invariância do hash de Zobrist após movimentos e desfazimentos.

### 6.2 Testes de Fuzzing Baseados em Propriedades (Property-Based Testing)

Utilizando a biblioteca `fast-check`, o motor de jogo é submetido a simulações de até 100.000 partidas com entradas geradas aleatoriamente para verificar invariantes de sistema.

```typescript
import { test, expect } from "vitest";
import fc from "fast-check";
import { BitboardBoard } from "../src/bitboard";

test("Property-Based: Nenhuma sequência de jogadas aleatórias corrompe o Bitboard ou lança exceções imprevisíveis", () => {
  fc.assert(
    fc.property(fc.array(fc.integer({ min: 0, max: 80 }), { maxLength: 81 }), (moves) => {
      const board = new BitboardBoard();
      for (const move of moves) {
        if (board.isValidMove(move)) {
          expect(() => board.makeMove(move)).not.toThrow();
        }
      }
      // Invariante: O número de peças no bitboard deve ser igual ao número de jogadas efetuadas
      const totalPieces = board.countPieces();
      expect(totalPieces).toBeLessThanOrEqual(81);
    }),
    { numRuns: 10000 }
  );
});
```

### 6.3 Testes de Integração e E2E (`packages/backend` e `packages/frontend`)

*   **Testes de Integração de Rede (Vitest + PartyKit Test Harness):** Simulação de dois clientes disputando uma partida inteira via WebSockets, testando perda de pacotes, reconexão via `resume_token` e timeout do Relógio Fischer.
*   **Testes E2E (Playwright):** Simulação de interação do usuário final em navegadores móbiles e desktop (Google Chrome, Safari Mobile), verificando a transição do *Smart Auto-Zoom*, o acionamento do sintetizador de áudio Web Audio e o rendering em Canvas.

---

**Documento Gerado e Compilado com Sucesso.**
