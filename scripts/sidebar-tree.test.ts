import test from "node:test";
import assert from "node:assert/strict";
import { toSidebarNodes } from "../src/client/sidebarTree.ts";
import type { Category } from "../src/client/types.ts";

function category(
  id: string,
  name: string,
  children: Category[] = []
): Category {
  return { id, name, description: "", sort_order: 0, links: [], children };
}

test("top-level categories map to sidebar nodes", () => {
  const nodes = toSidebarNodes([category("c1", "临时"), category("c2", "资讯")]);
  assert.deepEqual(nodes, [
    { id: "c1", label: "临时", children: [] },
    { id: "c2", label: "资讯", children: [] },
  ]);
});

test("child categories nest under their parent node", () => {
  const nodes = toSidebarNodes([
    category("c1", "工具", [category("c2", "镜像加速")]),
  ]);
  assert.deepEqual(nodes, [
    {
      id: "c1",
      label: "工具",
      children: [{ id: "c2", label: "镜像加速", children: [] }],
    },
  ]);
});

test("sidebar nodes resolve to scroll anchors", async () => {
  const { resolveCategoryAnchorId } = await import(
    "../src/client/searchFilter.ts"
  );
  const nodes = toSidebarNodes([category("c1", "临时")]);
  assert.equal(resolveCategoryAnchorId(nodes[0]), "c1");
});
