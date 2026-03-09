import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '@/lib/storage';

export function useBiometrics() {
  async function checkBiometrics() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  async function authenticate() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique para acessar o Abase Saúde',
      cancelLabel: 'Usar senha',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  async function biometricLogin() {
    const isEnabled = await storage.getBiometricEnabled();
    if (!isEnabled) return false;

    const success = await authenticate();
    if (!success) return false;

    const token = await storage.getAccessToken();
    return Boolean(token);
  }

  return {
    checkBiometrics,
    authenticate,
    biometricLogin,
  };
}
