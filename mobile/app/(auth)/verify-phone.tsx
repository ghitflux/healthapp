import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { verifyPhoneRequestSchema } from '@api/zod/verifyPhoneRequestSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/api-envelope';
import { showErrorToast, showSuccessToast } from '@/components/feedback/toast';
import { useAuthStore } from '@/stores/auth-store';

type VerifyPhoneFormValues = z.infer<typeof verifyPhoneRequestSchema>;

export default function VerifyPhoneScreen() {
  const [countdown, setCountdown] = useState(0);
  const { verifyPhone, resendPhoneOtp, verifyPhoneMutation } = useAuth();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const form = useForm<VerifyPhoneFormValues>({
    resolver: zodResolver(verifyPhoneRequestSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    let mounted = true;

    async function bootstrapOtp() {
      try {
        await resendPhoneOtp();
        if (mounted) {
          setCountdown(60);
        }
      } catch (error) {
        showErrorToast(getErrorMessage(error, 'Nao foi possivel enviar o codigo por SMS.'));
      }
    }

    void bootstrapOtp();

    return () => {
      mounted = false;
    };
  }, [resendPhoneOtp]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const interval = setInterval(() => setCountdown((current) => current - 1), 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  async function handleVerify(values: VerifyPhoneFormValues) {
    try {
      await verifyPhone(values.code);
      if (user) {
        await setUser({
          ...user,
          phone_verified: true,
        });
      }
      showSuccessToast('Telefone confirmado.');
      router.replace('/(tabs)');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel validar o codigo por SMS.'));
    }
  }

  async function handleResend() {
    try {
      await resendPhoneOtp();
      setCountdown(60);
      showSuccessToast('Novo codigo enviado por SMS.');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel reenviar o SMS.'));
    }
  }

  return (
    <ScreenWrapper>
      <View className="gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Verifique seu telefone</Text>
          <Text className="text-sm leading-6 text-muted">
            O backend envia o OTP de telefone sob demanda. Por isso o primeiro SMS e disparado ao abrir esta tela.
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
          label="Confirmar telefone"
          isLoading={verifyPhoneMutation.isPending}
          onPress={form.handleSubmit(handleVerify)}
        />

        <Button
          label={countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar SMS'}
          variant="ghost"
          disabled={countdown > 0}
          onPress={handleResend}
        />
      </View>
    </ScreenWrapper>
  );
}
