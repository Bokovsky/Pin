<script setup lang="ts">
import { ref } from "vue"
import { importData } from "../api"
import type { NavData, Category, Link } from "../types"
import { Upload } from "lucide-vue-next"

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; imported: [] }>()

const error = ref("")
const loading = ref(false)
const fileInput = ref<HTMLInputElement>()
const activeTab = ref<"import" | "export">("import")
const preview = ref<{ data: NavData; fileName: string; summary: string } | null>(null)

/* ========== HTML Bookmark Parser ========== */

function parseHtmlBookmarks(html: string): NavData {
  const cats: Category[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  // Find all top-level H3 (category names) followed by DL (link lists)
  let dl = doc.querySelector("body > dl")
  if (!dl) dl = doc.querySelector("dl")
  if (!dl) throw new Error("无法识别书签文件格式")

  function parseLinks(container: Element): Link[] {
    const links: Link[] = []
    const as = container.querySelectorAll(":scope > dt > a")
    as.forEach(a => {
      const href = a.getAttribute("href") || ""
      if (!href || href.startsWith("place:")) return
      links.push({
        id: "",
        title: a.textContent?.trim() || "",
        url: href,
        description: a.getAttribute("description") || "",
        backup_url: "",
        sort_order: links.length,
        status: "",
      })
    })
    return links
  }

  function parseChildren(container: Element): Category[] {
    const children: Category[] = []
    const h3s = container.querySelectorAll(":scope > dt > h3")
    h3s.forEach(h3 => {
      const dt = h3.parentElement
      if (!dt) return
      const name = h3.textContent?.trim() || ""
      if (!name) return
      const nextDl = dt.querySelector(":scope > dl")
      const links = nextDl ? parseLinks(nextDl) : []
      const subChildren = nextDl ? parseChildren(nextDl) : []
      children.push({
        id: "",
        name,
        description: "",
        sort_order: children.length,
        links,
        children: subChildren,
      })
    })
    return children
  }

  // Parse top-level categories
  const topH3s = dl.querySelectorAll(":scope > dt > h3")
  topH3s.forEach(h3 => {
    const dt = h3.parentElement
    if (!dt) return
    const name = h3.textContent?.trim() || ""
    if (!name) return
    const nextDl = dt.querySelector(":scope > dl")
    const links = nextDl ? parseLinks(nextDl) : []
    const children = nextDl ? parseChildren(nextDl) : []
    cats.push({
      id: "",
      name,
      description: "",
      sort_order: cats.length,
      links,
      children,
    })
  })

  // If no categories found via H3, try flat link list
  if (cats.length === 0) {
    const links = parseLinks(dl)
    if (links.length > 0) {
      cats.push({
        id: "",
        name: "书签",
        description: "",
        sort_order: 0,
        links,
        children: [],
      })
    }
  }

  return { categories: cats }
}

/* ========== JSON Parser (forgiving) ========== */

function parseJsonBookmarks(text: string): NavData {
  const data = JSON.parse(text)

  // Already in NavData format
  if (data.categories && Array.isArray(data.categories)) {
    ensureImportCategories(data.categories)
    return data as NavData
  }

  // Flat link list: { links: [...] }
  if (data.links && Array.isArray(data.links)) {
    return { categories: [{ id: "", name: "书签", description: "", sort_order: 0, links: data.links, children: [] }] }
  }

  // Single link array
  if (Array.isArray(data)) {
    return { categories: [{ id: "", name: "书签", description: "", sort_order: 0, links: data, children: [] }] }
  }

  throw new Error("无法识别的 JSON 结构")
}

function ensureImportCategories(cats: any[]) {
  for (const cat of cats) {
    if (!cat.name) cat.name = "未命名分类"
    if (!Array.isArray(cat.links)) cat.links = []
    if (!Array.isArray(cat.children)) cat.children = []
    for (const link of cat.links) {
      if (!link.title) link.title = "未命名"
      if (!link.url) link.url = "about:blank"
    }
    ensureImportCategories(cat.children)
  }
}

/* ========== Import Handler ========== */

function buildSummary(data: NavData): string {
  let totalLinks = 0
  let totalCats = 0
  function count(cats: Category[]) {
    for (const c of cats) {
      totalCats++
      totalLinks += (c.links || []).length
      count(c.children || [])
    }
  }
  count(data.categories || [])
  return `${data.categories.length} 个一级分类，${totalLinks} 条链接`
}

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ""
  loading.value = true
  preview.value = null
  try {
    const text = await file.text()
    const ext = file.name.split(".").pop()?.toLowerCase()

    let navData: NavData

    if (ext === "json") {
      navData = parseJsonBookmarks(text)
    } else if (ext === "html" || ext === "htm") {
      navData = parseHtmlBookmarks(text)
    } else {
      try {
        navData = parseJsonBookmarks(text)
      } catch {
        navData = parseHtmlBookmarks(text)
      }
    }

    if (!navData.categories || navData.categories.length === 0) {
      error.value = "文件中未找到有效的分类或链接"
      return
    }

    preview.value = { data: navData, fileName: file.name, summary: buildSummary(navData) }
  } catch (e: any) {
    error.value = e.message || "解析失败，请确认文件格式正确"
  } finally {
    loading.value = false
  }
}

