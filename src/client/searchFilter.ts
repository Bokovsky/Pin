import type { Category, Link } from "./types";

function normalizedText(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  return String(value ?? "").trim().toLowerCase();
}

function linkMatchesQuery(link: Link, query: string): boolean {
  return (
    normalizedText(link.title).includes(query) ||
    normalizedText(link.description).includes(query) ||
    normalizedText(link.url).includes(query)
  );
}

function cloneCategoryTree(category: Category): Category {
  return {
    ...category,
    links: [...category.links],
    children: (category.children ?? []).map(cloneCategoryTree),
  };
}

function filterCategory(category: Category, query: string): Category | null {
  if (normalizedText(category.name).includes(query)) {
    return cloneCategoryTree(category);
  }

  const links = category.links.filter((link) => linkMatchesQuery(link, query));
  const children = (category.children ?? [])
    .map((child) => filterCategory(child, query))
    .filter((child): child is Category => child !== null);
  if (links.length === 0 && children.length === 0) {
    return null;
  }
  return { ...category, links, children };
}

export function filterCategoriesByQuery(categories: Category[], rawQuery: string): Category[] {
  const query = normalizedText(rawQuery);
  if (query === "") {
    return categories;
  }
  return categories
    .map((category) => filterCategory(category, query))
    .filter((category): category is Category => category !== null);
}

export function resolveCategoryAnchorId(node: unknown): string | undefined {
  if (typeof node === "string" && node.length > 0) {
    return node;
  }
  if (typeof node === "object" && node !== null) {
    const record = node as { id?: unknown; data?: unknown };
    if (typeof record.id === "string" && record.id.length > 0) {
      return record.id;
    }
    if (typeof record.data === "object" && record.data !== null) {
      const nestedId = (record.data as { id?: unknown }).id;
      if (typeof nestedId === "string" && nestedId.length > 0) {
        return nestedId;
      }
    }
  }
  return undefined;
}
