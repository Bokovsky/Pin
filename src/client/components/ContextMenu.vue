<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue"
import { clampContextMenuPosition } from "../contextMenuPosition"
import { buildContextMenuItems } from "../contextMenuItems"
import { ExternalLink, Link2, Copy, QrCode, Pencil, Trash2 } from "lucide-vue-next"
import type { Link } from "../types"

const props = defineProps<{ link: Link; position: { x: number; y: number } }>()
const emit = defineEmits<{ close: []; edit: [link: Link]; delete: [link: Link]; "copy-failed": [message: string] }>()
const menuRef = ref<HTMLElement | null>(null)
const menuPosition = ref(props.position)

function openUrl(url: string) { window.open(url, "_blank"); emit("close") }
async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    emit("close")
  } catch {
    emit("copy-failed", "复制失败，请手动复制链接")
  }
}
function showQr(url: string) {
  window.open(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`, "_blank")
  emit("close")
}
function handleClick() { emit("close") }

const menuIcons = {
  open: ExternalLink,
  "open-backup": Link2,
  copy: Copy,
  qr: QrCode,
  edit: Pencil,
  delete: Trash2,
} as const

const menuItems = computed(() =>
  buildContextMenuItems(props.link).map((item) => ({
    ...item,
    icon: item.divider ? undefined : menuIcons[item.id as keyof typeof menuIcons],
  }))
)

function handleMenuAction(item: { id: string }) {
  switch (item.id) {
    case "open":
      openUrl(props.link.url)
      break
    case "open-backup":
      if (props.link.backup_url) openUrl(props.link.backup_url)
      break
    case "copy":
      copyUrl(props.link.url)
      break
    case "qr":
      showQr(props.link.url)
      break
    case "edit":
      emit("edit", props.link)
      emit("close")
      break
    case "delete":
      emit("delete", props.link)
      emit("close")
      break
  }
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close")
  }
}

onMounted(async () => {
  document.addEventListener("click", handleClick)
  document.addEventListener("keydown", handleKeydown)
  window.addEventListener("scroll", handleClick, true)
  await nextTick()
  const rect = menuRef.value?.getBoundingClientRect()
  if (rect) {
    menuPosition.value = clampContextMenuPosition({
      position: props.position,
      menuSize: { width: rect.width, height: rect.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    })
  }
})
onUnmounted(() => {
  document.removeEventListener("click", handleClick)
  document.removeEventListener("keydown", handleKeydown)
  window.removeEventListener("scroll", handleClick, true)
})
</script>

<template>
  <div
    ref="menuRef"
    class="fixed z-[100] min-w-[220px]"
    :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
    @click.stop
  >
    <QMenu :items="menuItems" @action="handleMenuAction" />
  </div>
</template>
