<script setup lang="ts">
import { ref } from "vue"
import type { Category } from "../types"

defineProps<{ categories: Category[] }>()
const emit = defineEmits<{ select: [id: string] }>()

const expanded = ref<Set<string>>(new Set())
const justExpanded = ref<Set<string>>(new Set())

function handleClick(catId: string, children: Category[]) {
  if (children.length === 0) {
    emit("select", catId)
    return
  }

  // Has children: first click only expands, second click scrolls
  if (expanded.value.has(catId)) {
    // Already expanded: scroll on second click
    if (justExpanded.value.has(catId)) {
      justExpanded.value.delete(catId)
    }
    emit("select", catId)
  } else {
    // First click: expand only
    const next = new Set(expanded.value)
    next.add(catId)
    expanded.value = next
    const j = new Set(justExpanded.value)
    j.add(catId)
    justExpanded.value = j
  }
}
</script>

<template>
  <nav class="space-y-0.5">
    <template v-for="cat in categories" :key="cat.id">
      <button
        @click="handleClick(cat.id, cat.children)"
        class="w-full flex items-center gap-2 px-3 py-2 text-xl rounded-lg
               text-[var(--pin-ink)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left"
        style="font-size: 20px; font-weight: 400"
      >
        <span v-if="cat.children.length > 0" class="text-xs text-[var(--pin-ink-muted)] w-3 flex-shrink-0">
          {{ expanded.has(cat.id) ? '▾' : '▸' }}
        </span>
        <span v-else class="w-3 flex-shrink-0" />
        <span>{{ cat.name }}</span>
      </button>

      <div v-if="expanded.has(cat.id)" class="ml-4 space-y-0.5 border-l border-[var(--pin-border)] pl-2">
        <button
          v-for="child in cat.children"
          :key="child.id"
          @click="emit('select', child.id)"
          class="w-full text-left px-3 py-2 rounded-lg
                 text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] hover:bg-[var(--pin-surface-hover)] transition-colors"
          style="font-size: 18px; font-weight: 400"
        >{{ child.name }}</button>
      </div>
    </template>
  </nav>
</template>
