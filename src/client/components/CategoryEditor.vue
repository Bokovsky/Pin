<script setup lang="ts">
import { ref, watch } from "vue"
import type { Category } from "../types"
import { createCategory, updateCategory } from "../api"

const props = defineProps<{
  open: boolean
  category?: Category | null
  categories: Category[]
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const name = ref("")
const description = ref("")
const submitting = ref(false)
const errorMsg = ref("")

watch(() => props.open, (val) => {
  if (val) {
    errorMsg.value = ""
    if (props.category) {
      name.value = props.category.name
      description.value = props.category.description
    } else {
      name.value = ""
      description.value = ""
    }
  }
})

async function handleSubmit() {
  if (!name.value.trim()) return
  submitting.value = true
  errorMsg.value = ""
  try {
    if (props.category) {
      await updateCategory(props.category.id, { name: name.value, description: description.value })
    } else {
      await createCategory({ name: name.value, description: description.value, sort_order: 0 })
    }
    emit("saved")
    emit("close")
  } catch (e: any) {
    errorMsg.value = e.message || "保存失败"
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <d-modal :model-value="open" :title="category ? '编辑分类' : '新建分类'" @update:model-value="emit('close')" :close-on-click-overlay="true">
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <d-input v-model="name" placeholder="分类名称 *" />
      <d-input v-model="description" placeholder="描述（可选）" />
      <p v-if="errorMsg" class="text-sm" style="color: var(--pin-danger)">{{ errorMsg }}</p>
      <div class="flex justify-end gap-2 pt-2">
        <d-button @click="emit('close')" variant="outline" :disabled="submitting">取消</d-button>
        <d-button type="submit" variant="primary" :disabled="submitting">
          {{ submitting ? '保存中...' : (category ? '保存' : '添加') }}
        </d-button>
      </div>
    </form>
  </d-modal>
</template>
