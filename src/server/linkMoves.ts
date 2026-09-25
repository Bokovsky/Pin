import type { Category, Link, NavData } from "./data";

export interface LinkMoveRequest {
  linkId: string;
  targetCategoryId: string;
  targetIndex: number;
}

function findCategory(categories: Category[] | undefined, categoryId: string): Category | null {
  if (!categories) return null;
  for (const category of categories) {
    if (category.id === categoryId) return category;
    const found = findCategory(category.children, categoryId);
    if (found) return found;
  }
  return null;
}

function findLinkParent(categories: Category[] | undefined, linkId: string): { category: Category; linkIndex: number } | null {
  if (!categories) return null;
  for (const category of categories) {
    const linkIndex = (category.links || []).findIndex((link) => link.id === linkId);
    if (linkIndex !== -1) return { category, linkIndex };
    const found = findLinkParent(category.children, linkId);
    if (found) return found;
  }
  return null;
}

function renumberLinks(links: Link[]): void {
  links.forEach((link, index) => {
    link.sort_order = index;
  });
}

export interface ReorderRequestItem {
  id: string;
  sort_order: number;
}

export function applyReorder(data: NavData, items: ReorderRequestItem[]): NavData {
  const orderMap = new Map(items.map((item) => [item.id, item.sort_order]));
  function applyToCategories(categories: Category[] | undefined): void {
    if (!categories) return;
    for (const category of categories) {
      const ordered = category.links
        .map((link, position) => ({ link, position, sort_order: orderMap.get(link.id) }))
        .filter((entry): entry is { link: Link; position: number; sort_order: number } => entry.sort_order !== undefined)
        .sort((a, b) => a.sort_order - b.sort_order || a.position - b.position);
      const unordered = category.links.filter((link) => !orderMap.has(link.id));
      category.links = [...ordered.map((entry) => entry.link), ...unordered];
      for (const entry of ordered) {
        entry.link.sort_order = entry.sort_order;
      }
      applyToCategories(category.children);
    }
  }
  applyToCategories(data.categories);
  return data;
}

export function applyLinkMove(data: NavData, request: LinkMoveRequest): NavData {
  const next: NavData = JSON.parse(JSON.stringify(data)) as NavData;
  const source = findLinkParent(next.categories, request.linkId);
  const target = findCategory(next.categories, request.targetCategoryId);
  if (!source) {
    throw new Error("Link not found");
  }
  if (!target) {
    throw new Error("Target category not found");
  }

  const [link] = source.category.links.splice(source.linkIndex, 1);
  const insertIndex = Math.max(0, Math.min(request.targetIndex, target.links.length));
  target.links.splice(insertIndex, 0, link);
  renumberLinks(source.category.links);
  if (source.category !== target) {
    renumberLinks(target.links);
  }
  return next;
}
