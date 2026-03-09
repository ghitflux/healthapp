import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { genderEnumSchema } from '@api/zod/genderEnumSchema';
import { registerRequestSchema } from '@api/zod/registerRequestSchema';
import type { RegisterRequest } from '@api/types/RegisterRequest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenWrapper } from '@/components/layout/screen-wrapper';
import { CheckIcon, ChevronLeftIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from '@/lib/icons';
import { normalizeCpfForApi, normalizePhoneForApi } from '@/lib/formatters';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/api-envelope';
import { showErrorToast, showSuccessToast } from '@/components/feedback/toast';
import { cn } from '@/lib/utils';

const registerFormSchema = registerRequestSchema.extend({
  phone: z.string().min(1, 'Telefone obrigatorio'),
  cpf: z.string().min(1, 'CPF obrigatorio'),
  date_of_birth: z.string().min(1, 'Data de nascimento obrigatoria'),
  gender: genderEnumSchema,
  acceptTerms: z.boolean().refine((value) => value, 'Aceite os termos para continuar.'),
  acceptLgpd: z.boolean().refine((value) => value, 'Aceite o consentimento LGPD para continuar.'),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const STEP_FIELDS: (keyof RegisterFormValues)[][] = [
  ['full_name', 'email', 'phone', 'cpf'],
  ['date_of_birth', 'gender', 'password', 'password_confirm'],
  ['acceptTerms', 'acceptLgpd'],
];

function CheckboxRow({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3">
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-md border',
          checked ? 'border-primary-600 bg-primary-600' : 'border-border bg-white'
        )}
      >
        {checked ? <CheckIcon color="#FFFFFF" size={14} /> : null}
      </View>
      <Text className="flex-1 text-sm leading-6 text-foreground">{label}</Text>
    </Pressable>
  );
}

export default function RegisterScreen() {
  const [step, setStep] = useState(0);
  const { register, registerMutation } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      cpf: '',
      date_of_birth: '',
      gender: 'O',
      password: '',
      password_confirm: '',
      acceptTerms: false,
      acceptLgpd: false,
    },
  });

  async function goToNextStep() {
    const isValid = await form.trigger(STEP_FIELDS[step] as (keyof RegisterFormValues)[]);
    if (!isValid) return;
    setStep((current) => Math.min(current + 1, STEP_FIELDS.length - 1));
  }

  async function handleRegister(values: RegisterFormValues) {
    try {
      const payload: RegisterRequest = {
        full_name: values.full_name,
        email: values.email,
        phone: normalizePhoneForApi(values.phone),
        cpf: normalizeCpfForApi(values.cpf),
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        password: values.password,
        password_confirm: values.password_confirm,
      };

      await register(payload);
      showSuccessToast('Conta criada. Confirme seu email para continuar.');
      router.replace('/(auth)/verify-email');
    } catch (error) {
      showErrorToast(getErrorMessage(error, 'Nao foi possivel concluir o cadastro.'));
    }
  }

  return (
    <ScreenWrapper>
      <View className="gap-6">
        <Button
          label="Voltar"
          variant="ghost"
          fullWidth={false}
          onPress={() => (step === 0 ? router.back() : setStep((current) => current - 1))}
          leftIcon={<ChevronLeftIcon color="#2563EB" size={18} />}
        />

        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Criar conta</Text>
          <Text className="text-sm text-muted">Etapa {step + 1} de 3</Text>
        </View>

        {step === 0 ? (
          <View className="gap-4">
            <Controller
              control={form.control}
              name="full_name"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome completo"
                  value={field.value}
                  onChangeText={field.onChange}
                  icon={<UserIcon color="#64748B" size={18} />}
                  error={fieldState.error?.message}
                />
              )}
            />
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
            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Input
                  label="Telefone"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="phone-pad"
                  icon={<PhoneIcon color="#64748B" size={18} />}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="cpf"
              render={({ field, fieldState }) => (
                <Input
                  label="CPF"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="number-pad"
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View className="gap-4">
            <Controller
              control={form.control}
              name="date_of_birth"
              render={({ field, fieldState }) => (
                <Input
                  label="Data de nascimento"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="YYYY-MM-DD"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="gender"
              render={({ field, fieldState }) => (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">Genero</Text>
                  <View className="flex-row gap-2">
                    {[
                      { label: 'Masculino', value: 'M' },
                      { label: 'Feminino', value: 'F' },
                      { label: 'Outro', value: 'O' },
                    ].map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => field.onChange(option.value)}
                        className={cn(
                          'flex-1 rounded-2xl border px-4 py-3',
                          field.value === option.value
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-border bg-white'
                        )}
                      >
                        <Text className="text-center text-sm font-medium text-foreground">{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {fieldState.error?.message ? (
                    <Text className="text-sm text-danger">{fieldState.error.message}</Text>
                  ) : null}
                </View>
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
                  secureTextEntry
                  icon={<LockIcon color="#64748B" size={18} />}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="password_confirm"
              render={({ field, fieldState }) => (
                <Input
                  label="Confirmar senha"
                  value={field.value}
                  onChangeText={field.onChange}
                  secureTextEntry
                  icon={<LockIcon color="#64748B" size={18} />}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-4">
            <Controller
              control={form.control}
              name="acceptTerms"
              render={({ field, fieldState }) => (
                <View className="gap-2">
                  <CheckboxRow
                    checked={field.value}
                    onPress={() => field.onChange(!field.value)}
                    label="Li e aceito os termos de uso do Abase Saúde."
                  />
                  {fieldState.error?.message ? <Text className="text-sm text-danger">{fieldState.error.message}</Text> : null}
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="acceptLgpd"
              render={({ field, fieldState }) => (
                <View className="gap-2">
                  <CheckboxRow
                    checked={field.value}
                    onPress={() => field.onChange(!field.value)}
                    label="Concordo com o tratamento de dados pessoais para finalidades assistenciais."
                  />
                  {fieldState.error?.message ? <Text className="text-sm text-danger">{fieldState.error.message}</Text> : null}
                </View>
              )}
            />
          </View>
        ) : null}

        <Button
          label={step === 2 ? 'Finalizar cadastro' : 'Continuar'}
          isLoading={registerMutation.isPending}
          onPress={step === 2 ? form.handleSubmit(handleRegister) : goToNextStep}
        />
      </View>
    </ScreenWrapper>
  );
}
