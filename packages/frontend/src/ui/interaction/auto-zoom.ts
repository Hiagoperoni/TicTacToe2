/**
 * Smart Auto-Zoom (SPEC-003 R3.1, PRD §7.3 / base05 §1.1): ao focar o sub-tabuleiro
 * ativo, escala 220–280% enquadrando 85% do viewport (alvos ≥ 48×48 px).
 */

export const AUTO_ZOOM_MIN_SCALE = 2.2;
export const AUTO_ZOOM_MAX_SCALE = 2.8;
export const AUTO_ZOOM_VIEWPORT_RATIO = 0.85;

export function computeAutoZoom(viewportHeight: number, boardHeight?: number): number {
  const height = boardHeight ?? viewportHeight / 3;
  const scale = (viewportHeight * AUTO_ZOOM_VIEWPORT_RATIO) / height;
  return Math.min(AUTO_ZOOM_MAX_SCALE, Math.max(AUTO_ZOOM_MIN_SCALE, scale));
}
