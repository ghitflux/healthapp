/**
 * Configuração global do axios usado pelos clients gerados via Kubb.
 * Sem isso, hooks gerados não enviam Authorization e todas as queries retornam 401.
 */
import axios from 'axios';
import { axiosInstance } from '@kubb/plugin-client/clients/axios';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_ORIGIN = RAW_API_URL.replace(/\/api\/?$/, '');

let isConfigured = false;

export function configureKubbClient() {
  if (isConfigured) return;
  isConfigured = true;

  axiosInstance.defaults.baseURL = API_ORIGIN;
  axiosInstance.defaults.timeout = 30000;
  axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';

  axiosInstance.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
          const refreshToken = typeof window !== 'undefined'
            ? localStorage.getItem('refresh_token')
            : null;

          if (!refreshToken) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          const response = await axios.post(`${API_ORIGIN}/api/v1/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const payload = response.data?.data ?? response.data;
          const access = payload?.access;

          if (!access) {
            throw new Error('Token refresh response without access token');
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access);
          }

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axiosInstance.request(originalRequest);
        } catch (refreshError) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}
