<script setup>
const props = defineProps({
  title: { type: String, required: true },
  items: {
    // { label: string, value: number, color: string }
    type: Array,
    required: true,
  },
});

function percent(value) {
  const max = Math.max(...props.items.map((i) => i.value), 1);
  return Math.round((value / max) * 100);
}
</script>

<template>
  <div class="card p-5">
    <h3 class="mb-4 text-sm font-semibold text-gray-900">{{ title }}</h3>
    <p v-if="!items.length" class="text-sm text-gray-500">Sem dados suficientes ainda.</p>
    <ul class="space-y-3">
      <li v-for="item in items" :key="item.label">
        <div class="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
            {{ item.label }}
          </span>
          <span class="font-medium text-gray-800">{{ item.value }}</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: percent(item.value) + '%', backgroundColor: item.color }"
          ></div>
        </div>
      </li>
    </ul>
  </div>
</template>
