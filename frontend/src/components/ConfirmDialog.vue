<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar ação' },
  message: { type: String, default: 'Tem certeza que deseja continuar?' },
});

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="card w-full max-w-sm p-6">
      <h2 class="text-base font-semibold text-gray-900">{{ title }}</h2>
      <p class="mt-2 text-sm text-gray-600">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button class="btn-secondary" @click="emit('cancel')">Cancelar</button>
        <button class="btn-danger" @click="emit('confirm')">Confirmar</button>
      </div>
    </div>
  </div>
</template>
