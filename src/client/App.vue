<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { fetchNav } from "./api"
import type { NavData } from "./types"
import SearchBar from "./components/SearchBar.vue"
import LinkGrid from "./components/LinkGrid.vue"
import Toolbar from "./components/Toolbar.vue"
import LinkEditor from "./components/LinkEditor.vue"
import CategoryEditor from "./components/CategoryEditor.vue"
import ImportDialog from "./components/ImportDialog.vue"
import CategoryManager from "./components/CategoryManager.vue"
import { filterCategoriesByQuery, resolveCategoryAnchorId } from "./searchFilter"
import { findFirstVisibleLink } from "./searchEngine"
import {
  createDataLoadState,
  failDataRefresh,
  finishDataRefresh,
  startDataRefresh,
  type DataLoadState,
} from "./loadingState"
import { FolderKanban, Upload, ChevronsLeft, ChevronsRight } from "lucide-vue-next"
import { useTheme } from "./composables/useTheme"
import { toSidebarNodes } from "./sidebarTree"

const data = ref<NavData>({ categories: [] })
const searchQuery = ref("")
const loadState = ref<DataLoadState>({ ...createDataLoadState(), initialLoading: true })
const showLinkEditor = ref(false)
const editingLink = ref<any>(null)
const showCategoryEditor = ref(false)
const editingCategory = ref<any>(null)
const showImport = ref(false)
const showCategoryManager = ref(false)
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

const { resolved, setTheme } = useTheme()

const checked = computed({
  get: () => resolved.value === "dark",
  set: (value: boolean) => setTheme(value ? "dark" : "light"),
})

const filteredCategories = computed(() => filterCategoriesByQuery(data.value.categories, searchQuery.value))

const sidebarNodes = computed(() => toSidebarNodes(filteredCategories.value))

async function loadInitialData() {
  startDataRefresh(loadState.value, "initial")
  try {
    data.value = await fetchNav()
    finishDataRefresh(loadState.value, "initial")
  } catch (e: unknown) {
    failDataRefresh(loadState.value, "initial", e instanceof Error ? e : new Error("加载失败"))
  }
}

async function refreshData() {
  startDataRefresh(loadState.value, "background")
  try {
    data.value = await fetchNav()
    finishDataRefresh(loadState.value, "background")
  } catch (e: unknown) {
    failDataRefresh(loadState.value, "background", e instanceof Error ? e : new Error("刷新失败"))
  }
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
  if (!confirm("确认删除此链接？")) {
    return
  }
  try {
    const { deleteLink } = await import("./api")
    await deleteLink(link.id)
    await refreshData()
  } catch (e: unknown) {
    failDataRefresh(loadState.value, "background", e instanceof Error ? e : new Error("删除失败"))
  }
}

function scrollToCategory(node: unknown) {
  const categoryId = resolveCategoryAnchorId(node)
  if (!categoryId) {
    return
  }
  const el = document.getElementById("cat-" + categoryId)
  el?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function openFirstSearchResult() {
  const link = findFirstVisibleLink(filteredCategories.value)
  if (link) {
    window.open(link.url, "_blank")
  }
}

onMounted(loadInitialData)
</script>

<template>
  <div class="h-screen overflow-hidden flex flex-col">
    <header class="pin-shell-header relative z-40 flex-none bg-[var(--pin-surface)]/80 backdrop-blur border-b border-[var(--pin-border)]">
      <!-- Logo -->
      <div class="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
           style="background: color-mix(in srgb, var(--pin-accent) 15%, transparent)">
        <span class="text-xl" style="color: var(--pin-accent); font-weight: 400">Pin</span>
      </div>

        <!-- Centered search -->
        <div class="pin-search-wrap">
          <SearchBar v-model="searchQuery" @submit-first="openFirstSearchResult" />
        </div>

      <!-- Right actions -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <QTooltip content="导入/导出" position="bottom">
          <button @click="showImport = true"
            class="px-3 py-2.5 rounded-xl hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors flex items-center gap-1.5 text-sm">
            <Upload class="h-5 w-5" />
            <span>导入/导出</span>
          </button>
        </QTooltip>
        <QSwitch v-model="checked" theme="plastic" />
      </div>
    </header>

    <div class="flex flex-1 min-h-0">
      <aside
        class="min-h-0 flex-none overflow-hidden transition-[width] duration-200"
        :class="sidebarOpen ? 'w-[208px]' : 'w-0'"
      >
        <div class="h-full overflow-y-auto px-2 py-3 w-[208px]" style="background: var(--pin-sidebar)">
          <nav aria-label="分类导航">
            <ul class="space-y-0.5">
              <li v-for="node in sidebarNodes" :key="node.id">
                <button @click="scrollToCategory(node)" class="pin-tree-node">
                  <span style="font-size: 17px">{{ node.label }}</span>
                </button>
                <ul v-if="node.children.length > 0" class="ml-5 space-y-0.5">
                  <li v-for="child in node.children" :key="child.id">
                    <button @click="scrollToCategory(child)" class="pin-tree-node">
                      <span style="font-size: 17px">{{ child.label }}</span>
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
          <button @click="showCategoryManager = true"
            class="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--pin-surface-hover)]"
            style="color: var(--pin-ink-muted)">
            <FolderKanban class="h-4 w-4" /> 管理分类
          </button>
        </div>
      </aside>
      <div class="pin-splitter" @click="toggleSidebar">
        <button
          @click.stop="toggleSidebar"
          :aria-label="sidebarOpen ? '收起侧栏' : '展开侧栏'"
          :title="sidebarOpen ? '收起侧栏' : '展开侧栏'"
          class="pin-splitter-toggle"
        >
          <ChevronsLeft v-if="sidebarOpen" class="h-4 w-4" />
          <ChevronsRight v-else class="h-4 w-4" />
        </button>
      </div>
      <div class="flex-1 min-w-0 min-h-0">
          <div class="pin-content" data-pin-content>
        <div v-if="loadState.initialLoading" class="space-y-6 px-6 py-6">
          <div v-for="i in 3" :key="i" class="space-y-3">
            <div class="h-5 w-24 rounded animate-pulse" style="background: var(--pin-surface-hover)" />
            <div class="pin-link-grid">
              <div v-for="j in 6" :key="j" class="h-20 rounded-lg animate-pulse" style="background: var(--pin-surface-hover)" />
            </div>
          </div>
        </div>
        <div v-else-if="loadState.error" class="text-center py-20 text-[var(--pin-danger)]">{{ loadState.error }}</div>
        <div v-else-if="filteredCategories.length === 0" class="text-center py-20 text-[var(--pin-ink-muted)]">
          {{ searchQuery ? '无匹配结果' : '暂无链接，点击底部 + 按钮添加' }}
        </div>
        <LinkGrid
          v-else
          :categories="filteredCategories"
          :search-query="searchQuery"
          @edit="handleEditLink"
          @delete="handleDeleteLink"
          @refresh="refreshData"
          @add-link="handleAddLink"
        />
      </div>
      </div>
    </div>

    <footer class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-[var(--pin-surface)]/90 backdrop-blur border-t border-[var(--pin-border)] py-2">
      <Toolbar @add-link="handleAddLink()" @refresh="refreshData" />
    </footer>

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

    <CategoryManager
      :open="showCategoryManager"
      :categories="data.categories"
      @close="showCategoryManager = false"
      @saved="refreshData"
    />
  </div>
</template>
