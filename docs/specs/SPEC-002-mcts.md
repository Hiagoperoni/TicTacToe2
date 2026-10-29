# SPEC-002 — Motor MCTS offline

Fonte: [`base/02-especificacao-tecnica-ia.md`](base/02-especificacao-tecnica-ia.md), §2.

## 1. Contrato

```ts
search(state: GameState, options?: MctsOptions): MctsResult
```

| Campo | Semântica |
| :--- | :--- |
| `move` | jogada escolhida, ou `null` se a posição é terminal |
| `stats` | filhos da raiz ordenados por visitas, com valor médio |
| `iterations` | iterações concluídas (pode ser menor que o teto por tempo) |
| `nodes` | nós alocados na arena (`≤ iterations + 1`) |
| `elapsedMs` | tempo medido pelo relógio injetado |

Sem efeitos colaterais: nenhum timer interno, nenhum `Math.random`
(PRNG `mulberry32` semeado), relógio injetável (`options.now`).

## 2. Fases

1. **Selection**: desce pelo UCT
   `w/n + C·√(ln N / n)`, com valores negamax (o filho é do oponente).
   `C` dinâmico: `0,85` restrito, `1,25` em jogada livre.
2. **Expansion**: um filho novo por iteração, escolhido na ordem canônica.
   O nó é registrado na arena; o estado é derivado por `applyMove`.
3. **Simulation**: rollout até o fim. `heuristic` aplica:
   fechar trinca (macro > micro), bloquear trinca iminente do oponente,
   evitar entregar Free Move, evitar mandar o oponente para um
   sub-tabuleiro onde ele fecha trinca.
4. **Backpropagation**: visitas +1 e recompensa `∈ {-1, 0, +1}` acumulada na
   perspectiva do jogador do nó.

Terminal na raiz ⇒ `move === null` e nenhuma iteração.

## 3. Escolha final

`P(a) ∝ N(a)^(1/T)`. `T ≤ 0,01` ⇒ argmax (mestre); `T` alto ⇒ erro ocasional
(iniciante). A amostragem usa o PRNG semeado.

## 4. Critérios de aceitação

| Critério | Teste |
| :--- | :--- |
| Jogada sempre legal | `nunca devolve jogada ilegal...` |
| Determinismo por semente | `é determinístico para a mesma semente` |
| Acha vitória imediata | `encontra vitória imediata no macro-tabuleiro` |
| Terminal ⇒ `null` | `devolve null em posição terminal` |
| Teto de tempo respeitado | `respeita o orçamento de tempo` |
| Presets monotônicos ≤ 50 ms | `presets de dificuldade são monotônicos` |
| Anti-suicídio no rollout | `packages/shared/tests/ai/policy.test.ts` |

## 5. Fora de escopo

Zobrist/transposição, reuso de árvore entre turnos, minerador de puzzles.
