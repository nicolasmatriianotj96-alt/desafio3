<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

function handleLogout() {
  menuOpen.value = false;
  auth.logout();
  router.push({ name: 'login' });
}

function closeMenu() {
  menuOpen.value = false;
}
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <span class="bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500 bg-clip-text text-lg font-bold text-transparent">
        Studio Flow
      </span>

      <!-- Navegação em telas médias/grandes -->
      <nav class="hidden items-center gap-6 sm:flex">
        <div class="flex gap-4 text-sm font-medium text-gray-600">
          <router-link to="/" class="hover:text-brand-600" active-class="text-brand-600">Tarefas</router-link>
          <router-link to="/categories" class="hover:text-brand-600" active-class="text-brand-600">Categorias</router-link>
          <router-link to="/reports" class="hover:text-brand-600" active-class="text-brand-600">Relatórios</router-link>
        </div>
        <div class="flex items-center gap-3 text-sm text-gray-600">
          <span>{{ auth.user?.name }}</span>
          <button class="btn-secondary" @click="handleLogout">Sair</button>
        </div>
      </nav>

      <!-- Botão hambúrguer em telas pequenas -->
      <button
        class="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 sm:hidden"
        aria-label="Abrir menu"
        @click="menuOpen = !menuOpen"
      >
        <svg v-if="!menuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Menu suspenso mobile -->
    <nav v-if="menuOpen" class="flex flex-col gap-1 border-t border-gray-100 px-4 py-3 text-sm font-medium text-gray-600 sm:hidden">
      <router-link to="/" class="rounded-md px-2 py-2 hover:bg-gray-50 hover:text-brand-600" active-class="text-brand-600" @click="closeMenu">Tarefas</router-link>
      <router-link to="/categories" class="rounded-md px-2 py-2 hover:bg-gray-50 hover:text-brand-600" active-class="text-brand-600" @click="closeMenu">Categorias</router-link>
      <router-link to="/reports" class="rounded-md px-2 py-2 hover:bg-gray-50 hover:text-brand-600" active-class="text-brand-600" @click="closeMenu">Relatórios</router-link>
      <div class="mt-2 flex items-center justify-between border-t border-gray-100 px-2 pt-3">
        <span class="text-gray-500">{{ auth.user?.name }}</span>
        <button class="btn-secondary" @click="handleLogout">Sair</button>
      </div>
    </nav>

    <div class="h-1 aurora-bg"></div>
  </header>
</template>
