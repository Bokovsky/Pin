import { Hono } from "hono"
import { readData, writeData, generateId, type NavData, type Category, type Link } from "./data"

export const apiRoutes = new Hono()

function findCategory(data: NavData, id: string): Category | null {
  if (!data?.categories) return null
  for (const cat of data.categories) {
    if (cat.id === id) return cat
    const found = findCategory({ categories: cat.children || [] }, id)
    if (found) return found
  }
  return null
}

function findLinkInCategories(categories: Category[] | undefined, linkId: string): { category: Category; linkIndex: number } | null {
  if (!categories) return null
  for (const cat of categories) {
    const idx = (cat.links || []).findIndex((l) => l.id === linkId)
    if (idx !== -1) return { category: cat, linkIndex: idx }
    const found = findLinkInCategories(cat.children, linkId)
    if (found) return found
  }
  return null
}

function findLinkParent(data: NavData, linkId: string): { category: Category; linkIndex: number } | null {
  return findLinkInCategories(data?.categories, linkId)
}

function deleteCategoryRecursive(categories: Category[] | undefined, id: string): boolean {
  if (!categories) return false
  const idx = categories.findIndex((c) => c.id === id)
  if (idx !== -1) {
    categories.splice(idx, 1)
    return true
  }
  for (const cat of categories) {
    if (deleteCategoryRecursive(cat.children, id)) return true
  }
  return false
}

function collectAllLinks(data: NavData): Link[] {
  const links: Link[] = []
  function crawl(categories: Category[] | undefined) {
    if (!categories) return
    for (const cat of categories) {
      links.push(...(cat.links || []))
      crawl(cat.children)
    }
  }
  crawl(data?.categories)
  return links
}

apiRoutes.get("/nav", async (c) => {
  try {
    const data = await readData()
    return c.json(data)
  } catch (err) {
    return c.json({ error: "Failed to read data" }, 500)
  }
})

apiRoutes.post("/category", async (c) => {
  try {
    const body = await c.req.json<Partial<Category> & { parentId?: string }>()
    const data = await readData()
    const category: Category = {
      id: generateId(),
      name: body.name || "",
      description: body.description || "",
      sort_order: typeof body.sort_order === "number" ? body.sort_order : data.categories.length,
      links: body.links || [],
      children: body.children || [],
    }
    ensureIds({ categories: [category] })
    if (body.parentId) {
      const parent = findCategory(data, body.parentId)
      if (!parent) {
        return c.json({ error: "Parent category not found" }, 404)
      }
      parent.children.push(category)
    } else {
      data.categories.push(category)
    }
    await writeData(data)
    return c.json(category, 201)
  } catch (err) {
    return c.json({ error: "Failed to create category" }, 500)
  }
})

apiRoutes.put("/category/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const body = await c.req.json<Partial<Category>>()
    const data = await readData()
    const category = findCategory(data, id)
    if (!category) {
      return c.json({ error: "Category not found" }, 404)
    }
    if (body.name !== undefined) category.name = body.name
    if (body.description !== undefined) category.description = body.description
    if (body.sort_order !== undefined) category.sort_order = body.sort_order
    await writeData(data)
    return c.json(category)
  } catch (err) {
    return c.json({ error: "Failed to update category" }, 500)
  }
})

apiRoutes.delete("/category/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const data = await readData()
    const deleted = deleteCategoryRecursive(data.categories, id)
    if (!deleted) {
      return c.json({ error: "Category not found" }, 404)
    }
    await writeData(data)
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: "Failed to delete category" }, 500)
  }
})

apiRoutes.post("/link", async (c) => {
  try {
    const body = await c.req.json<{ categoryId: string; link: Omit<Link, "id" | "status"> }>()
    const data = await readData()
    const category = findCategory(data, body.categoryId)
    if (!category) {
      return c.json({ error: "Category not found" }, 404)
    }
    const link: Link = {
      id: generateId(),
      title: body.link.title || "",
      url: body.link.url || "",
      description: body.link.description || "",
      backup_url: body.link.backup_url || "",
      sort_order: typeof body.link.sort_order === "number" ? body.link.sort_order : 0,
      status: "",
    }
    category.links.push(link)
    await writeData(data)
    return c.json(link, 201)
  } catch (err) {
    return c.json({ error: "Failed to create link" }, 500)
  }
})

apiRoutes.put("/link/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const body = await c.req.json<Partial<Link>>()
    const data = await readData()
    const parent = findLinkParent(data, id)
    if (!parent) {
      return c.json({ error: "Link not found" }, 404)
    }
    const link = parent.category.links[parent.linkIndex]
    if (body.title !== undefined) link.title = body.title
    if (body.url !== undefined) link.url = body.url
    if (body.description !== undefined) link.description = body.description
    if (body.backup_url !== undefined) link.backup_url = body.backup_url
    if (body.sort_order !== undefined) link.sort_order = body.sort_order
    if (body.status !== undefined) link.status = body.status
    await writeData(data)
    return c.json(link)
  } catch (err) {
    return c.json({ error: "Failed to update link" }, 500)
  }
})

apiRoutes.delete("/link/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const data = await readData()
    const parent = findLinkParent(data, id)
    if (!parent) {
      return c.json({ error: "Link not found" }, 404)
    }
    parent.category.links.splice(parent.linkIndex, 1)
    await writeData(data)
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: "Failed to delete link" }, 500)
  }
})

apiRoutes.post("/check", async (c) => {
  try {
    const data = await readData()
    const allLinks = collectAllLinks(data)

    for (const link of allLinks) {
      link.status = "pending"
    }
    await writeData(data)

    const results = await Promise.all(
      allLinks.map(async (link) => {
        try {
          const res = await fetch(link.url, { method: "HEAD", signal: AbortSignal.timeout(5000) })
          link.status = res.ok ? "ok" : "fail"
        } catch {
          link.status = "fail"
        }
        return { id: link.id, status: link.status }
      })
    )

    await writeData(data)
    return c.json(results)
  } catch (err) {
    return c.json({ error: "Failed to check links" }, 500)
  }
})

apiRoutes.post("/reorder", async (c) => {
  try {
    const body = await c.req.json<Array<{ id: string; sort_order: number }>>()
    const data = await readData()
    const allLinks = collectAllLinks(data)
    const linkMap = new Map(allLinks.map((l) => [l.id, l]))
    for (const { id, sort_order } of body) {
      const link = linkMap.get(id)
      if (link) {
        link.sort_order = sort_order
      }
    }
    await writeData(data)
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: "Failed to reorder" }, 500)
  }
})

function ensureIds(data: NavData): NavData {
  function ensureCategoryIds(cat: Category) {
    if (!cat.id) cat.id = generateId()
    if (!Array.isArray(cat.links)) cat.links = []
    for (const link of cat.links) {
      if (!link.id) link.id = generateId()
      if (!link.status) link.status = ""
    }
    if (!Array.isArray(cat.children)) cat.children = []
    for (const child of cat.children) {
      ensureCategoryIds(child)
    }
  }
  for (const cat of data.categories) {
    ensureCategoryIds(cat)
  }
  return data
}

apiRoutes.post("/import", async (c) => {
  try {
    const body = await c.req.json<NavData>()
    if (!body || !Array.isArray(body.categories)) {
      return c.json({ error: "Invalid format: missing categories array" }, 400)
    }
    for (const cat of body.categories) {
      if (!cat.name) {
        return c.json({ error: "Invalid format: category name is required" }, 400)
      }
    }
    ensureIds(body)
    await writeData(body)
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: "Import failed", detail: String(err) }, 500)
  }
})