async function confirmImport() {
  if (!preview.value) return
  loading.value = true
  error.value = ""
  try {
    await importData(preview.value.data)
    preview.value = null
    emit("imported")
    emit("close")
  } catch (e: any) {
    error.value = e.message || "导入失败"
  } finally {
    loading.value = false
  }
}

function cancelImport() {
  preview.value = null
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (file) {
    const dt = new DataTransfer()
    dt.items.add(file)
    if (fileInput.value) {
      fileInput.value.files = dt.files
      fileInput.value.dispatchEvent(new Event("change"))
    }
  }
}

function handleClickInput() { fileInput.value?.click() }

/* ========== Export Handlers ========== */

function toNavData(cats: Category[]): any[] {
  return cats.map(c => ({
    name: c.name,
    description: c.description,
    links: c.links.map(l => ({
      title: l.title,
      url: l.url,
      description: l.description,
      backup_url: l.backup_url,
      sort_order: l.sort_order,
    })),
    children: c.children.map(child => ({
      name: child.name,
      description: child.description,
      links: child.links.map(l => ({
        title: l.title,
        url: l.url,
        description: l.description,
        backup_url: l.backup_url,
        sort_order: l.sort_order,
      })),
    })),
  }))
}

async function handleExportJson() {
  try {
    const res = await fetch("/api/nav")
    const raw = await res.json()
    const data = { categories: toNavData(raw.categories || []) }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    download(blob, `pin-export-${dateStr()}.json`)
    emit("close")
  } catch (e: any) {
    error.value = e.message || "导出失败"
  }
}

