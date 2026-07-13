<script setup>
import { useAuthStore } from './stores/auth';
import NavBar from './components/NavBar.vue';

const auth = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar v-if="auth.isAuthenticated" />
    <main class="mx-auto max-w-6xl px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
