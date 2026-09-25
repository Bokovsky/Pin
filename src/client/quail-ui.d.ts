declare module "quail-ui" {
  export function applyTheme(theme: "light" | "dark" | "morph", persist?: boolean): string;
  export const QuailUI: { install(app: unknown): void };
}
