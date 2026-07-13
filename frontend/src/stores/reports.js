import { defineStore } from 'pinia';
import apiClient from '../api/client';

export const useReportsStore = defineStore('reports', {
  state: () => ({
    summary: null,
    byCategory: [],
    loading: false,
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const [summaryRes, categoryRes] = await Promise.all([
          apiClient.get('/reports/summary'),
          apiClient.get('/reports/by-category'),
        ]);
        this.summary = summaryRes.data;
        this.byCategory = categoryRes.data.categories;
      } finally {
        this.loading = false;
      }
    },
  },
});
