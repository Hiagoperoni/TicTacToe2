# ADR-003 — Arena de nós em TypedArrays no MCTS

**Status:** aceito.

## Contexto

A spec técnica pede alocador em arena para evitar pressão de GC. Nós com
objetos relacionais degradam após dezenas de milhares de iterações.

## Decisão

Arrays paralelos dimensionados em `iterations + 1`:

| Array | Papel |
| :--- | :--- |
| `visits: Int32Array` | `N` do nó |
| `rewards: Float64Array` | `W` acumulado na perspectiva do jogador do nó |
| `parent`, `firstChild`, `nextSibling` | topologia (filhos encadeados) |
| `nodeMove: Int32Array` | código 0..80 da jogada que gerou o nó |
| `nodeState: GameState[]` | estado derivado por `applyMove` |

Um filho por iteração; filhos são ligados no início da lista de irmãos.
`pickUnexpanded` marca códigos já usados em um `Uint8Array(82)` reutilizado.

## Consequências

- `nodes ≤ iterations + 1` (invariante testado).
- Nenhum `new` por nó na estrutura da árvore; apenas o estado (ADR-002).
- O caminho da seleção usa `Int32Array(82)` reutilizado, sem alocação.
- Reuso entre turnos exigirá persistir a arena — fica para quando houver
  Zobrist/transposição.
