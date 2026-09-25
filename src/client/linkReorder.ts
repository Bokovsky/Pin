export function canStartLinkDrag(searchQuery: string): boolean {
  return searchQuery.trim() === "";
}

export function buildContainerLinkOrder(linkIds: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex < 0 || fromIndex >= linkIds.length) {
    return [...linkIds];
  }
  const order = [...linkIds];
  const [moved] = order.splice(fromIndex, 1);
  const insertIndex = Math.max(0, Math.min(toIndex, order.length));
  order.splice(insertIndex, 0, moved);
  return order;
}
