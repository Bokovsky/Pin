export interface ScrollableTarget {
  scrollTo(options: ScrollToOptions): void;
  scrollHeight?: number;
  clientHeight?: number;
}

export interface ScrollableRoot {
  querySelector(selector: string): ScrollableTarget | null;
}

export function scrollContentToTop(root: ScrollableRoot, fallback: () => void): boolean {
  const target = root.querySelector("[data-pin-content]");
  const scrollHeight = target?.scrollHeight ?? Number.POSITIVE_INFINITY;
  const clientHeight = target?.clientHeight ?? 0;
  if (!target || scrollHeight <= clientHeight + 1) {
    fallback();
    return false;
  }
  target.scrollTo({ top: 0, behavior: "smooth" });
  return true;
}
