# ADR-002 — Estado imutável com cópia de arrays tipados

**Status:** aceito.

## Contexto

Regras puras (`(state, move) => newState`) são exigidas pelo perfil. Ao mesmo
tempo, o MCTS cria centenas de milhares de estados por lance.

## Decisão

`GameState` expõe campos `readonly`; `applyMove` devolve um objeto novo com
`x.slice()` / `o.slice()` e máscaras macro recalculadas por bit. Não há
`Object.freeze` (custo em laços quentes) nem cache mutável compartilhado.

## Consequências

- Zero aliasing: mutar o retorno não afeta o estado de origem (testado).
- Cópia de ~36 bytes por jogada; GC de arrays tipados pequenos é barato.
- MCTS não faz unmake; cada nó guarda o estado resultante.
- Se o perfil mostrar pressão de GC, adotar `applyMove` com buffer de rascunho
  interno, mantendo a fachada pura.
