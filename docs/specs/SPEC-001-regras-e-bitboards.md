# SPEC-001 — Regras e bitboards do Ultimate Tic-Tac-Toe

Fonte: `01. especificacao_ultimate_tic_tac_toe.md` e
`02. especificacao-tecnica-ia-uttt.md` (Downloads).

## 1. Representação

| Elemento | Representação | Onde |
| :--- | :--- | :--- |
| Micro-tabuleiro | 9 bits (`Uint16Array(9)` por jogador) | `src/domain/types.ts` |
| Macro-tabuleiro | 3 máscaras de 9 bits (`macroX`, `macroO`, `macroTied`) | idem |
| Trincas locais | 8 máscaras de 9 bits + `WIN_TABLE[512]` | `src/domain/bitboard.ts` |
| Restrição de turno | `activeBoard: 0..8 \| null` | idem |

Bit 0 = célula superior esquerda. Máscaras: `7, 56, 448, 73, 146, 292, 273, 84`.

## 2. Invariantes (critérios de aceitação)

1. **Redirecionamento**: jogar em `(B, C)` define `nextActiveBoard = C`.
2. **Free Move**: se o sub-tabuleiro `C` está vencido ou empatado,
   `nextActiveBoard = null` e qualquer sub-tabuleiro aberto é válido.
3. **Imutabilidade de sub-grid**: sub-tabuleiro vencido/empatado nunca recebe
   jogada (`isLegalMove` falso, `applyMove` lança `RangeError`).
4. **Empate local**: 9 células sem trinca ⇒ quadrante neutro (`macroTied`),
   bloqueia linhas macro.
5. **Vitória macro**: 3 quadrantes do mesmo jogador alinhados encerram a partida.
6. **Deadlock**: todos os 9 quadrantes resolvidos sem trinca macro ⇒ desempate
   quadrantes → células → vitória de O (Armageddon). Nunca empata.

Testes: `tests/domain/rules.test.ts`, `tests/domain/invariants.test.ts`
(200 partidas aleatórias completas), `tests/domain/bitboard.test.ts`.

## 3. Ordenação canônica de jogadas

`legalMoveAt(state, k)` enumera por board crescente e célula crescente, sem
alocar array — usada pelo MCTS e pelos rollouts.

## 4. Fora de escopo desta spec

Pie Rule, relógio Fischer, notação DAN/UTTT-FEN, seeds de puzzles diários.
Ficam para as próximas specs (ver README, status).