async function handleExportHtml() {
  try {
    const res = await fetch("/api/nav")
    const raw = await res.json()
    const cats = raw.categories || []

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Pin Bookmarks</TITLE>
<H1>Pin Bookmarks</H1>
<DL><p>\n`

    function renderLinks(links: Link[]) {
      return links.map(l =>
        `    <DT><A HREF="${escapeHtml(l.url)}" ADD_DATE="${Math.floor(Date.now() / 1000)}">${escapeHtml(l.title)}</A>\n`
      ).join("")
    }

    function renderChildren(children: any[] | undefined, indent: string): string {
      if (!children) return ""
      return children.map((child: any) => {
        const childLinks = child.links || []
        const grandChildren = child.children || []
        if (childLinks.length === 0 && grandChildren.length === 0) return ""
        let s = `${indent}<DT><H3>${escapeHtml(child.name || "未命名")}</H3>\n${indent}<DL><p>\n`
        if (childLinks.length > 0) s += renderLinks(childLinks).replace(/^/gm, indent)
        if (grandChildren.length > 0) s += renderChildren(grandChildren, indent + "    ")
        s += `${indent}</DL><p>\n`
        return s
      }).join("")
    }

    cats.forEach((cat: any) => {
      const catLinks = cat.links || []
      const catChildren = cat.children || []
      if (catLinks.length === 0 && catChildren.length === 0) return
      html += `  <DT><H3>${escapeHtml(cat.name || "未命名")}</H3>\n  <DL><p>\n`
      if (catLinks.length > 0) html += renderLinks(catLinks).replace(/^/gm, "    ")
      if (catChildren.length > 0) html += renderChildren(catChildren, "    ")
      html += `  </DL><p>\n`
    })

    html += `</DL><p>\n`
    const blob = new Blob([html], { type: "text/html" })
    download(blob, `pin-export-${dateStr()}.html`)
    emit("close")
  } catch (e: any) {
    error.value = e.message || "导出失败"
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function dateStr() {
  return new Date().toISOString().split("T")[0]
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
</script>

<template>
  <d-modal :model-value="open" title="导入 / 导出" @update:model-value="emit('close')" :close-on-click-overlay="true">
    <div class="flex gap-2 mb-4 border-b border-[var(--pin-border)] pb-2">
      <button
        @click="activeTab = 'import'"
        class="px-3 py-1.5 rounded-md transition-colors"
        :style="{
          color: activeTab === 'import' ? 'var(--pin-accent)' : 'var(--pin-ink-muted)',
          background: activeTab === 'import' ? 'color-mix(in srgb, var(--pin-accent) 10%, transparent)' : 'transparent',
          fontSize: '16px',
        }"
      >导入</button>
      <button
        @click="activeTab = 'export'"
        class="px-3 py-1.5 rounded-md transition-colors"
        :style="{
          color: activeTab === 'export' ? 'var(--pin-accent)' : 'var(--pin-ink-muted)',
          background: activeTab === 'export' ? 'color-mix(in srgb, var(--pin-accent) 10%, transparent)' : 'transparent',
          fontSize: '16px',
        }"
      >导出</button>
    </div>

    <!-- Import -->
    <div v-if="activeTab === 'import'">
      <!-- Preview mode -->
      <div v-if="preview" class="space-y-4">
        <div class="p-4 rounded-xl" style="background: var(--pin-surface-hover)">
          <p style="font-size: 14px; color: var(--pin-ink-muted)">文件：{{ preview.fileName }}</p>
          <p class="mt-2" style="font-size: 16px; color: var(--pin-ink)">{{ preview.summary }}</p>
        </div>
        <p style="font-size: 16px; color: var(--pin-ink-muted)">导入后将替换当前所有链接，是否继续？</p>
        <div class="flex justify-end gap-3">
          <button @click="cancelImport" class="px-4 py-2 rounded-lg transition-colors hover:bg-[var(--pin-surface-hover)]" style="color: var(--pin-ink-muted); font-size: 16px">取消</button>
          <button @click="confirmImport" class="px-5 py-2 rounded-lg transition-colors" :disabled="loading" style="font-size: 16px; background: var(--pin-accent); color: var(--pin-accent-text)">{{ loading ? '导入中...' : '确认导入' }}</button>
        </div>
      </div>

      <!-- File picker mode -->
      <div v-else>
        <p class="mb-3" style="color: var(--pin-ink-muted); font-size: 16px">支持 HTML（浏览器书签）和 JSON 格式，将替换当前全部链接。</p>
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
          :class="{ 'opacity-50': loading }"
          style="border-color: var(--pin-border); color: var(--pin-ink-muted)"
          @click="handleClickInput"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <Upload class="h-10 w-10 mx-auto mb-3" style="color: var(--pin-ink-muted)" />
          <p style="font-size: 16px">{{ loading ? '读取中...' : '拖拽或点击选择文件' }}</p>
          <p class="mt-1" style="font-size: 14px; color: var(--pin-ink-muted)">.html / .htm / .json</p>
          <input ref="fileInput" type="file" accept=".html,.htm,.json" class="hidden" @change="handleFile" />
        </div>
      </div>
    </div>

    <!-- Export -->
    <div v-else>
      <p class="mb-4" style="color: var(--pin-ink-muted); font-size: 16px">选择导出格式：</p>
      <div class="space-y-3">
        <div
          @click="handleExportJson"
          class="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors border hover:bg-[var(--pin-surface-hover)]"
          :style="{ borderColor: 'var(--pin-border)' }"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: color-mix(in srgb, var(--pin-accent) 15%, transparent)">
            <span style="color: var(--pin-accent); font-size: 16px">{ }</span>
          </div>
          <div class="flex-1">
            <p style="font-size: 16px; color: var(--pin-ink)">JSON 格式</p>
             <p style="font-size: 14px; color: var(--pin-ink-muted)">Pin 兼容格式，含分类、链接、备用地址</p>
          </div>
        </div>
        <div
          @click="handleExportHtml"
          class="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors border hover:bg-[var(--pin-surface-hover)]"
          :style="{ borderColor: 'var(--pin-border)' }"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: color-mix(in srgb, var(--pin-accent) 15%, transparent)">
            <span style="color: var(--pin-accent); font-size: 16px">&lt;/&gt;</span>
          </div>
          <div class="flex-1">
            <p style="font-size: 16px; color: var(--pin-ink)">HTML 格式</p>
            <p style="font-size: 14px; color: var(--pin-ink-muted)">浏览器书签标准格式，可导入 Chrome / Edge / Firefox</p>
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="mt-3" style="color: var(--pin-danger); font-size: 16px">{{ error }}</p>

    <div class="flex justify-end mt-4">
      <button @click="emit('close')" class="px-4 py-2 rounded-lg transition-colors hover:bg-[var(--pin-surface-hover)]" style="color: var(--pin-ink-muted); font-size: 16px">关闭</button>
    </div>
  </d-modal>
</template>
