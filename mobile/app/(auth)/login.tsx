import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginRequestSchema } from '@api/zod/loginRequestSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { MailIcon, EyeIcon, EyeOffIcon, LockIcon, ShieldIcon } from '@/lib/icons';
import { useAuth } from '@/hooks/use-auth';
import { useBiometrics } from '@/hooks/use-biometrics';
import { storage } from '@/lib/storage';
import { showErrorToast } from '@/components/feedback/toast';
import { getErrorMessage } from '@/lib/api-envelope';
import { useAuthStore } from '@/stores/auth-store';

type LoginFormValues = z.infer<typeof loginRequestSchema>;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const { login, loginMutation } = useAuth();
  const { checkBiometrics, biometricLogin } = useBiometrics();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    let mounted = true;

    async function loadBiometrics() {
      const [supported, isEnabled] = await Promise.all([
        checkBiometrics(),
        storage.getBiometricEnabled(),
      ]);

      if (mounted) {
        setCanUseBiometrics(supported && isEnabled);
      }
    }

    void loadBiometrics();

    return () => {
      mounted = false;
    };
  }, [checkBiometrics]);

  async function handleLogin(values: LoginFormValues) {
    try {
      const result = await login(values);
      if (result.requiresTwoFactor) {
        showErrorToast('O fluxo 2FA ainda nao foi mapeado na Semana 9.');
        return;
      }
      router.replace('/(tabs)');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel fazer login.'));
    }
  }

  async function handleBiometricLogin() {
    try {
      const success = await biometricLogin();
      if (!success) {
        showErrorToast('Biometria indisponivel para esta sessao.');
        return;
      }
      await useAuthStore.getState().hydrate();
      router.replace('/(tabs)');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel autenticar com biometria.'));
    }
  }

  return (
    <ScreenWrapper className="bg-primary-600" scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-1 justify-center gap-8 px-1">
          <View className="gap-3">
            <Text className="text-4xl font-bold text-white">Abase Saúde</Text>
            <Text className="text-base leading-7 text-primary-100">
              Seus exames e consultas na palma da mao, com seguranca e agilidade.
            </Text>
          </View>

          <View className="gap-4 rounded-[28px] bg-white p-5">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  label="Email"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  icon={<MailIcon color="#64748B" size={18} />}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Input
                  label="Senha"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showPassword}
                  icon={<LockIcon color="#64748B" size={18} />}
                  rightAccessory={
                    <Button
                      label=""
                      variant="ghost"
                      fullWidth={false}
                      className="min-h-0 px-0 py-0"
                      onPress={() => setShowPassword((current) => !current)}
                      leftIcon={showPassword ? <EyeOffIcon color="#64748B" size={18} /> : <EyeIcon color="#64748B" size={18} />}
                    />
                  }
                  error={fieldState.error?.message}
                />
              )}
            />

            <Button
              label="Entrar"
              isLoading={loginMutation.isPending}
              onPress={form.handleSubmit(handleLogin)}
            />

            {canUseBiometrics ? (
              <Button
                label="Entrar com biometria"
                variant="outline"
                onPress={handleBiometricLogin}
                leftIcon={<ShieldIcon color="#2563EB" size={18} />}
              />
            ) : null}

            <View className="gap-3">
              <Button label="Cadastrar como paciente" variant="outline" onPress={() => router.push('/(auth)/register')} />
              <Button label="Cadastrar clinica" variant="ghost" onPress={() => router.push('/(auth)/register-clinic')} />
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <Button label="Problemas com login?" variant="ghost" />
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
