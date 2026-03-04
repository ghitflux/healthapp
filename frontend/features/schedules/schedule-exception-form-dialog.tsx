'use client';

/**
 * @file features/schedules/schedule-exception-form-dialog.tsx
 * @description Dialog para criação de exceção de agenda (bloqueio ou disponibilidade).
 * Suporta dia inteiro, período específico e criação em intervalo de datas.
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/lib/icons';
import { scheduleExceptionRequestSchema } from '@api/zod/scheduleExceptionRequestSchema';

type ExceptionValues = z.infer<typeof scheduleExceptionRequestSchema>;

interface ScheduleExceptionFormDialogProps {
  open: boolean;
  onClose: () => void;
  doctorId: string;
  onSubmit: (data: ExceptionValues) => Promise<void>;
  isSubmitting: boolean;
  onSubmitRange?: (startDate: string, endDate: string, data: Omit<ExceptionValues, 'date'>) => Promise<void>;
}

export function ScheduleExceptionFormDialog({
  open,
  onClose,
  doctorId,
  onSubmit,
  isSubmitting,
  onSubmitRange,
}: ScheduleExceptionFormDialogProps) {
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeEndDate, setRangeEndDate] = useState('');
  const [rangeEndDateError, setRangeEndDateError] = useState('');

  const form = useForm<ExceptionValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(scheduleExceptionRequestSchema as any),
    defaultValues: {
      doctor: doctorId,
      date: '',
      start_time: null,
      end_time: null,
      is_full_day: true,
      is_available: false,
      reason: '',
    },
  });

  const isFullDay = useWatch({ control: form.control, name: 'is_full_day' });

  useEffect(() => {
    if (open) {
      form.reset({
        doctor: doctorId,
        date: '',
        start_time: null,
        end_time: null,
        is_full_day: true,
        is_available: false,
        reason: '',
      });
      setIsRangeMode(false);
      setRangeEndDate('');
      setRangeEndDateError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doctorId]);

  async function handleSubmit(values: ExceptionValues) {
    if (isRangeMode && onSubmitRange) {
      if (!rangeEndDate) {
        setRangeEndDateError('Informe a data de término do período.');
        return;
      }
      if (rangeEndDate < values.date) {
        setRangeEndDateError('A data de término deve ser posterior à data de início.');
        return;
      }
      const { date: _date, ...rest } = values;
      await onSubmitRange(values.date, rangeEndDate, rest);
    } else {
      await onSubmit(values);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Exceção de Agenda</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Range mode toggle */}
            {onSubmitRange && (
              <div className="flex items-center justify-between rounded-md border px-4 py-3 bg-muted/30">
                <span className="text-sm font-medium">Aplicar por período</span>
                <Switch
                  checked={isRangeMode}
                  onCheckedChange={(v) => {
                    setIsRangeMode(v);
                    setRangeEndDateError('');
                  }}
                  aria-label="Aplicar por período"
                />
              </div>
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRangeMode ? 'Data de Início' : 'Data'}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      aria-label={isRangeMode ? 'Data de início' : 'Data da exceção'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Range end date */}
            {isRangeMode && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Data de Término
                </label>
                <Input
                  type="date"
                  value={rangeEndDate}
                  onChange={(e) => {
                    setRangeEndDate(e.target.value);
                    setRangeEndDateError('');
                  }}
                  aria-label="Data de término do período"
                />
                {rangeEndDateError && (
                  <p className="text-sm text-destructive">{rangeEndDateError}</p>
                )}
              </div>
            )}

            {/* Is full day */}
            <FormField
              control={form.control}
              name="is_full_day"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
                  <FormLabel className="cursor-pointer">Dia Inteiro</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      aria-label="Dia inteiro"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* start_time / end_time — only when !is_full_day */}
            {!isFullDay && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          aria-label="Horário de início"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Término</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          aria-label="Horário de término"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Is available */}
            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <FormLabel className="cursor-pointer">Disponível</FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {field.value ? 'Período marcado como disponível' : 'Período bloqueado'}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      aria-label="Disponível neste período"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Férias, Feriado, Congresso..."
                      aria-label="Motivo da exceção"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />}
                {isRangeMode ? 'Aplicar ao Período' : 'Criar Exceção'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
