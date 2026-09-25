<script setup lang="ts">
import { onUnmounted, ref } from "vue"
import { Plus, ArrowUp, Activity } from "lucide-vue-next"
import { checkLinks } from "../api"
import { scrollContentToTop } from "../scrollTarget"

const emit = defineEmits<{ "add-link": []; refresh: [] }>()
const checking = ref(false)
const checkSummary = ref<{ ok: number; fail: number } | null>(null)
const checkError = ref("")
let summaryTimer: number | undefined

function clearSummaryTimer() {
  if (summaryTimer !== undefined) {
    clearTimeout(summaryTimer)
    summaryTimer = undefined
  }
}

async function handleCheck() {
  checking.value = true
  checkSummary.value = null
  checkError.value = ""
  clearSummaryTimer()
  try {
    const results = await checkLinks()
    const ok = results.filter(r => r.status === "ok").length
    const fail = results.filter(r => r.status === "fail").length
    checkSummary.value = { ok, fail }
    summaryTimer = window.setTimeout(() => { checkSummary.value = null }, 5000)
    emit("refresh")
  } catch (error: unknown) {
    checkError.value = error instanceof Error ? error.message : "检测失败"
  } finally {
    checking.value = false
  }
}

onUnmounted(clearSummaryTimer)

function scrollToTop() {
  scrollContentToTop(document, () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  })
}
</script>

<template>
  <div
    v-if="checkSummary || checkError"
    class="fixed bottom-16 left-1/2 -translate-x-1/2 z-50"
  >
    <QToast
      v-if="checkSummary"
      :model-value="true"
      :type="checkSummary.fail > 0 ? 'warning' : 'success'"
      :duration="0"
      @update:model-value="(visible: boolean) => { if (!visible) checkSummary = null }"
    >
      <span style="color: var(--pin-success)">{{ checkSummary.ok }} 个正常</span>
      <span v-if="checkSummary.fail > 0" style="color: var(--pin-danger)">，{{ checkSummary.fail }} 个失效</span>
    </QToast>
    <QToast
      v-else-if="checkError"
      :model-value="true"
      type="error"
      :duration="0"
      :message="checkError"
      @update:model-value="(visible: boolean) => { if (!visible) checkError = '' }"
    />
  </div>

  <div class="flex items-center gap-1">
    <QTooltip content="添加链接">
      <button @click="emit('add-link')" aria-label="添加链接" class="p-2 rounded-full hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors">
        <Plus class="h-5 w-5" />
      </button>
    </QTooltip>
    <QTooltip content="返回顶部">
      <button @click="scrollToTop" aria-label="返回顶部" class="p-2 rounded-full hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors">
        <ArrowUp class="h-5 w-5" />
      </button>
    </QTooltip>
    <QTooltip :content="checking ? '检测中...' : '检测所有链接是否可访问'">
      <button
        @click="handleCheck"
        :disabled="checking"
        :aria-label="checking ? '检测中...' : '检测所有链接是否可访问'"
        class="p-2 rounded-full hover:bg-[var(--pin-surface-hover)] text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] transition-colors disabled:opacity-50"
      >
        <Activity v-if="checking" class="h-5 w-5 animate-spin" />
        <Activity v-else class="h-5 w-5" />
      </button>
    </QTooltip>
  </div>
</template>
