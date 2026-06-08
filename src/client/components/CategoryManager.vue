<script setup lang="ts">
import { ref } from "vue"
import { Plus, Pencil, Trash2, Check, X } from "lucide-vue-next"
import type { Category } from "../types"
import { createCategory, updateCategory, deleteCategory } from "../api"

defineProps<{ open: boolean; categories: Category[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const newName = ref("")
const newParentId = ref("")
const editingId = ref("")
const editName = ref("")
const submitting = ref(false)

function resetNew() {
  newName.value = ""
  newParentId.value = ""
}

function startAdd(parentId?: string) {
  newName.value = ""
  newParentId.value = parentId || ""
}

async function handleAdd() {
  if (!newName.value.trim()) return
  submitting.value = true
  try {
    const payload: any = { name: newName.value, description: "" }
    if (newParentId.value) {
      payload.parentId = newParentId.value
    }
    await createCategory(payload)
    emit("saved")
    resetNew()
  } finally {
    submitting.value = false
  }
}

function startEdit(id: string, name: string) {
  editingId.value = id
  editName.value = name
}

async function handleSave(id: string) {
  if (!editName.value.trim()) return
  submitting.value = true
  try {
    await updateCategory(id, { name: editName.value })
    editingId.value = ""
    emit("saved")
  } finally {
    submitting.value = false
  }
}

function cancelEdit() {
  editingId.value = ""
}

async function handleDelete(id: string, name: string) {
  if (!confirm(`确认删除分类「${name}」及其下所有链接？`)) return
  submitting.value = true
  try {
    await deleteCategory(id)
    emit("saved")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <d-modal :model-value="open" title="分类管理" @update:model-value="emit('close')" :close-on-click-overlay="true" class="w-[480px]">
    <div class="space-y-4">
      <!-- Add new (parent or child) -->
      <div v-if="newName !== null" class="flex items-center gap-2">
        <d-input v-model="newName" placeholder="分类名称" class="flex-1" @keydown.enter="handleAdd" />
        <select v-if="newParentId === '' && categories.length > 0" v-model="newParentId" class="px-2 py-1.5 rounded-lg border text-sm" style="background: var(--pin-surface); color: var(--pin-ink); border-color: var(--pin-border); max-width: 120px">
          <option value="">顶级分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">子分类 ({{ cat.name }})</option>
        </select>
        <button @click="handleAdd" :disabled="submitting || !newName.trim()" class="p-2 rounded-lg hover:bg-[var(--pin-surface-hover)] transition-colors" style="color: var(--pin-accent)">
          <Check class="h-4 w-4" />
        </button>
        <button @click="resetNew" class="p-2 rounded-lg hover:bg-[var(--pin-surface-hover)] transition-colors" style="color: var(--pin-ink-muted)">
          <X class="h-4 w-4" />
        </button>
      </div>
      <button v-else @click="startAdd()" class="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[var(--pin-surface-hover)] transition-colors text-sm" style="color: var(--pin-accent)">
        <Plus class="h-4 w-4" /> 添加分类
      </button>

      <!-- Category list -->
      <div class="space-y-1 max-h-80 overflow-y-auto">
        <template v-for="cat in categories" :key="cat.id">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--pin-surface-hover)] group" style="border-bottom: 1px solid var(--pin-border)">
            <div v-if="editingId === cat.id" class="flex-1 flex items-center gap-1">
              <d-input v-model="editName" class="flex-1" @keydown.enter="handleSave(cat.id)" />
              <button @click="handleSave(cat.id)" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" style="color: var(--pin-accent)"><Check class="h-3.5 w-3.5" /></button>
              <button @click="cancelEdit" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" style="color: var(--pin-ink-muted)"><X class="h-3.5 w-3.5" /></button>
            </div>
            <template v-else>
              <span class="flex-1 font-medium" style="color: var(--pin-ink); font-size: 16px">{{ cat.name }}</span>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="startAdd(cat.id)" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" title="添加子分类" style="color: var(--pin-ink-muted)"><Plus class="h-3.5 w-3.5" /></button>
                <button @click="startEdit(cat.id, cat.name)" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" title="编辑" style="color: var(--pin-ink-muted)"><Pencil class="h-3.5 w-3.5" /></button>
                <button @click="handleDelete(cat.id, cat.name)" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" title="删除" style="color: var(--pin-danger)"><Trash2 class="h-3.5 w-3.5" /></button>
              </div>
            </template>
          </div>

          <!-- Child categories -->
          <div v-for="child in cat.children" :key="child.id" class="ml-6 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--pin-surface-hover)] group">
            <div v-if="editingId === child.id" class="flex-1 flex items-center gap-1">
              <d-input v-model="editName" class="flex-1" @keydown.enter="handleSave(child.id)" />
              <button @click="handleSave(child.id)" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" style="color: var(--pin-accent)"><Check class="h-3.5 w-3.5" /></button>
              <button @click="cancelEdit" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" style="color: var(--pin-ink-muted)"><X class="h-3.5 w-3.5" /></button>
            </div>
            <template v-else>
              <span class="flex-1 text-sm" style="color: var(--pin-ink-secondary); font-size: 16px">{{ child.name }}</span>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="startEdit(child.id, child.name)" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" title="编辑" style="color: var(--pin-ink-muted)"><Pencil class="h-3.5 w-3.5" /></button>
                <button @click="handleDelete(child.id, child.name)" class="p-1 rounded hover:bg-[var(--pin-surface-hover)]" title="删除" style="color: var(--pin-danger)"><Trash2 class="h-3.5 w-3.5" /></button>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end pt-2">
        <d-button @click="emit('close')" variant="outline">关闭</d-button>
      </div>
    </template>
  </d-modal>
</template>
