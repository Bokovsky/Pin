<script setup lang="ts">
import { ref } from "vue"
import { Plus, ArrowUp, Activity } from "lucide-vue-next"
import { checkLinks } from "../api"

const emit = defineEmits<{ "add-link": []; refresh: [] }>()
const checking = ref(false)
const checkSummary = ref<{ ok: number; fail: number } | null>(null)

async function handleCheck() {
  checking.value = true
  checkSummary.value = null
  try {
    const results = await checkLinks()
    const ok = results.filter(r => r.status === "ok").length
    const fail = results.filter(r => r.status === "fail").length
    checkSummary.value = { ok, fail }
    setTimeout(() => { checkSummary.value = null }, 5000)
  } finally {
    checking.value = false
    emit("refresh")
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" })
}
</script>

<template>
  <div
    v-if="checkSummary"
    class="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--pin-surface)] border border-[var(--pin-border)] rounded-lg px-4 py-2 shadow-lg text-sm flex items-center gap-3"
  >
    <span style="color: var(--pin-success)">{{ checkSummary.ok }} 个正常</span>
    <span v-if="checkSummary.fail > 0" style="color: var(--pin-danger)">{{ checkSummary.fail }} 个失效</span>
  </div>

  <div class="flex items-center gap-1">
    <button @click="emit('add-link')" class="p-2 rounded-full hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors" title="添加链接">
      <Plus class="h-5 w-5" />
    </button>
    <button @click="scrollToTop" class="p-2 rounded-full hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors" title="返回顶部">
      <ArrowUp class="h-5 w-5" />
    </button>
    <button
      @click="handleCheck"
      :disabled="checking"
      class="p-2 rounded-full hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors disabled:opacity-50"
      :title="checking ? '检测中...' : '检测所有链接是否可访问'"
    >
      <Activity v-if="checking" class="h-5 w-5 animate-spin" />
      <Activity v-else class="h-5 w-5" />
    </button>
  </div>
</template>
