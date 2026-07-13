<script setup>
defineProps({
  task: { type: Object, required: true },
});

defineEmits(['edit', 'delete', 'status-change']);

const statusLabels = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
};

const priorityStyles = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-700',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}
</script>

<template>
  <div class="card flex flex-col gap-3 p-4">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
        <p v-if="task.description" class="mt-1 line-clamp-2 text-sm text-gray-500">{{ task.description }}</p>
      </div>
      <span
        v-if="task.category_name"
        class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
        :style="{ backgroundColor: task.category_color }"
      >
        {{ task.category_name }}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span class="rounded-full px-2 py-0.5 font-medium" :class="priorityStyles[task.priority]">
        Prioridade {{ priorityLabels[task.priority] }}
      </span>
      <span v-if="task.due_date" class="rounded-full px-2 py-0.5" :class="isOverdue(task) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'">
        {{ isOverdue(task) ? 'Atrasada' : 'Prazo' }}: {{ new Date(task.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }}
      </span>
      <span v-if="!task.is_owner" class="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">Colaborador</span>
      <span v-if="task.collaborators?.length" class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
        {{ task.collaborators.length }} colaborador(es)
      </span>
    </div>

    <div class="mt-1 flex items-center justify-between">
      <select
        class="rounded-md border border-gray-300 px-2 py-1 text-xs"
        :value="task.status"
        @change="$emit('status-change', $event.target.value)"
      >
        <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
      </select>

      <div class="flex gap-3 text-xs">
        <button class="text-brand-600 hover:underline" @click="$emit('edit')">Editar</button>
        <button v-if="task.is_owner" class="text-red-600 hover:underline" @click="$emit('delete')">Excluir</button>
      </div>
    </div>
  </div>
</template>
