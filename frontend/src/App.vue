<script setup>
import { useAuthStore } from './stores/auth';
import NavBar from './components/NavBar.vue';

const auth = useAuthStore();
</script>

<template>
  <div
    class="min-h-screen"
    :class="auth.isAuthenticated ? 'bg-gray-100' : ''"
  >
    <div v-if="!auth.isAuthenticated" class="fixed inset-0 -z-10 aurora-bg"></div>
    <NavBar v-if="auth.isAuthenticated" />
    <main class="mx-auto max-w-6xl px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
