import { createApp } from "vue"
import App from "./App.vue"
import "./style.css"

import { QuailUI } from "quail-ui"
import "quail-ui/style.css"
import { applyTheme as applyQuailTheme } from "quail-ui"

applyQuailTheme("dark", false)
document.documentElement.setAttribute("data-theme", "dark")

const app = createApp(App)
app.use(QuailUI)
app.mount("#app")
