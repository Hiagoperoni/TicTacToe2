# ADR-006 — Estratégia de Branches, Merges e CI

- **Status:** Accepted
- **Data:** 2026-10-28
- **Issue:** [TIC-15](https://linear.app/tictactoe2/issue/TIC-15)
- **Decisores:** O Mais (Tech Lead), Hiago

## Contexto

Vários agentes trabalham em paralelo (`feat/*`) e o repo era single-branch (`main`), sem camada de QA antes de produção. Risco de branches se atropelando, merges diretos acidentais e código sem validação chegando em produção.

## Decisão

Dois níveis de branch protegida e feature branches por task:

    main  (produção)  ←  quality (staging/QA)  ←  feat/<TIC-XX>-<slug>

### Fluxo por task

1. Branch `feat/<TIC-XX>-<slug>` criada a partir da `quality` atualizada.
2. Commits convencionais (`feat:`, `fix:`, `docs:`, `refactor:`) referenciando `TIC-XX`; unidades atômicas.
3. Push **apenas** no branch da própria feature — unowned branches não recebem push de terceiros.
4. PR `feat/* → quality`; CI (atualmente `tsc --noEmit` + `vitest run`) deve estar verde.
5. Review do Tech Lead + validação funcional do QA (Facada) no ambiente da `quality`.
6. `[APPROVED]` do QA + auditoria (Rebert) → merge **squash** em `quality`; card Linear vai para `In Review` com o link do PR; `Done` só após aprovações.
7. Merge `quality → main` em release/paridade, via PR de release revisado pelo Tech Lead.

### Hotfix

`fix/<TIC-XX>-<slug>` a partir de `main`; PR para `main` (review Tech Lead); **backport obrigatório** para `quality` imediatamente.

### Proteções aplicadas (GitHub, já ativas)

Aplicadas em `main` e `quality`:
- Pull request obrigatório + 1 approving review; dismiss de reviews obsoletas.
- Status checks obrigatórios (`strict: true` — branch precisa estar atualizada com a base).
- Linear history (sem merge commits nativos nas protegidas; feature branches podem ter).
- Force push e deletions proibidos; **enforce admin** (inclusive para admins).

### Regras de convivência (anti-atropelo)

- **Owner único de branch:** quem abre o PR é o único que faz push nele.
- Rebase na `quality` diariamente em tasks > 1 dia; conflito de merge = alinhamento no grupo, ninguém resolve silenciosamente.
- Rebase (não merge) dentro do branch próprio; squash no merge para a PR history limpa.

## Consequências

- ✅ Ambiente de QA agregado (`quality`) antes de produção; #PR gate em tudo.
- ✅ Histórico linear e auditável em `main`/`quality`.
- ⚠️ CI precisa existir de fato em PRs (status checks hoje vazios;SPEC do CI é próximo passo — ver SPEC de CI).
- ⚠️ Skills de workflow do time devem apontar a base de features para `quality`.

## Alternativas consideradas

- **GitHub Flow (1 branch):** mais simples, mas sem camada de QA agregada — rejeitado.
- **Git Flow completo com `develop` + release branches:** custo para time atual; `quality` cobre o mesmo objetivo com menos overhead.
- **Trunk-based com feature flags:** ideal pós-CI maduro; reavaliar quando houver CI e deploy automatizado.
