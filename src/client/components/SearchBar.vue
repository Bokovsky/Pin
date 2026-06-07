<script setup lang="ts">
import { ref, computed } from "vue"
import { Search, Globe, Settings } from "lucide-vue-next"

const model = defineModel<string>({ default: "" })

type SearchMode = "local" | "web"
const mode = ref<SearchMode>("local")

const DEFAULT_ENGINE = "https://www.bing.com/search?q="
const showEnginePopover = ref(false)
const editUrl = ref("")

function getSearchEngine(): string {
  return localStorage.getItem("pin-search-engine") || DEFAULT_ENGINE
}

const engineName = computed(() => {
  try {
    const url = new URL(getSearchEngine())
    const host = url.hostname.replace("www.", "")
    return host.charAt(0).toUpperCase() + host.slice(1).split(".")[0]
  } catch {
    return "搜索引擎"
  }
})

const engineUrl = computed(() => {
  return getSearchEngine()
})

function onKeydown(e: KeyboardEvent) {
  if (e.key !== "Enter" || !model.value.trim()) return
  if (mode.value === "web") {
    window.open(engineUrl.value + encodeURIComponent(model.value.trim()), "_blank")
  }
}

function cycleMode() {
  mode.value = mode.value === "local" ? "web" : "local"
  showEnginePopover.value = false
}

function openEngineSettings() {
  editUrl.value = getSearchEngine()
  showEnginePopover.value = !showEnginePopover.value
}

function saveEngine() {
  if (editUrl.value.trim()) {
    localStorage.setItem("pin-search-engine", editUrl.value.trim())
  }
  showEnginePopover.value = false
}

function resetEngine() {
  localStorage.removeItem("pin-search-engine")
  editUrl.value = DEFAULT_ENGINE
}
</script>

<template>
  <div class="relative w-full max-w-lg flex items-center gap-2">
    <!-- Mode toggle -->
    <button
      @click="cycleMode"
      class="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0"
      :style="{
        color: mode === 'web' ? 'var(--pin-accent)' : 'var(--pin-ink-muted)',
        background: mode === 'web' ? 'color-mix(in srgb, var(--pin-accent) 10%, transparent)' : 'transparent',
      }"
      :title="mode === 'local' ? '本地搜索' : '网络搜索'"
    >
      <Search v-if="mode === 'local'" class="h-3.5 w-3.5" />
      <Globe v-else class="h-3.5 w-3.5" />
      {{ mode === 'local' ? '本地' : '网络' }}
    </button>

    <!-- Search input -->
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--pin-ink-muted)]" />
      <input
        v-model="model"
        type="text"
        :placeholder="mode === 'local' ? '搜索链接...' : '搜索网络...'"
        @keydown="onKeydown"
        class="w-full pl-10 pr-10 py-2.5 bg-[var(--pin-surface)] border border-[var(--pin-border)] rounded-xl
               text-base text-[var(--pin-ink)] placeholder:text-[var(--pin-ink-muted)] focus:outline-none focus:border-[var(--pin-accent)] transition-colors"
      />
      <!-- Engine button (web mode only) -->
      <button
        v-if="mode === 'web'"
        @click="openEngineSettings"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--pin-surface-hover)] transition-colors"
        :title="'当前: ' + engineName"
        style="color: var(--pin-ink-muted)"
      >
        <Settings class="h-4 w-4" />
      </button>
    </div>

    <!-- Engine settings popover -->
    <div
      v-if="showEnginePopover && mode === 'web'"
      class="absolute top-full right-0 mt-2 z-[var(--pin-z-dropdown)] bg-[var(--pin-surface)] border border-[var(--pin-border)] rounded-xl shadow-xl p-4 min-w-[320px]"
      @click.stop
    >
      <p class="text-sm font-medium mb-2" style="color: var(--pin-ink)">搜索引擎</p>
      <p class="mb-3" style="color: var(--pin-ink-muted); font-size: 16px">当前：</p>
      <input
        v-model="editUrl"
        type="url"
        placeholder="https://www.bing.com/search?q="
        class="w-full px-3 py-2 rounded-lg border mb-3"
        style="font-size: 16px; background: var(--pin-surface); color: var(--pin-ink); border-color: var(--pin-border);"
      />
      <div class="flex items-center justify-between mb-3">
        <button @click="resetEngine" class="underline" style="color: var(--pin-ink-muted); font-size: 16px">恢复默认 (Bing)</button>
      </div>
      <div class="flex justify-end gap-4">
        <button @click="showEnginePopover = false" class="px-4 py-2 rounded-lg transition-colors hover:bg-[var(--pin-surface-hover)]" style="color: var(--pin-ink-muted); font-size: 16px">取消</button>
        <button @click="saveEngine" class="px-4 py-2 rounded-lg transition-colors" style="font-size: 16px; background: var(--pin-accent); color: var(--pin-accent-text)">保存</button>
      </div>
    </div>
  </div>
</template>
