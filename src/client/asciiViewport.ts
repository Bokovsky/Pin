export interface ViewportSize {
  width: number;
  height: number;
  dpr: number;
}

export function readViewportSize(): ViewportSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
}

/**
 * Whether the backdrop canvas needs a refit after a viewport change.
 * mount() refits on its own when the canvas width changes; height-only
 * or DPR-only changes need a nudge from our side.
 */
export function shouldRefitBackdrop(
  prev: ViewportSize | null,
  next: ViewportSize
): boolean {
  if (!prev) return false;
  return (
    prev.width !== next.width ||
    prev.height !== next.height ||
    prev.dpr !== next.dpr
  );
}
