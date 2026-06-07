import { createApp } from "vue"
import App from "./App.vue"
import "./style.css"

import DevUI from "vue-devui"
import "vue-devui/style.css"

const app = createApp(App)
app.use(DevUI)
app.mount("#app")
