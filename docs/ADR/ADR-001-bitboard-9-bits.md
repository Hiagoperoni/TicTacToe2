# ADR-001 — Bitboard de 9 bits por micro-tabuleiro

**Status:** aceito.

## Contexto

A spec técnica propõe compactar todo o estado em `Uint32Array(8)` com campos
de 27 bits. Isso minimiza memória, mas exige shifts de 27 bits e máscaras
`>>>` em toda operação, dificultando auditoria das regras.

## Decisão

Cada micro-tabuleiro é uma máscara de 9 bits em `Uint16Array(9)` (uma por
jogador). O macro-tabuleiro são 3 máscaras de 9 bits (`macroX`, `macroO`,
`macroTied`). As 8 trincas são constantes literais da spec e `WIN_TABLE[512]`
responde vitória em uma leitura.

## Consequências

- `applyMove` copia 2 × 18 bytes (`slice()`), custo praticamente constante.
- Toda regra é verificável com operações `&`/`|` de 9 bits.
- Vitória local O(1) via tabela; sem loops de linhas.
- O MCTS opera sobre o mesmo formato, sem conversão.
- Se o perfil de memória exigir, migrar para 3 × 27 bits é local a
  `src/domain/bitboard.ts` e `rules.ts` — a API pública não muda.
