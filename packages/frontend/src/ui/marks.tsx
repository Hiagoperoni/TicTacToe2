/**
 * Marcas procedurais (SPEC-003 R3.5/R3.8: zero assets) — X e O desenhados a
 * tinta com traço orgânico em SVG inline parametrizado; `D` (empate) vira um
 * travessão de caneta. Sem arquivos de imagem no repo.
 */

export type MarkId = 'X' | 'O';
export type StampId = MarkId | 'D';

const STROKE_PATHS: Record<MarkId, readonly string[]> = {
  // X de caneta: dois traços levemente curvos, com leveza de escrita à mão.
  X: ['M6.4 5.8 C 12.2 11.6, 20.2 20.4, 25.6 26.2', 'M25.8 6.2 C 20.4 11.4, 12 20.6, 6.2 25.8'],
  // O de caneta: círculo aberto com leve sobreposição no ponto de partida.
  O: [
    'M21.9 7.6 C 18.8 5.1, 14.6 4.6, 11.2 6.4 C 6.9 8.7, 5.1 14.5, 7.2 19.5 C 9.5 24.9, 16 27.3, 21 24.9 C 25.5 22.7, 27.5 17.6, 25.9 13 C 25 10.4, 23.5 8.6, 21.3 7.2',
  ],
};

/** Marca individual (X/O) em SVG inline; `currentColor` vem do contexto. */
export function Mark({ id, className }: { readonly id: MarkId; readonly className?: string }) {
  return (
    <svg
      className={className === undefined ? 'ttt-mark' : `ttt-mark ${className}`}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      data-mark={id}
    >
      {STROKE_PATHS[id].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Travessão de empate: traço único horizontal, como marca de caneta. */
function DrawBar() {
  return (
    <svg className="ttt-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false" data-mark="D">
      <path d="M6.5 16.4 C 12 15.5, 20 15.4, 25.5 15.8" />
    </svg>
  );
}

/** Carimbo macro de quadrante conquistado/empatado (glifo gigante da SPEC §3). */
export function MacroStamp({ id }: { readonly id: StampId }) {
  return (
    <div className={`ttt-stamp ttt-stamp--${id.toLowerCase()}`} data-mark={id}>
      {id === 'D' ? <DrawBar /> : <Mark id={id} />}
    </div>
  );
}
