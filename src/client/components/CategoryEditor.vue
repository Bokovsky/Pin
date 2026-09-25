<script setup lang="ts">
import { ref, watch } from "vue"
import type { Category } from "../types"
import { createCategory, updateCategory } from "../api"
import { createEnterSubmitHandler } from "../utils/formSubmit"

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

const handleInputKeyup = createEnterSubmitHandler(handleSubmit)
</script>

<template>
  <QDialog :model-value="open" :title="category ? '编辑分类' : '新建分类'" @update:model-value="emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <QInput v-model="name" placeholder="分类名称 *" @keyup="handleInputKeyup" />
      <QInput v-model="description" placeholder="描述（可选）" @keyup="handleInputKeyup" />
      <QFence v-if="errorMsg" type="error" :text="errorMsg" role="alert" />
      <div class="flex justify-end gap-2 pt-2">
        <QButton class="outlined" type="button" @click="emit('close')" :disabled="submitting">取消</QButton>
        <QButton class="primary" type="submit" :disabled="submitting">
          {{ submitting ? '保存中...' : (category ? '保存' : '添加') }}
        </QButton>
      </div>
    </form>
  </QDialog>
</template>
