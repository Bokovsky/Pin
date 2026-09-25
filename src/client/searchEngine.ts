import type { Category, Link } from "./types";

export function findFirstVisibleLink(categories: Category[]): Link | undefined {
  for (const category of categories) {
    const direct = category.links[0];
    if (direct) {
      return direct;
    }
    for (const child of category.children) {
      const nested = child.links[0];
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}

export function normalizeSearchEngineUrl(value: string): string | undefined {
  const candidate = value.trim();
  if (candidate === "") {
    return undefined;
  }
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return undefined;
  }
  return candidate;
}
