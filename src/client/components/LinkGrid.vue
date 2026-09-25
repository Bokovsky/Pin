<script setup lang="ts">
import { ref } from "vue"
import { moveLink, reorderLinks } from "../api"
import type { Category, Link } from "../types"
import { buildContainerLinkOrder, canStartLinkDrag } from "../linkReorder"
import LinkCard from "./LinkCard.vue"

defineProps<{
  categories: Category[]
  searchQuery: string
}>()

const emit = defineEmits<{
  edit: [link: Link]
  delete: [link: Link]
  refresh: []
  "add-link": [categoryId?: string]
}>()

const dragFrom = ref<{ catId: string; index: number; linkId: string } | null>(null)
const dropError = ref("")

async function onDrop(target: Category, index: number) {
  const started = dragFrom.value
  dragFrom.value = null
  if (!started) {
    return
  }
  dropError.value = ""
  try {
    if (started.catId === target.id) {
      const orderedLinkIds = buildContainerLinkOrder(
        target.links.map(link => link.id),
        started.index,
        index
      )
      await reorderLinks(orderedLinkIds.map((id, sort_order) => ({ id, sort_order })))
    } else {
      await moveLink(started.linkId, { targetCategoryId: target.id, targetIndex: index })
    }
    emit("refresh")
  } catch (error: any) {
    dropError.value = error?.message || "排序失败"
  }
}
</script>

<template>
  <div class="space-y-8">
    <div v-if="dropError" role="alert" class="rounded-lg border border-[var(--pin-danger)] px-3 py-2 text-sm" style="color: var(--pin-danger)">
      {{ dropError }}
    </div>
    <section v-for="cat in categories" :key="cat.id" :id="'cat-' + cat.id" class="scroll-mt-16">
      <h2 style="color: var(--pin-ink); font-size: 18px; font-weight: 400; margin-bottom: 12px">{{ cat.name }}</h2>

      <!-- Main category links -->
      <div v-if="cat.links.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <div
          v-for="(link, idx) in cat.links"
          :key="link.id"
          :draggable="canStartLinkDrag(searchQuery)"
          @dragstart="dragFrom = { catId: cat.id, index: idx, linkId: link.id }"
          @dragover.prevent
          @dragend="dragFrom = null"
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
            :draggable="canStartLinkDrag(searchQuery)"
            @dragstart="dragFrom = { catId: child.id, index: idx, linkId: link.id }"
            @dragover.prevent
            @dragend="dragFrom = null"
            @drop.prevent="onDrop(child, idx)"
          >
            <LinkCard :link="link" @edit="emit('edit', $event)" @delete="emit('delete', $event)" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
