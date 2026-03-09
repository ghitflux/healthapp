import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPasswordRequestSchema } from '@api/zod/forgotPasswordRequestSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { MailIcon } from '@/lib/icons';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/api-envelope';
import { showErrorToast, showSuccessToast } from '@/components/feedback/toast';

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordRequestSchema>;

export default function ForgotPasswordScreen() {
  const { forgotPassword, forgotPasswordMutation } = useAuth();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: '' },
  });

  async function handleForgotPassword(values: ForgotPasswordFormValues) {
    try {
      await forgotPassword(values.email);
      showSuccessToast('Se o email existir, enviaremos o link de redefinicao.');
      router.replace('/(auth)/login');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel enviar a solicitacao.'));
    }
  }

  return (
    <ScreenWrapper>
      <View className="gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Recuperar senha</Text>
          <Text className="text-sm leading-6 text-muted">
            Informe seu email. O app sempre responde com a mesma mensagem por seguranca.
          </Text>
        </View>

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<MailIcon color="#64748B" size={18} />}
              error={fieldState.error?.message}
            />
          )}
        />

        <Button
          label="Enviar"
          isLoading={forgotPasswordMutation.isPending}
          onPress={form.handleSubmit(handleForgotPassword)}
        />
      </View>
    </ScreenWrapper>
  );
}
