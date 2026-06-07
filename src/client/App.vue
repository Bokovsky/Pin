<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { fetchNav } from "./api"
import type { NavData } from "./types"
import SearchBar from "./components/SearchBar.vue"
import CategoryTabs from "./components/CategoryTabs.vue"
import LinkGrid from "./components/LinkGrid.vue"
import Toolbar from "./components/Toolbar.vue"
import LinkEditor from "./components/LinkEditor.vue"
import CategoryEditor from "./components/CategoryEditor.vue"
import ImportDialog from "./components/ImportDialog.vue"
import { Sun, Moon, Monitor, Upload } from "lucide-vue-next"
import { useTheme } from "./composables/useTheme"

const data = ref<NavData>({ categories: [] })
const searchQuery = ref("")
const loading = ref(true)
const error = ref("")
const showLinkEditor = ref(false)
const editingLink = ref<any>(null)
const showCategoryEditor = ref(false)
const editingCategory = ref<any>(null)
const showImport = ref(false)

const { theme, resolved, cycleTheme, themeLabel } = useTheme()

const filteredCategories = computed(() => {
  if (!searchQuery.value) return data.value.categories
  const q = searchQuery.value.toLowerCase()
  const result: typeof data.value.categories = []

  for (const cat of data.value.categories) {
    const catLinks = cat.links.filter(l =>
      l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
    )
    const children = cat.children.map(child => ({
      ...child,
      links: child.links.filter(l =>
        l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
      ),
    })).filter(child => child.links.length > 0)
    const hasLinks = catLinks.length > 0 || children.length > 0
    if (hasLinks) {
      result.push({ ...cat, links: catLinks, children })
    }
  }
  return result
})

function refreshData() {
  loading.value = true
  error.value = ""
  fetchNav()
    .then(d => { data.value = d })
    .catch(e => { error.value = e.message })
    .finally(() => { loading.value = false })
}

function handleAddLink(categoryId?: string) {
  editingLink.value = categoryId ? { _categoryId: categoryId } : null
  showLinkEditor.value = true
}

function handleEditLink(link: any) {
  editingLink.value = link
  showLinkEditor.value = true
}

async function handleDeleteLink(link: any) {
  if (confirm("确认删除此链接？")) {
    const { deleteLink } = await import("./api")
    await deleteLink(link.id)
    refreshData()
  }
}

function scrollToCategory(id: string) {
  const el = document.getElementById("cat-" + id)
  el?.scrollIntoView({ behavior: "smooth", block: "start" })
}

onMounted(refreshData)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Full-width header -->
    <header class="sticky top-0 z-40 bg-[var(--pin-surface)]/80 backdrop-blur border-b border-[var(--pin-border)]">
      <div class="flex items-center gap-4 px-6 py-3 max-w-7xl mx-auto">
        <!-- Logo -->
        <div class="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
             style="background: color-mix(in srgb, var(--pin-accent) 15%, transparent)">
          <span class="text-xl" style="color: var(--pin-accent); font-weight: 400">Pin</span>
        </div>

        <!-- Centered search -->
        <div class="flex-1 flex justify-center">
          <SearchBar v-model="searchQuery" />
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <button @click="showImport = true"
            class="px-3 py-2.5 rounded-xl hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors flex items-center gap-1.5 text-sm"
            title="导入/导出">
            <Upload class="h-5 w-5" />
            <span>导入/导出</span>
          </button>
          <button @click="cycleTheme"
            class="p-2.5 rounded-xl hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors"
            :title="'主题: ' + themeLabel">
            <Monitor v-if="theme === 'system'" class="h-5 w-5" />
            <Sun v-else-if="resolved === 'light'" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

    <!-- Body: sidebar + main -->
    <div class="flex flex-1 overflow-hidden">
      <aside class="w-60 flex-shrink-0 border-r border-[var(--pin-border)] overflow-y-auto" style="background: color-mix(in srgb, var(--pin-surface) 95%, transparent)">
        <div class="px-2 py-3">
          <CategoryTabs :categories="data.categories" @select="scrollToCategory" />
        </div>
      </aside>

      <main class="flex-1 overflow-y-auto px-6 py-6">
        <div v-if="loading" class="space-y-6 px-6 py-6">
          <div v-for="i in 3" :key="i" class="space-y-3">
            <div class="h-5 w-24 rounded animate-pulse" style="background: var(--pin-surface-hover)" />
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <div v-for="j in 6" :key="j" class="h-20 rounded-lg animate-pulse" style="background: var(--pin-surface-hover)" />
            </div>
          </div>
        </div>
        <div v-else-if="error" class="text-center py-20 text-[var(--pin-danger)]">{{ error }}</div>
        <div v-else-if="filteredCategories.length === 0" class="text-center py-20 text-[var(--pin-ink-muted)]">
          {{ searchQuery ? '无匹配结果' : '暂无链接，点击底部 + 按钮添加' }}
        </div>
        <LinkGrid
          v-else
          :categories="filteredCategories"
          @edit="handleEditLink"
          @delete="handleDeleteLink"
          @refresh="refreshData"
          @add-link="handleAddLink"
        />
      </main>
    </div>

    <Toolbar @add-link="handleAddLink()" @refresh="refreshData" />

    <LinkEditor
      :open="showLinkEditor"
      :link="editingLink"
      :categories="data.categories"
      @close="showLinkEditor = false"
      @saved="refreshData"
    />

    <CategoryEditor
      :open="showCategoryEditor"
      :category="editingCategory"
      :categories="data.categories"
      @close="showCategoryEditor = false"
      @saved="refreshData"
    />

    <ImportDialog
      :open="showImport"
      @close="showImport = false"
      @imported="refreshData"
    />
  </div>
</template>
