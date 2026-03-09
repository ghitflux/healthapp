import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { verifyEmailRequestSchema } from '@api/zod/verifyEmailRequestSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/api-envelope';
import { showErrorToast, showSuccessToast } from '@/components/feedback/toast';
import { useAuthStore } from '@/stores/auth-store';

type VerifyEmailFormValues = z.infer<typeof verifyEmailRequestSchema>;

export default function VerifyEmailScreen() {
  const [countdown, setCountdown] = useState(60);
  const { verifyEmail, resendEmailOtp, verifyEmailMutation } = useAuth();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailRequestSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const interval = setInterval(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  async function handleVerify(values: VerifyEmailFormValues) {
    try {
      await verifyEmail(values.code);
      if (user) {
        await setUser({
          ...user,
          email_verified: true,
        });
      }
      showSuccessToast('Email confirmado.');
      router.replace('/(auth)/verify-phone');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel validar o codigo.'));
    }
  }

  async function handleResend() {
    try {
      await resendEmailOtp();
      setCountdown(60);
      showSuccessToast('Novo codigo enviado para seu email.');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel reenviar o codigo.'));
    }
  }

  return (
    <ScreenWrapper>
      <View className="gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Verifique seu email</Text>
          <Text className="text-sm leading-6 text-muted">
            Use o codigo enviado no cadastro. Depois seguimos para a confirmacao do telefone.
          </Text>
        </View>

        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <Input
              label="Codigo"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="number-pad"
              maxLength={6}
              error={fieldState.error?.message}
            />
          )}
        />

        <Button
          label="Confirmar email"
          isLoading={verifyEmailMutation.isPending}
          onPress={form.handleSubmit(handleVerify)}
        />

        <Button
          label={countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar codigo'}
          variant="ghost"
          disabled={countdown > 0}
          onPress={handleResend}
        />
      </View>
    </ScreenWrapper>
  );
}
