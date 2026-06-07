import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { serveStatic } from "@hono/node-server/serve-static"
import { apiRoutes } from "./api"
import fs from "fs/promises"
import path from "path"

const app = new Hono()

app.route("/api", apiRoutes)

const distDir = path.resolve(process.cwd(), "dist")

app.use("/*", serveStatic({ root: "./dist" }))

app.get("/*", async (c) => {
  try {
    const indexPath = path.join(distDir, "index.html")
    await fs.access(indexPath)
    const content = await fs.readFile(indexPath, "utf-8")
    return c.html(content)
  } catch {
    return c.text("Not Found", 404)
  }
})

const port = parseInt(process.env.PORT || "3000", 10)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Pin server running at http://localhost:${info.port}`)
})
