<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { fetchNav, importData } from "../api"
import type { NavData, Category, Link } from "../types"
import {
  extractBookmarkLinkAttributes,
  parseJsonBookmarks,
  renderBookmarkHtml,
  toNavData,
} from "../bookmarks"
import { Upload } from "lucide-vue-next"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; imported: [] }>()

const error = ref("")
const loading = ref(false)
const fileInput = ref<HTMLInputElement>()
const activeTab = ref<"import" | "export">("import")
const preview = ref<{ data: NavData; fileName: string; summary: string } | null>(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    activeTab.value = "import"
    preview.value = null
    error.value = ""
    if (fileInput.value) {
      fileInput.value.value = ""
    }
  }
})

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
      const attributes = extractBookmarkLinkAttributes(a, links.length)
      links.push({
        id: "",
        title: a.textContent?.trim() || "",
        url: href,
        description: attributes.description,
        backup_url: attributes.backup_url,
        sort_order: attributes.sort_order,
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

async function readBookmarkFile(file: File) {
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

async function handleFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await readBookmarkFile(file)
  input.value = ""
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

const importTabs = [
  { id: "import", title: "导入" },
  { id: "export", title: "导出" },
]

const activeTabItem = computed(
  () => importTabs.find((tab) => tab.id === activeTab.value) ?? importTabs[0]
)

function handleTabChange(tab: { id: string }) {
  activeTab.value = tab.id === "export" ? "export" : "import"
}

const exportItems = [
  { id: "json", title: "JSON 格式", subtitle: "Pin 兼容格式，含分类、链接、备用地址" },
  { id: "html", title: "HTML 格式", subtitle: "浏览器书签标准格式，可导入 Chrome / Edge / Firefox" },
]

function handleExportAction(item: { id: string }) {
  if (item.id === "html") {
    handleExportHtml()
  } else {
    handleExportJson()
  }
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (file) {
    await readBookmarkFile(file)
  }
}

function handleClickInput() { fileInput.value?.click() }

/* ========== Export Handlers ========== */

async function handleExportJson() {
  try {
    const raw = await fetchNav()
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
    const raw = await fetchNav()
    const html = renderBookmarkHtml(raw.categories || [])
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
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function dateStr() {
  return new Date().toISOString().split("T")[0]
}

</script>

<template>
  <QDialog :model-value="open" title="导入 / 导出" @update:model-value="emit('close')">
    <div class="mb-4 border-b border-[var(--pin-border)] pb-2">
      <QTabs :model-value="activeTabItem" :tabs="importTabs" variant="plain" @update:model-value="handleTabChange" />
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
          <QButton class="outlined" type="button" @click="cancelImport">取消</QButton>
          <QButton class="primary" type="button" :disabled="loading" @click="confirmImport">{{ loading ? '导入中...' : '确认导入' }}</QButton>
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
      <div class="pin-static-menu">
        <QMenu :items="exportItems" @action="handleExportAction" />
      </div>
    </div>

    <QFence v-if="error" type="error" :text="error" role="alert" class="mt-3" />

    <div class="flex justify-end mt-4">
      <QButton class="outlined" type="button" @click="emit('close')">关闭</QButton>
    </div>
  </QDialog>
</template>
