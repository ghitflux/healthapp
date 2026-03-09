import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const BIOMETRIC_KEY = 'biometric_enabled';

async function setBoolean(key: string, value: boolean) {
  await SecureStore.setItemAsync(key, value ? 'true' : 'false');
}

async function getBoolean(key: string) {
  return (await SecureStore.getItemAsync(key)) === 'true';
}

export const storage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  removeAccessToken: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  getUser: async <T>() => {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? (JSON.parse(data) as T) : null;
  },
  setUser: (user: object) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  removeUser: () => SecureStore.deleteItemAsync(USER_KEY),
  getBiometricEnabled: () => getBoolean(BIOMETRIC_KEY),
  setBiometricEnabled: (value: boolean) => setBoolean(BIOMETRIC_KEY, value),
  clearAll: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(BIOMETRIC_KEY),
    ]);
  },
};
