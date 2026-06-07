<script setup lang="ts">
import { computed, ref } from "vue"
import { Globe } from "lucide-vue-next"
import type { Link } from "../types"
import ContextMenu from "./ContextMenu.vue"

const props = defineProps<{ link: Link }>()
const emit = defineEmits<{ edit: [link: Link]; delete: [link: Link] }>()

const showMenu = ref(false)
const menuPos = ref({ x: 0, y: 0 })

const statusStyle = computed(() => {
  switch (props.link.status) {
    case "ok": return { background: "var(--pin-success)" }
    case "fail": return { background: "var(--pin-danger)" }
    case "pending": return { background: "var(--pin-ink-muted)" }
    default: return { background: "transparent" }
  }
})

const hostname = computed(() => {
  try { return new URL(props.link.url).hostname } catch { return "" }
})

const faviconError = ref(false)
const imgSrc = computed(() => {
  if (!hostname.value || faviconError.value) return ""
  return `https://favicon.im/${hostname.value}`
})

function onImgError() {
  faviconError.value = true
}

function openLink() {
  window.open(props.link.url, "_blank")
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  menuPos.value = { x: e.clientX, y: e.clientY }
  showMenu.value = true
}
</script>

<template>
  <div
    @click="openLink"
    @contextmenu="onContextMenu"
    class="relative bg-[var(--pin-surface)] hover:bg-[var(--pin-surface-hover)] border border-[var(--pin-border)]
           hover:border-[var(--pin-border-hover)] rounded-lg p-3 cursor-pointer
           transition-all duration-150 hover:shadow-lg select-none"
  >
    <div v-if="link.status" :style="statusStyle"
         class="absolute top-2 right-2 w-2 h-2 rounded-full"
         :class="{ 'animate-pulse': link.status === 'pending' }"
         :title="link.status === 'ok' ? '正常' : link.status === 'fail' ? '失效' : '检测中'" />

    <div class="flex items-start gap-2">
      <div class="w-8 h-8 rounded-md bg-[var(--pin-surface-hover)] flex-shrink-0 flex items-center justify-center overflow-hidden">
        <img v-if="imgSrc" :src="imgSrc" :alt="link.title" class="w-5 h-5" @error="onImgError" />
        <Globe v-else class="h-4 w-4" style="color: var(--pin-ink-muted)" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate" style="color: var(--pin-ink); font-size: 16px">{{ link.title }}</p>
        <p class="truncate mt-0.5" :class="link.description ? '' : 'invisible'" style="color: var(--pin-ink-muted); font-size: 14px">{{ link.description || '描述' }}</p>
      </div>
    </div>

    <ContextMenu
      v-if="showMenu"
      :link="link"
      :position="menuPos"
      @close="showMenu = false"
      @edit="emit('edit', link)"
      @delete="emit('delete', link)"
    />
  </div>
</template>
