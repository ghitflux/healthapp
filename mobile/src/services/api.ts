import axios, { type AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { storage } from '@/lib/storage';

function resolveApiUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    if (Platform.OS !== 'android' && configuredUrl.includes('10.0.2.2')) {
      return configuredUrl.replace('10.0.2.2', '127.0.0.1');
    }

    return configuredUrl;
  }

  const localhostHost = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  return `http://${localhostHost}:8000/api`;
}

export const API_URL = resolveApiUrl();
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
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
          throw new Error('Refresh token response without access token');
        }

        await storage.setAccessToken(access);
        if (typeof refresh === 'string') {
          await storage.setRefreshToken(refresh);
        }

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        await storage.clearAll();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
