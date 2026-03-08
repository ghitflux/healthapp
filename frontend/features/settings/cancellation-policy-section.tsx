'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { PatchedConvenioRequest } from '@api/types/PatchedConvenioRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DecimalInput } from '@/components/ui/decimal-input';
import { IntegerInput } from '@/components/ui/integer-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { LoaderIcon, SaveIcon } from '@/lib/icons';

interface CancellationPolicySectionProps {
  settings: Record<string, unknown>;
  onSave: (data: Partial<PatchedConvenioRequest>) => Promise<void>;
  isSubmitting: boolean;
}

interface CancellationPolicyFormValues {
  minCancellationHours: number;
  cancellationRefundPercentage: number;
  allowPatientCancellation: boolean;
  cancellationPolicyMessage: string;
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function CancellationPolicySection({
  settings,
  onSave,
  isSubmitting,
}: CancellationPolicySectionProps) {
  const form = useForm<CancellationPolicyFormValues>({
    defaultValues: {
      minCancellationHours: asNumber(settings.min_cancellation_hours, 24),
      cancellationRefundPercentage: asNumber(settings.cancellation_refund_percentage, 100),
      allowPatientCancellation:
        typeof settings.allow_patient_cancellation === 'boolean'
          ? settings.allow_patient_cancellation
          : true,
      cancellationPolicyMessage:
        typeof settings.cancellation_policy_message === 'string'
          ? settings.cancellation_policy_message
          : '',
    },
  });

  useEffect(() => {
    form.reset({
      minCancellationHours: asNumber(settings.min_cancellation_hours, 24),
      cancellationRefundPercentage: asNumber(settings.cancellation_refund_percentage, 100),
      allowPatientCancellation:
        typeof settings.allow_patient_cancellation === 'boolean'
          ? settings.allow_patient_cancellation
          : true,
      cancellationPolicyMessage:
        typeof settings.cancellation_policy_message === 'string'
          ? settings.cancellation_policy_message
          : '',
    });
  }, [form, settings]);

  async function handleSubmit(values: CancellationPolicyFormValues) {
    await onSave({
      settings: {
        ...settings,
        min_cancellation_hours: values.minCancellationHours,
        cancellation_refund_percentage: values.cancellationRefundPercentage,
        allow_patient_cancellation: values.allowPatientCancellation,
        cancellation_policy_message: values.cancellationPolicyMessage.trim(),
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Política de cancelamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min-cancellation-hours">Prazo mínimo (horas)</Label>
              <IntegerInput
                id="min-cancellation-hours"
                value={form.watch('minCancellationHours')}
                onValueChange={(value) =>
                  form.setValue('minCancellationHours', value ?? 0, { shouldDirty: true })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellation-refund-percentage">Reembolso antecipado (%)</Label>
              <DecimalInput
                id="cancellation-refund-percentage"
                value={form.watch('cancellationRefundPercentage')}
                onValueChange={(value) =>
                  form.setValue(
                    'cancellationRefundPercentage',
                    value === '' ? 0 : Number.parseFloat(value),
                    { shouldDirty: true }
                  )
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
            <div>
              <p className="text-sm font-medium">Permitir cancelamento pelo paciente</p>
              <p className="text-xs text-muted-foreground">
                Quando ativo, o paciente pode cancelar dentro da janela configurada.
              </p>
            </div>
            <Switch
              checked={form.watch('allowPatientCancellation')}
              onCheckedChange={(value) => form.setValue('allowPatientCancellation', value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation-policy-message">Mensagem da política</Label>
            <Textarea
              id="cancellation-policy-message"
              rows={4}
              {...form.register('cancellationPolicyMessage')}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-2 h-4 w-4" />
              )}
              Salvar política
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
