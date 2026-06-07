import { ref, computed } from "vue"

export type Theme = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

const STORAGE_KEY = "pin-theme"

const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || "system")
const resolved = ref<ResolvedTheme>("dark")

function applyTheme() {
  const isDark =
    theme.value === "dark" ||
    (theme.value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  resolved.value = isDark ? "dark" : "light"
  document.documentElement.setAttribute("data-theme", resolved.value)
}

export function setTheme(t: Theme) {
  theme.value = t
  localStorage.setItem(STORAGE_KEY, t)
  applyTheme()
}

export function cycleTheme() {
  const order: Theme[] = ["system", "light", "dark"]
  const idx = order.indexOf(theme.value)
  setTheme(order[(idx + 1) % order.length])
}

const themeIcon = computed(() => {
  if (theme.value === "system") return "Monitor"
  return resolved.value === "dark" ? "Moon" : "Sun"
})

const themeLabel = computed(() => {
  if (theme.value === "system") return "跟随系统"
  return resolved.value === "dark" ? "深色" : "浅色"
})

let mediaQuery: MediaQueryList | null = null

export function useTheme() {
  if (typeof window !== "undefined" && !mediaQuery) {
    applyTheme()
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", applyTheme)
  }
  return { theme, resolved, setTheme, cycleTheme, themeIcon, themeLabel }
}
