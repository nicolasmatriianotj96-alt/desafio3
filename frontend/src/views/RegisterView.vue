<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value });
    router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = err.response?.data?.message || 'Não foi possível criar a conta.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto mt-16 max-w-sm">
    <p class="mb-6 text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
      Studio Flow
    </p>
    <div class="card p-8 shadow-xl">
      <h1 class="mb-1 text-xl font-semibold text-gray-900">Criar conta</h1>
      <p class="mb-6 text-sm text-gray-500">Comece a organizar suas tarefas em minutos.</p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Nome</label>
          <input v-model="name" type="text" required class="input" placeholder="Seu nome" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
          <input v-model="email" type="email" required class="input" placeholder="voce@exemplo.com" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Senha</label>
          <input v-model="password" type="password" required minlength="6" class="input" placeholder="Mínimo 6 caracteres" />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Criando...' : 'Criar conta' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?
        <router-link to="/login" class="font-medium text-brand-600 hover:underline">Entrar</router-link>
      </p>
    </div>
  </div>
</template>
