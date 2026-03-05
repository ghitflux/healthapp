'use client';

/**
 * @file features/schedules/schedule-form-dialog.tsx
 * @description Modal de criação/edição de DoctorSchedule usando RHF + Zod gerado.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod/v4';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { IntegerInput } from '@/components/ui/integer-input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/lib/icons';
import { doctorScheduleRequestSchema } from '@api/zod/doctorScheduleRequestSchema';
import { patchedDoctorScheduleRequestSchema } from '@api/zod/patchedDoctorScheduleRequestSchema';
import type { DoctorSchedule } from '@api/types/DoctorSchedule';

type CreateValues = z.infer<typeof doctorScheduleRequestSchema>;
type PatchValues = z.infer<typeof patchedDoctorScheduleRequestSchema>;

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Segunda-feira' },
  { value: 1, label: 'Terça-feira' },
  { value: 2, label: 'Quarta-feira' },
  { value: 3, label: 'Quinta-feira' },
  { value: 4, label: 'Sexta-feira' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

interface ScheduleFormDialogProps {
  open: boolean;
  onClose: () => void;
  schedule?: DoctorSchedule | null;
  doctorId: string;
  onSubmit: (data: CreateValues | PatchValues) => Promise<void>;
  isSubmitting: boolean;
}

export function ScheduleFormDialog({
  open,
  onClose,
  schedule,
  doctorId,
  onSubmit,
  isSubmitting,
}: ScheduleFormDialogProps) {
  const isEdit = !!schedule;

  const form = useForm<CreateValues>({
    resolver: zodResolver(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (isEdit ? patchedDoctorScheduleRequestSchema : doctorScheduleRequestSchema) as any
    ),
    defaultValues: {
      doctor: doctorId,
      weekday: schedule?.weekday ?? 0,
      start_time: schedule?.start_time ?? '',
      end_time: schedule?.end_time ?? '',
      slot_duration: schedule?.slot_duration ?? 30,
      is_active: schedule?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        doctor: doctorId,
        weekday: schedule?.weekday ?? 0,
        start_time: schedule?.start_time ?? '',
        end_time: schedule?.end_time ?? '',
        slot_duration: schedule?.slot_duration ?? 30,
        is_active: schedule?.is_active ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schedule, doctorId]);

  async function handleSubmit(values: CreateValues) {
    const startTime = values.start_time ?? '';
    const endTime = values.end_time ?? '';

    if (startTime && endTime && endTime <= startTime) {
      form.setError('end_time', {
        message: 'O horário de término deve ser posterior ao de início.',
      });
      return;
    }

    await onSubmit(values);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Horário' : 'Novo Horário'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Weekday */}
            <FormField
              control={form.control}
              name="weekday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia da Semana</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Dia da semana">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WEEKDAY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time range */}
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
                        {...field}
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Slot duration */}
            <FormField
              control={form.control}
              name="slot_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração do Slot (min)</FormLabel>
                  <FormControl>
                    <IntegerInput
                      aria-label="Duração do slot em minutos"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is active */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border bg-muted/20 px-4 py-3">
                  <FormLabel className="cursor-pointer">Horário Ativo</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      aria-label="Horário ativo"
                    />
                  </FormControl>
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
                {isEdit ? 'Salvar' : 'Criar Horário'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
