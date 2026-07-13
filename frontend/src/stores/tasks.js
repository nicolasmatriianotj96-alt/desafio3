import { defineStore } from 'pinia';
import apiClient from '../api/client';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [],
    loading: false,
    filters: {
      status: '',
      categoryId: '',
      search: '',
    },
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const params = {};
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.categoryId) params.categoryId = this.filters.categoryId;
        if (this.filters.search) params.search = this.filters.search;

        const { data } = await apiClient.get('/tasks', { params });
        this.items = data.tasks;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      const { data } = await apiClient.post('/tasks', payload);
      this.items.unshift(data.task);
      return data.task;
    },

    async update(id, payload) {
      const { data } = await apiClient.put(`/tasks/${id}`, payload);
      const index = this.items.findIndex((t) => t.id === id);
      if (index !== -1) this.items[index] = data.task;
      return data.task;
    },

    async remove(id) {
      await apiClient.delete(`/tasks/${id}`);
      this.items = this.items.filter((t) => t.id !== id);
    },

    async addCollaborator(id, email) {
      const { data } = await apiClient.post(`/tasks/${id}/collaborators`, { email });
      const index = this.items.findIndex((t) => t.id === id);
      if (index !== -1) this.items[index] = data.task;
      return data.task;
    },

    async removeCollaborator(id, userId) {
      const { data } = await apiClient.delete(`/tasks/${id}/collaborators/${userId}`);
      const index = this.items.findIndex((t) => t.id === id);
      if (index !== -1) this.items[index] = data.task;
      return data.task;
    },
  },
});
