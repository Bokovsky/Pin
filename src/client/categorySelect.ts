export interface CategorySelectItem {
  title: string;
  value: string;
}

export function toCategorySelectItems(
  categories: { id: string; label: string }[]
): CategorySelectItem[] {
  return categories.map((category) => ({
    title: category.label,
    value: category.id,
  }));
}

export function findCategorySelectItem(
  items: CategorySelectItem[],
  categoryId: string
): CategorySelectItem | null {
  if (!categoryId) return null;
  return items.find((item) => item.value === categoryId) ?? null;
}
