import axios from 'axios';
import { axiosInstance } from '@kubb/plugin-client/clients/axios';
import { storage } from '@/lib/storage';
import { API_ORIGIN } from '@/services/api';

let isConfigured = false;

export function configureKubbClient() {
  if (isConfigured) return;
  isConfigured = true;

  axiosInstance.defaults.baseURL = API_ORIGIN;
  axiosInstance.defaults.timeout = 30000;
  axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';

  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = await storage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await storage.getRefreshToken();
          if (!refreshToken) {
            await storage.clearAll();
            return Promise.reject(error);
          }

          const response = await axios.post(`${API_ORIGIN}/api/v1/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const payload = response.data?.data ?? response.data;
          const access = payload?.access;
          const refresh = payload?.refresh;

          if (!access) {
            throw new Error('Token refresh response without access token');
          }

          await storage.setAccessToken(access);
          if (typeof refresh === 'string') {
            await storage.setRefreshToken(refresh);
          }

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axiosInstance.request(originalRequest);
        } catch (refreshError) {
          await storage.clearAll();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}
