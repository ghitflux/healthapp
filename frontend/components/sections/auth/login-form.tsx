'use client';

/**
 * @file components/sections/auth/login-form.tsx
 * @description Organismo — Formulário de login com auth flow completo.
 * Localização canônica no design system (migrado de features/auth/).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { EyeIcon, EyeOffIcon, LoaderIcon } from '@/lib/icons';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await authService.login(data);
      let role = authService.getUserRole();

      try {
        const meResponse = await api.get('/v1/users/me/');
        const user = meResponse.data.data ?? meResponse.data;
        setUser(user);
        role = user?.role ?? role;
      } catch {
        // não crítico — store será populado em próxima requisição
      }

      if (!authService.isWebRoleAllowed(role)) {
        authService.clearTokens();
        setUser(null);
        toast.error('Perfil de paciente não acessa o portal web. Use o aplicativo mobile.');
        const deniedParams = new URLSearchParams({
          reason: 'web_only',
          role: role ?? 'unknown',
        });
        router.replace(`/access-denied?${deniedParams.toString()}`);
        return;
      }

      toast.success('Login realizado com sucesso!');
      router.push(authService.getRedirectPath(role));
    } catch (error) {
      const err = error as {
        response?: { data?: { detail?: string; errors?: Array<{ detail: string }> } };
      };
      const message =
        err.response?.data?.detail ??
        err.response?.data?.errors?.[0]?.detail ??
        'E-mail ou senha inválidos';
      toast.error(message);
    }
  }

  const isLoading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  disabled={isLoading}
                  aria-required="true"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Senha</FormLabel>
                <a
                  href="/forgot-password"
                  className="text-xs text-primary-600 underline-offset-4 hover:text-primary-700 hover:underline"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                    aria-required="true"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-neutral-400 transition-[color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-neutral-600 motion-safe:hover:scale-110"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
    </Form>
  );
}
