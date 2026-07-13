<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login({ email: email.value, password: password.value });
    router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível entrar. Tente novamente.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto mt-16 max-w-sm">
    <div class="card p-8">
      <h1 class="mb-1 text-xl font-semibold text-gray-900">Entrar</h1>
      <p class="mb-6 text-sm text-gray-500">Acesse sua conta para gerenciar suas tarefas.</p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
          <input v-model="email" type="email" required class="input" placeholder="voce@exemplo.com" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Senha</label>
          <input v-model="password" type="password" required class="input" placeholder="••••••••" />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Não tem uma conta?
        <router-link to="/register" class="font-medium text-brand-600 hover:underline">Cadastre-se</router-link>
      </p>
    </div>
  </div>
</template>
