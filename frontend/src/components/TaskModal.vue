<script setup>
import { reactive, ref, watch } from 'vue';
import { useTasksStore } from '../stores/tasks';

const props = defineProps({
  open: { type: Boolean, default: false },
  task: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'saved']);

const tasksStore = useTasksStore();

const form = reactive({
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
  categoryId: '',
});

const error = ref('');
const saving = ref(false);
const collaboratorEmail = ref('');
const collaboratorError = ref('');

watch(
  () => [props.open, props.task],
  () => {
    error.value = '';
    collaboratorEmail.value = '';
    collaboratorError.value = '';
    if (props.task) {
      form.title = props.task.title;
      form.description = props.task.description || '';
      form.status = props.task.status;
      form.priority = props.task.priority;
      form.dueDate = props.task.due_date ? props.task.due_date.substring(0, 10) : '';
      form.categoryId = props.task.category_id || '';
    } else {
      form.title = '';
      form.description = '';
      form.status = 'pending';
      form.priority = 'medium';
      form.dueDate = '';
      form.categoryId = '';
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  error.value = '';
  saving.value = true;
  try {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      categoryId: form.categoryId || undefined,
    };

    if (props.task) {
      await tasksStore.update(props.task.id, payload);
    } else {
      await tasksStore.create(payload);
    }
    emit('saved');
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível salvar a tarefa.';
  } finally {
    saving.value = false;
  }
}

async function handleAddCollaborator() {
  collaboratorError.value = '';
  try {
    await tasksStore.addCollaborator(props.task.id, collaboratorEmail.value);
    collaboratorEmail.value = '';
  } catch (err) {
    collaboratorError.value = err.response?.data?.message || 'Não foi possível adicionar o colaborador.';
  }
}

async function handleRemoveCollaborator(userId) {
  await tasksStore.removeCollaborator(props.task.id, userId);
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
    <div class="card w-full max-w-lg p-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">
        {{ task ? 'Editar tarefa' : 'Nova tarefa' }}
      </h2>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Título</label>
          <input
            v-model="form.title"
            type="text"
            required
            maxlength="160"
            class="input"
            placeholder="Ex: Editar episódio 3 - temporada 2"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
          <textarea v-model="form.description" rows="3" maxlength="4000" class="input"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select v-model="form.status" class="input">
              <option value="pending">Pendente</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluída</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Prioridade</label>
            <select v-model="form.priority" class="input">
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Prazo</label>
            <input v-model="form.dueDate" type="date" class="input" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
            <select v-model="form.categoryId" class="input">
              <option value="">Sem categoria</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>

      <div v-if="task && task.is_owner" class="mt-6 border-t border-gray-100 pt-4">
        <h3 class="mb-2 text-sm font-semibold text-gray-900">Colaboradores</h3>
        <ul class="mb-3 space-y-1">
          <li v-for="collaborator in task.collaborators" :key="collaborator.id" class="flex items-center justify-between text-sm">
            <span class="text-gray-700">{{ collaborator.name }} ({{ collaborator.email }})</span>
            <button class="text-red-600 hover:underline" @click="handleRemoveCollaborator(collaborator.id)">Remover</button>
          </li>
          <li v-if="!task.collaborators?.length" class="text-sm text-gray-500">Nenhum colaborador ainda.</li>
        </ul>
        <form class="flex gap-2" @submit.prevent="handleAddCollaborator">
          <input v-model="collaboratorEmail" type="email" required placeholder="email@exemplo.com" class="input" />
          <button type="submit" class="btn-secondary shrink-0">Adicionar</button>
        </form>
        <p v-if="collaboratorError" class="mt-1 text-sm text-red-600">{{ collaboratorError }}</p>
      </div>
    </div>
  </div>
</template>
