<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

function handleLogout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-6">
        <span class="text-lg font-semibold text-brand-700">Task Manager</span>
        <nav class="flex gap-4 text-sm font-medium text-gray-600">
          <router-link to="/" class="hover:text-brand-600" active-class="text-brand-600">Tarefas</router-link>
          <router-link to="/categories" class="hover:text-brand-600" active-class="text-brand-600">Categorias</router-link>
          <router-link to="/reports" class="hover:text-brand-600" active-class="text-brand-600">Relatórios</router-link>
        </nav>
      </div>
      <div class="flex items-center gap-3 text-sm text-gray-600">
        <span>{{ auth.user?.name }}</span>
        <button class="btn-secondary" @click="handleLogout">Sair</button>
      </div>
    </div>
  </header>
</template>
