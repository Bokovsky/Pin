import type { Theme } from "./composables/useTheme";

export type QuailUiTheme = "light" | "dark";

export function resolveQuailUiTheme(theme: Theme): QuailUiTheme {
  return theme;
}
