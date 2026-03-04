'use client';

/**
 * @file features/exams/exam-type-form-dialog.tsx
 * @description Modal criar/editar tipo de exame — RHF + Zod gerado.
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/lib/icons';
import { examTypeRequestSchema } from '@api/zod/examTypeRequestSchema';
import type { ExamType } from '@api/types/ExamType';

type FormValues = z.infer<typeof examTypeRequestSchema>;

interface ExamTypeFormDialogProps {
  open: boolean;
  onClose: () => void;
  examType?: ExamType | null;
  convenioId: string;
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function ExamTypeFormDialog({
  open,
  onClose,
  examType,
  convenioId,
  onSubmit,
  isSubmitting,
}: ExamTypeFormDialogProps) {
  const isEdit = !!examType;

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(examTypeRequestSchema as any),
    defaultValues: {
      convenio: examType?.convenio ?? convenioId,
      name: examType?.name ?? '',
      description: examType?.description ?? '',
      preparation: examType?.preparation ?? '',
      duration_minutes: examType?.duration_minutes ?? 30,
      price: examType?.price ?? '0.00',
      is_active: examType?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        convenio: examType?.convenio ?? convenioId,
        name: examType?.name ?? '',
        description: examType?.description ?? '',
        preparation: examType?.preparation ?? '',
        duration_minutes: examType?.duration_minutes ?? 30,
        price: examType?.price ?? '0.00',
        is_active: examType?.is_active ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, examType, convenioId]);

  async function handleSubmit(values: FormValues) {
    await onSubmit(values);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tipo de Exame' : 'Novo Tipo de Exame'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Hemograma Completo" aria-label="Nome do exame" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do exame..."
                      rows={2}
                      aria-label="Descrição do exame"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preparation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preparo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instruções de preparo para o paciente..."
                      rows={2}
                      aria-label="Instruções de preparo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        aria-label="Duração em minutos"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        aria-label="Preço do exame"
                        {...field}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (parseFloat(v) < 0) return;
                          field.onChange(v);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
                  <FormLabel className="cursor-pointer">Ativo</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      aria-label="Exame ativo"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Salvar' : 'Criar Exame'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
