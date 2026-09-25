import { ref } from "vue"
import { applyTheme as applyQuailTheme } from "quail-ui"
import { resolveQuailUiTheme } from "../quailTheme"

export type Theme = "light" | "dark"

const STORAGE_KEY = "pin-theme"

function resolveStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

const theme = ref<Theme>(resolveStoredTheme())
const resolved = ref<Theme>("dark")

function applyTheme() {
  resolved.value = theme.value
  applyQuailTheme(resolveQuailUiTheme(theme.value), false)
  document.documentElement.setAttribute("data-theme", resolved.value)
}

export function setTheme(t: Theme) {
  theme.value = t
  localStorage.setItem(STORAGE_KEY, t)
  applyTheme()
}

export function useTheme() {
  if (typeof window !== "undefined") {
    applyTheme()
    if (localStorage.getItem(STORAGE_KEY) !== theme.value) {
      localStorage.setItem(STORAGE_KEY, theme.value)
    }
  }
  return { theme, resolved, setTheme }
}
