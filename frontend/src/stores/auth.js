import { defineStore } from 'pinia';
import apiClient from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('taskmanager_token') || null,
    user: JSON.parse(localStorage.getItem('taskmanager_user') || 'null'),
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },

  actions: {
    persist(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem('taskmanager_token', token);
      localStorage.setItem('taskmanager_user', JSON.stringify(user));
    },

    async register({ name, email, password }) {
      const { data } = await apiClient.post('/auth/register', { name, email, password });
      this.persist(data.token, data.user);
    },

    async login({ email, password }) {
      const { data } = await apiClient.post('/auth/login', { email, password });
      this.persist(data.token, data.user);
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('taskmanager_token');
      localStorage.removeItem('taskmanager_user');
    },
  },
});
