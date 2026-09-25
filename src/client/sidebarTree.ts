import type { Category } from "./types";

export interface SidebarNode {
  id: string;
  label: string;
  children: SidebarNode[];
}

function toChildNode(category: Category): SidebarNode {
  return { id: category.id, label: category.name, children: [] };
}

export function toSidebarNodes(categories: Category[]): SidebarNode[] {
  return categories.map((category) => ({
    id: category.id,
    label: category.name,
    children: category.children.map(toChildNode),
  }));
}
