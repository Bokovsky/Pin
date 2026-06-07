import { readFileSync, writeFileSync } from "fs"
import { randomUUID } from "crypto"

const input = JSON.parse(readFileSync("OneNav_Export_2026.6.6.json", "utf-8"))

function ensureIds(categories: any[]) {
  for (const cat of categories) {
    if (!cat.id) cat.id = randomUUID()
    if (!Array.isArray(cat.links)) cat.links = []
    for (const link of cat.links) {
      if (!link.id) link.id = randomUUID()
      if (!link.status) link.status = ""
    }
    if (!Array.isArray(cat.children)) cat.children = []
    for (const child of cat.children) {
      if (!child.id) child.id = randomUUID()
      if (!Array.isArray(child.links)) child.links = []
      for (const link of child.links) {
        if (!link.id) link.id = randomUUID()
        if (!link.status) link.status = ""
      }
      ensureIds(child.children || [])
    }
  }
}

ensureIds(input.categories)
writeFileSync("data/links.json", JSON.stringify(input, null, 2))
console.log("Migration done: data/links.json created with", input.categories.length, "categories")
