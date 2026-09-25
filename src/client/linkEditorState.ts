export type LinkEditorSource =
  | { id?: unknown; _categoryId?: unknown }
  | null
  | undefined;

export interface LinkEditorMode {
  mode: "create" | "edit";
  linkId?: string;
  initialCategoryId?: string;
}

export function resolveLinkEditorMode(
  source: LinkEditorSource,
  availableCategoryIds: string[]
): LinkEditorMode {
  const linkId =
    source !== null &&
    typeof source === "object" &&
    typeof source.id === "string" &&
    source.id.length > 0
      ? source.id
      : undefined;
  if (linkId !== undefined) {
    return { mode: "edit", linkId };
  }

  const presetCategoryId =
    source !== null &&
    typeof source === "object" &&
    typeof source._categoryId === "string" &&
    availableCategoryIds.includes(source._categoryId)
      ? source._categoryId
      : availableCategoryIds[0];
  return {
    mode: "create",
    initialCategoryId: presetCategoryId,
  };
}
