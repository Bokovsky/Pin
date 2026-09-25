import { createApp } from "vue"
import App from "./App.vue"
import "./style.css"

import { QuailUI } from "quail-ui"
import "quail-ui/style.css"

const app = createApp(App)
app.use(QuailUI)
app.mount("#app")
