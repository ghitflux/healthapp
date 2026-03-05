'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod/v4';
import { useGetPlatformSettings } from '@api/hooks/useOwner';
import type { PlatformSettings } from '@api/types/PlatformSettings';
import { updatePlatformSettingsMutationRequestSchema } from '@api/zod/ownerSchemas/updatePlatformSettingsSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DecimalInput } from '@/components/ui/decimal-input';
import { IntegerInput } from '@/components/ui/integer-input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { LoaderIcon, SaveIcon } from '@/lib/icons';
import { queryClient } from '@/lib/query-client';
import { useOwnerMutations } from '@/hooks/owner';

type SettingsFormValues = z.infer<typeof updatePlatformSettingsMutationRequestSchema>;

function unwrapSettings(payload: unknown): PlatformSettings | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const envelope = payload as { data?: PlatformSettings };
  return envelope.data ?? (payload as PlatformSettings);
}

export function OwnerSettingsPageContent() {
  const mutations = useOwnerMutations();

  const settingsQuery = useGetPlatformSettings({
    query: {
      client: queryClient,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 20,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  const settings = useMemo(() => unwrapSettings(settingsQuery.data), [settingsQuery.data]);

  const form = useForm<SettingsFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updatePlatformSettingsMutationRequestSchema as any),
    defaultValues: {
      platform_fee_percentage: '',
      max_advance_booking_days: 90,
      min_cancellation_hours: 24,
      cancellation_fee_percentage: '0.00',
      appointment_lock_ttl_minutes: 10,
      payment_timeout_minutes: 30,
      max_appointments_per_day_patient: 5,
      pix_enabled: true,
      credit_card_enabled: true,
      maintenance_mode: false,
      maintenance_message: '',
    },
  });

  useEffect(() => {
    if (!settings) return;
    form.reset({
      platform_fee_percentage: settings.platform_fee_percentage ?? '',
      max_advance_booking_days: settings.max_advance_booking_days ?? 90,
      min_cancellation_hours: settings.min_cancellation_hours ?? 24,
      cancellation_fee_percentage: settings.cancellation_fee_percentage ?? '0.00',
      appointment_lock_ttl_minutes: settings.appointment_lock_ttl_minutes ?? 10,
      payment_timeout_minutes: settings.payment_timeout_minutes ?? 30,
      max_appointments_per_day_patient: settings.max_appointments_per_day_patient ?? 5,
      pix_enabled: settings.pix_enabled ?? true,
      credit_card_enabled: settings.credit_card_enabled ?? true,
      maintenance_mode: settings.maintenance_mode ?? false,
      maintenance_message: settings.maintenance_message ?? '',
    });
  }, [form, settings]);

  async function onSubmit(values: SettingsFormValues) {
    await mutations.updateSettings(values);
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-80 animate-pulse rounded-md border bg-muted/40" />
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar configurações"
        message="Não foi possível carregar as configurações globais da plataforma."
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  if (!settings) {
    return (
      <EmptyStateBlock
        title="Configurações indisponíveis"
        description="Nenhum payload de configuração foi retornado para o owner."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações Globais</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina taxas, limites operacionais e modo de manutenção da plataforma.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taxas e políticas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="platform_fee_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa da plataforma (%)</FormLabel>
                    <FormControl>
                      <DecimalInput
                        placeholder="0,00"
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cancellation_fee_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de cancelamento (%)</FormLabel>
                    <FormControl>
                      <DecimalInput
                        placeholder="0,00"
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_advance_booking_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Antecedência máxima (dias)</FormLabel>
                    <FormControl>
                      <IntegerInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_cancellation_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancelamento mínimo (horas)</FormLabel>
                    <FormControl>
                      <IntegerInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Limites operacionais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="appointment_lock_ttl_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TTL de lock (min)</FormLabel>
                    <FormControl>
                      <IntegerInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_timeout_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout de pagamento (min)</FormLabel>
                    <FormControl>
                      <IntegerInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_appointments_per_day_patient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. agendamentos/dia por paciente</FormLabel>
                    <FormControl>
                      <IntegerInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Toggles operacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField
                control={form.control}
                name="pix_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
                    <FormLabel>PIX habilitado</FormLabel>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credit_card_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
                    <FormLabel>Cartão de crédito habilitado</FormLabel>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenance_mode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
                    <FormLabel>Modo de manutenção</FormLabel>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenance_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de manutenção</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Mensagem exibida durante manutenção" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutations.isUpdatingSettings}>
              {mutations.isUpdatingSettings ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-2 h-4 w-4" />
              )}
              Salvar configurações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
