'use client';

/**
 * @file features/doctors/doctor-form-dialog.tsx
 * @description Modal de criação/edição de médico usando RHF + Zod gerado.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod/v4';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { DecimalInput } from '@/components/ui/decimal-input';
import { Input } from '@/components/ui/input';
import { IntegerInput } from '@/components/ui/integer-input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/lib/icons';
import { useGetDoctorById } from '@api/hooks/useDoctors';
import { doctorRequestSchema } from '@api/zod/doctorRequestSchema';
import { patchedDoctorRequestSchema } from '@api/zod/patchedDoctorRequestSchema';
import type { Doctor } from '@api/types/Doctor';
import type { DoctorList } from '@api/types/DoctorList';
import { normalizeIntegerInput } from '@/lib/input-masks';
import { queryClient } from '@/lib/query-client';

type CreateValues = z.infer<typeof doctorRequestSchema>;
type PatchValues = z.infer<typeof patchedDoctorRequestSchema>;

interface DoctorFormDialogProps {
  open: boolean;
  onClose: () => void;
  doctor?: DoctorList | null;
  convenioId: string;
  onSubmit: (data: CreateValues | PatchValues) => Promise<void>;
  isSubmitting: boolean;
}

type DoctorFormSeed = Partial<Doctor & DoctorList> | null | undefined;

function buildDefaultValues(convenioId: string, doctor?: DoctorFormSeed) {
  return {
    user: typeof doctor?.user === 'string' ? doctor.user : '',
    convenio: typeof doctor?.convenio === 'string' ? doctor.convenio : convenioId,
    crm: typeof doctor?.crm === 'string' ? doctor.crm : '',
    crm_state: typeof doctor?.crm_state === 'string' ? doctor.crm_state : '',
    specialty: typeof doctor?.specialty === 'string' ? doctor.specialty : '',
    subspecialties: Array.isArray(doctor?.subspecialties) ? doctor.subspecialties : [],
    bio: typeof doctor?.bio === 'string' ? doctor.bio : '',
    consultation_duration:
      typeof doctor?.consultation_duration === 'number' ? doctor.consultation_duration : 30,
    consultation_price:
      typeof doctor?.consultation_price === 'string' ? doctor.consultation_price : '',
    is_available: typeof doctor?.is_available === 'boolean' ? doctor.is_available : true,
  };
}

export function DoctorFormDialog({
  open,
  onClose,
  doctor,
  convenioId,
  onSubmit,
  isSubmitting,
}: DoctorFormDialogProps) {
  const isEdit = !!doctor;
  const doctorDetailQuery = useGetDoctorById(doctor?.id ?? '', {
    query: {
      client: queryClient,
      enabled: open && isEdit && !!doctor?.id,
      staleTime: 1000 * 60 * 5,
    },
  });
  const resolvedDoctor = doctorDetailQuery.data ?? doctor ?? undefined;

  const form = useForm<CreateValues>({
    resolver: zodResolver(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (isEdit ? patchedDoctorRequestSchema : doctorRequestSchema) as any
    ),
    defaultValues: buildDefaultValues(convenioId),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(convenioId, resolvedDoctor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, convenioId, resolvedDoctor]);

  async function handleSubmit(values: CreateValues | PatchValues) {
    await onSubmit(values);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Médico' : 'Novo Médico'}</DialogTitle>
          <DialogDescription>
            O médico fica vinculado automaticamente a clínica atual. Os atendimentos entram no painel após pagamento confirmado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {isEdit && doctorDetailQuery.isLoading && (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                Carregando dados completos do médico...
              </div>
            )}

            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Este cadastro permanece vinculado a clínica atual e não depende de ajuste no app mobile.
            </div>

            {!isEdit && (
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UUID do Usuário</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UUID do usuário vinculado"
                        aria-label="UUID do Usuário"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="crm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRM</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 123456"
                        aria-label="CRM"
                        {...field}
                        onChange={(event) =>
                          field.onChange(normalizeIntegerInput(event.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crm_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SP"
                        maxLength={2}
                        aria-label="Estado do CRM"
                        {...field}
                        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Cardiologia"
                      aria-label="Especialidade"
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
                name="consultation_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <IntegerInput
                        aria-label="Duração da consulta em minutos"
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consultation_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Consulta (R$)</FormLabel>
                    <FormControl>
                      <DecimalInput
                        placeholder="0,00"
                        aria-label="Preço da consulta"
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição do médico..."
                      rows={3}
                      aria-label="Biografia do médico"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border bg-muted/20 px-4 py-3">
                  <FormLabel className="cursor-pointer">Disponível para agendamento</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      aria-label="Disponível para agendamento"
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
                {isEdit ? 'Salvar' : 'Criar Médico'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
