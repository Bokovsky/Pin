<script setup lang="ts">
import { onMounted, onUnmounted } from "vue"
import { ExternalLink, Link2, Copy, QrCode, Pencil, Trash2 } from "lucide-vue-next"
import type { Link } from "../types"

defineProps<{ link: Link; position: { x: number; y: number } }>()
const emit = defineEmits<{ close: []; edit: [link: Link]; delete: [link: Link] }>()

function openUrl(url: string) { window.open(url, "_blank"); emit("close") }
async function copyUrl(url: string) { await navigator.clipboard.writeText(url); emit("close") }
function showQr(url: string) {
  window.open(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`, "_blank")
  emit("close")
}
function handleClick() { emit("close") }

onMounted(() => document.addEventListener("click", handleClick))
onUnmounted(() => document.removeEventListener("click", handleClick))
</script>

<template>
  <div
    class="fixed z-[100] bg-[var(--pin-surface)] border border-[var(--pin-border)] rounded-lg shadow-xl py-1 min-w-[160px]"
    :style="{ left: position.x + 'px', top: position.y + 'px', fontFamily: 'system-ui, sans-serif' }"
    @click.stop
  >
    <button @click="openUrl(link.url)"
      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--pin-ink-secondary)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left">
      <ExternalLink class="h-4 w-4" /> 打开链接
    </button>
    <button v-if="link.backup_url" @click="openUrl(link.backup_url)"
      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--pin-ink-secondary)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left">
      <Link2 class="h-4 w-4" /> 打开备用链接
    </button>
    <div class="border-t border-[var(--pin-border)] my-1" />
    <button @click="copyUrl(link.url)"
      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--pin-ink-secondary)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left">
      <Copy class="h-4 w-4" /> 复制链接
    </button>
    <button @click="showQr(link.url)"
      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--pin-ink-secondary)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left">
      <QrCode class="h-4 w-4" /> 二维码
    </button>
    <div class="border-t border-[var(--pin-border)] my-1" />
    <button @click="emit('edit', link); emit('close')"
      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--pin-ink-secondary)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left">
      <Pencil class="h-4 w-4" /> 编辑
    </button>
    <button @click="emit('delete', link); emit('close')"
      class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--pin-danger)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left">
      <Trash2 class="h-4 w-4" /> 删除
    </button>
  </div>
</template>
