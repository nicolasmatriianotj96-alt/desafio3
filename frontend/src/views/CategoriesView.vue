<script setup>
import { onMounted, ref } from 'vue';
import { useCategoriesStore } from '../stores/categories';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const categoriesStore = useCategoriesStore();

const name = ref('');
const color = ref('#f97316');
const editingId = ref(null);
const error = ref('');
const confirmingId = ref(null);

onMounted(() => categoriesStore.fetchAll());

function startEdit(category) {
  editingId.value = category.id;
  name.value = category.name;
  color.value = category.color;
}

function resetForm() {
  editingId.value = null;
  name.value = '';
  color.value = '#f97316';
  error.value = '';
}

async function handleSubmit() {
  error.value = '';
  try {
    if (editingId.value) {
      await categoriesStore.update(editingId.value, { name: name.value, color: color.value });
    } else {
      await categoriesStore.create({ name: name.value, color: color.value });
    }
    resetForm();
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível salvar a categoria.';
  }
}

async function handleDelete() {
  await categoriesStore.remove(confirmingId.value);
  confirmingId.value = null;
}
</script>

<template>
  <div class="grid gap-6 md:grid-cols-3">
    <div class="card p-6 md:col-span-1">
      <h2 class="mb-4 text-base font-semibold text-gray-900">
        {{ editingId ? 'Editar categoria' : 'Nova categoria' }}
      </h2>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Nome</label>
          <input v-model="name" type="text" required class="input" placeholder="Ex: Roteiro" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Cor</label>
          <input v-model="color" type="color" class="h-10 w-16 cursor-pointer rounded border border-gray-300" />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <div class="flex gap-3">
          <button type="submit" class="btn-primary">{{ editingId ? 'Salvar' : 'Criar' }}</button>
          <button v-if="editingId" type="button" class="btn-secondary" @click="resetForm">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="card p-6 md:col-span-2">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Suas categorias</h2>
      <p v-if="!categoriesStore.items.length" class="text-sm text-gray-500">Nenhuma categoria cadastrada ainda.</p>
      <ul class="divide-y divide-gray-100">
        <li v-for="category in categoriesStore.items" :key="category.id" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <span class="h-4 w-4 rounded-full" :style="{ backgroundColor: category.color }"></span>
            <span class="text-sm text-gray-800">{{ category.name }}</span>
          </div>
          <div class="flex gap-2 text-sm">
            <button class="text-brand-600 hover:underline" @click="startEdit(category)">Editar</button>
            <button class="text-red-600 hover:underline" @click="confirmingId = category.id">Excluir</button>
          </div>
        </li>
      </ul>
    </div>

    <ConfirmDialog
      :open="Boolean(confirmingId)"
      title="Excluir categoria"
      message="As tarefas associadas ficarão sem categoria. Deseja continuar?"
      @cancel="confirmingId = null"
      @confirm="handleDelete"
    />
  </div>
</template>
