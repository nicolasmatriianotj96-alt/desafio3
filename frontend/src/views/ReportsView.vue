<script setup>
import { computed, onMounted } from 'vue';
import { useReportsStore } from '../stores/reports';
import ReportBarChart from '../components/ReportBarChart.vue';

const reportsStore = useReportsStore();

onMounted(() => reportsStore.fetchAll());

const statusItems = computed(() => {
  const s = reportsStore.summary?.byStatus;
  if (!s) return [];
  return [
    { label: 'Pendente', value: s.pending, color: '#898781' },
    { label: 'Em andamento', value: s.in_progress, color: '#fab219' },
    { label: 'Concluída', value: s.done, color: '#0ca30c' },
  ];
});

const categoryItems = computed(() =>
  reportsStore.byCategory.map((c) => ({
    label: c.categoryName,
    value: c.total,
    color: c.categoryColor,
  })),
);
</script>

<template>
  <div>
    <h1 class="mb-6 text-xl font-semibold text-gray-900">Relatórios</h1>

    <div v-if="reportsStore.summary" class="mb-6 grid gap-4 sm:grid-cols-3">
      <div class="card p-5">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Total de tarefas</p>
        <p class="mt-2 text-3xl font-semibold text-gray-900">{{ reportsStore.summary.total }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Taxa de conclusão</p>
        <p class="mt-2 text-3xl font-semibold text-gray-900">{{ reportsStore.summary.completionRate }}%</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Tarefas atrasadas</p>
        <p class="mt-2 text-3xl font-semibold" :class="reportsStore.summary.overdue > 0 ? 'text-red-600' : 'text-gray-900'">
          {{ reportsStore.summary.overdue }}
        </p>
      </div>
    </div>

    <div v-if="reportsStore.loading" class="text-sm text-gray-500">Carregando relatórios...</div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <ReportBarChart title="Tarefas por status" :items="statusItems" />
      <ReportBarChart title="Tarefas por categoria" :items="categoryItems" />
    </div>
  </div>
</template>
