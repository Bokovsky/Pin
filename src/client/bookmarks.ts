import type { Category, Link, NavData } from "./types";

export interface BookmarkLinkAttributes {
  description: string;
  backup_url: string;
  sort_order: number;
}

export interface BookmarkAttributeSource {
  getAttribute(name: string): string | null;
}

export interface ExportedLink {
  title: string;
  url: string;
  description: string;
  backup_url: string;
  sort_order: number;
}

export interface ExportedCategory {
  name: string;
  description: string;
  sort_order: number;
  links: ExportedLink[];
  children: ExportedCategory[];
}

export function escapeBookmarkHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function extractBookmarkLinkAttributes(
  element: BookmarkAttributeSource,
  fallbackSortOrder: number
): BookmarkLinkAttributes {
  const sortText = element.getAttribute("data-pin-sort");
  const parsedSort = sortText === null ? Number.NaN : Number.parseInt(sortText, 10);
  return {
    description:
      element.getAttribute("data-pin-description") ?? element.getAttribute("description") ?? "",
    backup_url: element.getAttribute("data-pin-backup-url") ?? "",
    sort_order: Number.isInteger(parsedSort) ? parsedSort : fallbackSortOrder,
  };
}

function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function exportCategory(category: Category): ExportedCategory {
  return {
    name: category.name,
    description: category.description,
    sort_order: category.sort_order,
    links: sortByOrder(category.links).map((link) => ({
      title: link.title,
      url: link.url,
      description: link.description,
      backup_url: link.backup_url,
      sort_order: link.sort_order,
    })),
    children: sortByOrder(category.children).map(exportCategory),
  };
}

export function toNavData(categories: Category[]): ExportedCategory[] {
  return sortByOrder(categories).map(exportCategory);
}

function hasExportableContent(category: Category | ExportedCategory): boolean {
  if (category.links.length > 0) return true;
  return category.children.some(hasExportableContent);
}

function renderBookmarkLink(link: Link | ExportedLink, indent: string, addedAt: number): string {
  const attributes = [
    `HREF="${escapeBookmarkHtml(link.url)}"`,
    `ADD_DATE="${addedAt}"`,
  ];
  if (link.description) {
    attributes.push(`DATA-PIN-DESCRIPTION="${escapeBookmarkHtml(link.description)}"`);
  }
  if (link.backup_url) {
    attributes.push(`DATA-PIN-BACKUP-URL="${escapeBookmarkHtml(link.backup_url)}"`);
  }
  attributes.push(`DATA-PIN-SORT="${link.sort_order}"`);
  return `${indent}<DT><A ${attributes.join(" ")}>${escapeBookmarkHtml(link.title)}</A>\n`;
}

function renderBookmarkCategory(category: Category, indent: string, addedAt: number): string {
  const renderedChildren = sortByOrder(category.children)
    .map((child) => renderBookmarkCategory(child, `${indent}    `, addedAt))
    .join("");
  if (category.links.length === 0 && renderedChildren === "") {
    return "";
  }

  let result = `${indent}<DT><H3>${escapeBookmarkHtml(category.name || "未命名")}</H3>\n${indent}<DL><p>\n`;
  for (const link of sortByOrder(category.links)) {
    result += renderBookmarkLink(link, indent, addedAt);
  }
  result += renderedChildren;
  result += `${indent}</DL><p>\n`;
  return result;
}

export function renderBookmarkHtml(categories: Category[], now: Date = new Date()): string {
  const addedAt = Math.floor(now.getTime() / 1000);
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Pin Bookmarks</TITLE>
<H1>Pin Bookmarks</H1>
<DL><p>\n`;

  for (const category of sortByOrder(categories)) {
    if (hasExportableContent(category)) {
      html += renderBookmarkCategory(category, "  ", addedAt);
    }
  }

  html += `</DL><p>\n`;
  return html;
}

function ensureImportCategories(categories: Array<Partial<Category> & { links?: unknown[]; children?: unknown[] }>): void {
  for (const category of categories) {
    if (!category.name) category.name = "未命名分类";
    if (!Array.isArray(category.links)) category.links = [];
    if (!Array.isArray(category.children)) category.children = [];
    for (const link of category.links) {
      const editable = link as Partial<Link>;
      if (!editable.title) editable.title = "未命名";
      if (!editable.url) editable.url = "about:blank";
    }
    ensureImportCategories(category.children as Array<Partial<Category> & { links?: unknown[]; children?: unknown[] }>);
  }
}

export function parseJsonBookmarks(text: string): NavData {
  const data = JSON.parse(text) as {
    categories?: unknown;
    links?: unknown;
  } & unknown[];

  if (data && typeof data === "object" && Array.isArray((data as { categories?: unknown }).categories)) {
    const navData = data as NavData;
    ensureImportCategories(navData.categories);
    return navData;
  }

  if (data && typeof data === "object" && Array.isArray((data as { links?: unknown }).links)) {
    const navData: NavData = {
      categories: [{ id: "", name: "书签", description: "", sort_order: 0, links: (data as { links: Link[] }).links, children: [] }],
    };
    ensureImportCategories(navData.categories);
    return navData;
  }

  if (Array.isArray(data)) {
    const navData: NavData = {
      categories: [{ id: "", name: "书签", description: "", sort_order: 0, links: data as Link[], children: [] }],
    };
    ensureImportCategories(navData.categories);
    return navData;
  }

  throw new Error("无法识别的 JSON 结构");
}
