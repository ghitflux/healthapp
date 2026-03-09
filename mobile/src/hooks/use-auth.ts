import { useForgotPassword, useLoginUser, useLogoutUser, useRegisterUser, useResendEmailOTP, useResendPhoneOTP, useVerifyEmail, useVerifyPhone } from '@api/hooks/useAuth';
import type { LoginRequest } from '@api/types/LoginRequest';
import type { Profile } from '@api/types/Profile';
import type { RegisterRequest } from '@api/types/RegisterRequest';
import { useAuthStore } from '@/stores/auth-store';
import { storage } from '@/lib/storage';
import { unwrapEnvelope } from '@/lib/api-envelope';

function extractAuthPayload(response: unknown) {
  return unwrapEnvelope<Record<string, unknown>>(
    response as Record<string, unknown> | null | undefined
  ) ?? (response as Record<string, unknown>);
}

export function useAuth() {
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const logoutStore = useAuthStore((state) => state.logout);

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();
  const verifyEmailMutation = useVerifyEmail();
  const verifyPhoneMutation = useVerifyPhone();
  const forgotPasswordMutation = useForgotPassword();
  const resendEmailMutation = useResendEmailOTP();
  const resendPhoneMutation = useResendPhoneOTP();
  const logoutMutation = useLogoutUser();

  async function login(values: LoginRequest) {
    const response = await loginMutation.mutateAsync({
      data: values,
    });

    const payload = extractAuthPayload(response);
    if (payload?.requires_2fa) {
      return {
        requiresTwoFactor: true,
        tempToken: payload.temp_token,
      };
    }

    const access = typeof payload?.access === 'string' ? payload.access : null;
    const refresh = typeof payload?.refresh === 'string' ? payload.refresh : null;
    const user = payload?.user as Profile | undefined;

    if (!access || !refresh) {
      throw new Error('Resposta de login sem tokens.');
    }

    await setAuthData(access, refresh, user ?? null);
    await storage.setBiometricEnabled(true);

    return {
      requiresTwoFactor: false,
      user,
    };
  }

  async function register(values: RegisterRequest) {
    await registerMutation.mutateAsync({
      data: values,
    });

    await login({
      email: values.email,
      password: values.password,
    });
  }

  async function verifyEmail(code: string) {
    return verifyEmailMutation.mutateAsync({
      data: { code },
    });
  }

  async function verifyPhone(code: string) {
    return verifyPhoneMutation.mutateAsync({
      data: { code },
    });
  }

  async function resendEmailOtp() {
    return resendEmailMutation.mutateAsync();
  }

  async function resendPhoneOtp() {
    return resendPhoneMutation.mutateAsync();
  }

  async function forgotPassword(email: string) {
    return forgotPasswordMutation.mutateAsync({
      data: { email },
    });
  }

  async function logout() {
    const refresh = await storage.getRefreshToken();

    try {
      if (refresh) {
        await logoutMutation.mutateAsync({
          data: { refresh },
        });
      }
    } finally {
      await logoutStore();
    }
  }

  return {
    login,
    register,
    verifyEmail,
    verifyPhone,
    resendEmailOtp,
    resendPhoneOtp,
    forgotPassword,
    logout,
    loginMutation,
    registerMutation,
    verifyEmailMutation,
    verifyPhoneMutation,
    forgotPasswordMutation,
  };
}
