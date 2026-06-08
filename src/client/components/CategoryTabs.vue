<script setup lang="ts">
import { ref } from "vue"
import { ChevronRight } from "lucide-vue-next"
import type { Category } from "../types"

defineProps<{ categories: Category[] }>()
const emit = defineEmits<{ select: [id: string] }>()

const expanded = ref<Set<string>>(new Set())

function toggleExpand(catId: string, e: MouseEvent) {
  e.stopPropagation()
  const next = new Set(expanded.value)
  if (next.has(catId)) {
    next.delete(catId)
  } else {
    next.add(catId)
  }
  expanded.value = next
}
</script>

<template>
  <nav class="space-y-0.5">
    <template v-for="cat in categories" :key="cat.id">
      <div>
        <button
          @click="emit('select', cat.id)"
          class="w-full flex items-center gap-1 px-3 py-2 rounded-lg
                 text-[var(--pin-ink)] hover:bg-[var(--pin-surface-hover)] transition-colors text-left"
          style="font-size: 20px; font-weight: 400"
        >
          <span v-if="cat.children.length > 0"
            @click="toggleExpand(cat.id, $event)"
            class="flex items-center justify-center w-5 h-5 -ml-0.5 rounded hover:bg-[var(--pin-surface-hover)] transition-colors"
            :class="{ 'rotate-90': expanded.has(cat.id) }"
            style="color: var(--pin-ink-muted)"
          >
            <ChevronRight class="h-3.5 w-3.5" />
          </span>
          <span v-else class="w-5 flex-shrink-0" />
          <span>{{ cat.name }}</span>
        </button>

        <div v-if="expanded.has(cat.id)" class="ml-3 space-y-0.5 border-l border-[var(--pin-border)] pl-2">
          <button
            v-for="child in cat.children"
            :key="child.id"
            @click="emit('select', child.id)"
            class="w-full text-left px-3 py-1.5 rounded-lg
                   text-[var(--pin-ink-muted)] hover:text-[var(--pin-ink)] hover:bg-[var(--pin-surface-hover)] transition-colors"
            style="font-size: 18px; font-weight: 400"
          >{{ child.name }}</button>
        </div>
      </div>
    </template>
  </nav>
</template>
