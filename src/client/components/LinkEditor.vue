<script setup lang="ts">
import { ref, computed, watch } from "vue"
import type { Link, Category } from "../types"
import { createLink, updateLink } from "../api"
import { resolveLinkEditorMode } from "../linkEditorState"
import { toOperationErrorMessage } from "../operationError"

const props = defineProps<{
  open: boolean
  link?: Link | null
  categories: Category[]
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const title = ref("")
const url = ref("")
const description = ref("")
const backupUrl = ref("")
const categoryId = ref("")
const sortOrder = ref(0)
const submitting = ref(false)
const errorMsg = ref("")

const allCategories = computed(() => {
  const result: { id: string; label: string }[] = []
  for (const cat of props.categories) {
    result.push({ id: cat.id, label: cat.name })
    for (const child of cat.children) {
      result.push({ id: child.id, label: `${cat.name} / ${child.name}` })
    }
  }
  return result
})

const editorMode = computed(() => resolveLinkEditorMode(props.link, allCategories.value.map(category => category.id)))

watch(() => props.open, (val) => {
  if (val) {
    errorMsg.value = ""
    if (editorMode.value.mode === "edit" && props.link && "id" in props.link) {
      title.value = props.link.title
      url.value = props.link.url
      description.value = props.link.description
      backupUrl.value = props.link.backup_url
      sortOrder.value = props.link.sort_order
    } else {
      title.value = ""
      url.value = ""
      description.value = ""
      backupUrl.value = ""
      sortOrder.value = 0
      if (editorMode.value.initialCategoryId) {
        categoryId.value = editorMode.value.initialCategoryId
      }
    }
  }
})

async function handleSubmit() {
  if (!title.value.trim() || !url.value.trim()) return
  submitting.value = true
  errorMsg.value = ""
  try {
    if (editorMode.value.mode === "edit" && editorMode.value.linkId) {
      await updateLink(editorMode.value.linkId, {
        title: title.value,
        url: url.value,
        description: description.value,
        backup_url: backupUrl.value,
        sort_order: sortOrder.value,
      })
    } else {
      if (!categoryId.value) {
        errorMsg.value = "请选择分类"
        submitting.value = false
        return
      }
      await createLink(categoryId.value, {
        title: title.value,
        url: url.value,
        description: description.value,
        backup_url: backupUrl.value,
        sort_order: sortOrder.value,
      })
    }
    emit("saved")
    emit("close")
  } catch (e: unknown) {
    errorMsg.value = toOperationErrorMessage(e, "保存失败")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <d-modal :model-value="open" :title="editorMode.mode === 'edit' ? '编辑链接' : '添加链接'" @update:model-value="emit('close')" :close-on-click-overlay="true">
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <d-input v-model="title" placeholder="标题 *" />
      <d-input v-model="url" placeholder="URL *" type="url" />
      <d-input v-model="description" placeholder="描述（可选）" />
      <d-input v-model="backupUrl" placeholder="备用链接（可选）" type="url" />
      <d-select
        v-if="editorMode.mode === 'create'"
        v-model="categoryId"
        placeholder="选择分类 *"
        :options="allCategories.map(c => ({ value: c.id, name: c.label }))"
      />

      <p v-if="errorMsg" class="text-sm" style="color: var(--pin-danger)">{{ errorMsg }}</p>

      <div class="flex justify-end gap-2 pt-2">
        <d-button @click="emit('close')" variant="outline" :disabled="submitting">取消</d-button>
        <d-button type="submit" variant="primary" :disabled="submitting">
          {{ submitting ? '保存中...' : (editorMode.mode === 'edit' ? '保存' : '添加') }}
        </d-button>
      </div>
    </form>
  </d-modal>
</template>
