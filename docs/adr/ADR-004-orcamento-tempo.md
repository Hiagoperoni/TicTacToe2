# ADR-004 — Orçamento de tempo por lance: 45 ms

**Status:** aceito, com ressalva registrada.

## Contexto

Há duas exigências conflitantes nas fontes:

- Perfil do agente: motor roda em Web Worker com **< 50 ms** por dificuldade.
- Spec técnica §3 (tabela de níveis): 50 ms (iniciante) até **1000 ms** (mestre),
  com 15.000–30.000 iterações no nível competitivo.

Medição atual (`packages/shared/scripts/bench.ts`, Node 22): ~47 µs por iteração com rollout
heurístico. Em 45 ms cabem ~950 iterações — muito abaixo das 15.000 que a
tabela assume para "competitivo", mas alinhado com o custo/iteração implícito
na própria tabela (15.000 em 400 ms ≈ 27 µs).

## Decisão

`DIFFICULTY_PRESETS` usa `timeBudgetMs = 20/35/45/45` e `iterations` como teto.
O worker nunca passa de ~48 ms por lance, cumprindo o perfil. `optionsFor` e
`MctsOptions` permitem elevar o orçamento sem tocar na lógica.

## Consequências

- Nível "mestre" ≈ 900 iterações: tática de 1–2 lances confiável, estratégia
  global limitada.
- Para força real de mestre, decidir entre: (a) aceitar 200–1000 ms por lance,
  ou (b) investir em rollout mais barato / avaliação heurística na expansão.
- O corte por relógio é checado a cada 16 iterações, então o estouro é ≤ 1 ms
  na prática.
