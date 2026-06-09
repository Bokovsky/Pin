<script setup lang="ts">
import { ref } from "vue"
import { reorderLinks } from "../api"
import type { Category, Link } from "../types"
import LinkCard from "./LinkCard.vue"

defineProps<{
  categories: Category[]
}>()

const emit = defineEmits<{
  edit: [link: Link]
  delete: [link: Link]
  refresh: []
  "add-link": [categoryId?: string]
}>()

const dragFrom = ref<{ catId: string; index: number } | null>(null)

function collectLinks(cat: Category): Link[] {
  return [...cat.links, ...cat.children.flatMap(c => c.links)]
}

async function onDrop(cat: Category, index: number) {
  if (!dragFrom.value) return
  const allLinks = collectLinks(cat)
  if (index < 0 || index >= allLinks.length) { dragFrom.value = null; return }
  const items = [...allLinks]
  const [moved] = items.splice(dragFrom.value.index, 1)
  items.splice(index, 0, moved)
  await reorderLinks(items.map((link, i) => ({ id: link.id, sort_order: i })))
  emit("refresh")
  dragFrom.value = null
}
</script>

<template>
  <div class="space-y-8">
    <section v-for="cat in categories" :key="cat.id" :id="'cat-' + cat.id" class="scroll-mt-16">
      <h2 style="color: var(--pin-ink); font-size: 18px; font-weight: 400; margin-bottom: 12px">{{ cat.name }}</h2>

      <!-- Main category links -->
      <div v-if="cat.links.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <div
          v-for="(link, idx) in cat.links"
          :key="link.id"
          draggable="true"
          @dragstart="dragFrom = { catId: cat.id, index: idx }"
          @dragover.prevent
          @drop.prevent="onDrop(cat, idx)"
        >
          <LinkCard :link="link" @edit="emit('edit', $event)" @delete="emit('delete', $event)" />
        </div>
      </div>

      <!-- Sub-categories -->
      <div v-for="child in cat.children" :key="child.id" :id="'cat-' + child.id" class="mt-6 ml-4 scroll-mt-14">
        <div class="flex items-center justify-between mb-2">
          <h3 style="color: var(--pin-ink-secondary); font-size: 16px; font-weight: 400">{{ child.name }}</h3>
        </div>
        <div v-if="child.links.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <div
            v-for="(link, idx) in child.links"
            :key="link.id"
            draggable="true"
            @dragstart="dragFrom = { catId: child.id, index: idx }"
            @dragover.prevent
            @drop.prevent="onDrop(child, idx)"
          >
            <LinkCard :link="link" @edit="emit('edit', $event)" @delete="emit('delete', $event)" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
