<script setup>
import { computed, onMounted, ref } from 'vue';
import { useTasksStore } from '../stores/tasks';
import { useCategoriesStore } from '../stores/categories';
import TaskCard from '../components/TaskCard.vue';
import TaskModal from '../components/TaskModal.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const tasksStore = useTasksStore();
const categoriesStore = useCategoriesStore();

const modalOpen = ref(false);
const editingTaskId = ref(null);
const confirmingId = ref(null);

// Computado a partir da store para refletir alterações (ex: colaboradores)
// feitas enquanto o modal de edição está aberto.
const editingTask = computed(
  () => tasksStore.items.find((t) => t.id === editingTaskId.value) || null,
);

onMounted(async () => {
  await Promise.all([tasksStore.fetchAll(), categoriesStore.fetchAll()]);
});

function openCreateModal() {
  editingTaskId.value = null;
  modalOpen.value = true;
}

function openEditModal(task) {
  editingTaskId.value = task.id;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingTaskId.value = null;
}

async function handleSaved() {
  closeModal();
  await tasksStore.fetchAll();
}

async function handleStatusChange(task, status) {
  await tasksStore.update(task.id, { status });
}

async function handleDelete() {
  await tasksStore.remove(confirmingId.value);
  confirmingId.value = null;
}

async function applyFilters() {
  await tasksStore.fetchAll();
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-gray-900">Minhas tarefas</h1>
      <button class="btn-primary" @click="openCreateModal">+ Nova tarefa</button>
    </div>

    <div class="card mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap">
      <select v-model="tasksStore.filters.status" class="input w-full sm:w-auto" @change="applyFilters">
        <option value="">Todos os status</option>
        <option value="pending">Pendente</option>
        <option value="in_progress">Em andamento</option>
        <option value="done">Concluída</option>
      </select>
      <select v-model="tasksStore.filters.categoryId" class="input w-full sm:w-auto" @change="applyFilters">
        <option value="">Todas as categorias</option>
        <option v-for="category in categoriesStore.items" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
      <input
        v-model="tasksStore.filters.search"
        type="search"
        placeholder="Buscar por título..."
        class="input w-full sm:w-auto sm:min-w-[200px] sm:flex-1"
        @keyup.enter="applyFilters"
      />
      <button class="btn-secondary w-full sm:w-auto" @click="applyFilters">Filtrar</button>
    </div>

    <p v-if="tasksStore.loading" class="text-sm text-gray-500">Carregando tarefas...</p>
    <p v-else-if="!tasksStore.items.length" class="text-sm text-gray-500">Nenhuma tarefa encontrada.</p>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TaskCard
        v-for="task in tasksStore.items"
        :key="task.id"
        :task="task"
        @edit="openEditModal(task)"
        @delete="confirmingId = task.id"
        @status-change="(status) => handleStatusChange(task, status)"
      />
    </div>

    <TaskModal
      :open="modalOpen"
      :task="editingTask"
      :categories="categoriesStore.items"
      @close="closeModal"
      @saved="handleSaved"
    />

    <ConfirmDialog
      :open="Boolean(confirmingId)"
      title="Excluir tarefa"
      message="Esta ação não pode ser desfeita. Deseja continuar?"
      @cancel="confirmingId = null"
      @confirm="handleDelete"
    />
  </div>
</template>
