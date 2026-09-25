import type { Link } from "./types";

export interface ContextMenuItem {
  id: string;
  title?: string;
  divider?: boolean;
  danger?: boolean;
}

export function buildContextMenuItems(link: Link): ContextMenuItem[] {
  const items: ContextMenuItem[] = [{ id: "open", title: "打开链接" }];
  if (link.backup_url) {
    items.push({ id: "open-backup", title: "打开备用链接" });
  }
  items.push(
    { id: "divider-1", divider: true },
    { id: "copy", title: "复制链接" },
    { id: "qr", title: "二维码" },
    { id: "divider-2", divider: true },
    { id: "edit", title: "编辑" },
    { id: "delete", title: "删除", danger: true }
  );
  return items;
}
