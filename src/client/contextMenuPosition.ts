export interface MenuPoint {
  x: number;
  y: number;
}

export interface MenuSize {
  width: number;
  height: number;
}

export interface MenuViewport {
  width: number;
  height: number;
}

export function clampContextMenuPosition({
  position,
  menuSize,
  viewport,
  gap = 8,
}: {
  position: MenuPoint;
  menuSize: MenuSize;
  viewport: MenuViewport;
  gap?: number;
}): MenuPoint {
  return {
    x: Math.min(Math.max(position.x, gap), Math.max(gap, viewport.width - menuSize.width - gap)),
    y: Math.min(Math.max(position.y, gap), Math.max(gap, viewport.height - menuSize.height - gap)),
  };
}
