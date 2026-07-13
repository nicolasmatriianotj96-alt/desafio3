import { defineStore } from 'pinia';
import apiClient from '../api/client';

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    items: [],
    loading: false,
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const { data } = await apiClient.get('/categories');
        this.items = data.categories;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      const { data } = await apiClient.post('/categories', payload);
      this.items.push(data.category);
      return data.category;
    },

    async update(id, payload) {
      const { data } = await apiClient.put(`/categories/${id}`, payload);
      const index = this.items.findIndex((c) => c.id === id);
      if (index !== -1) this.items[index] = data.category;
      return data.category;
    },

    async remove(id) {
      await apiClient.delete(`/categories/${id}`);
      this.items = this.items.filter((c) => c.id !== id);
    },
  },
});
