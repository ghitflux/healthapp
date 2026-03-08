'use client';

/**
 * @file features/schedules/schedules-page-content.tsx
 * @description Organism: conteúdo completo da página de agendas.
 * Integra seleção de médico, grade semanal e lista de exceções.
 */

import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBreadcrumb } from '@/components/patterns/page-breadcrumb';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { LoaderIcon, StethoscopeIcon, UsersIcon } from '@/lib/icons';
import { useListDoctors } from '@api/hooks/useDoctors';
import { useListDoctorSchedules, useListScheduleExceptions } from '@api/hooks/useConvenio';
import { useScheduleMutations } from '@/hooks/schedules/use-schedule-mutations';
import { WeeklyScheduleGrid } from './weekly-schedule-grid';
import { ScheduleFormDialog } from './schedule-form-dialog';
import { ScheduleDeleteDialog } from './schedule-delete-dialog';
import { ScheduleExceptionFormDialog } from './schedule-exception-form-dialog';
import { ScheduleExceptionsList } from './schedule-exceptions-list';
import type { DoctorList } from '@api/types/DoctorList';
import type { DoctorSchedule } from '@api/types/DoctorSchedule';
import type { ScheduleException } from '@api/types/ScheduleException';
import type { DoctorScheduleRequest } from '@api/types/DoctorScheduleRequest';
import type { PatchedDoctorScheduleRequest } from '@api/types/PatchedDoctorScheduleRequest';
import type { ScheduleExceptionRequest } from '@api/types/ScheduleExceptionRequest';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { getAuthUserConvenioId } from '@/lib/auth-user';

export function SchedulesPageContent() {
  const convenioId = useAuthStore((state) => getAuthUserConvenioId(state.user));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // Schedule modal state
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<DoctorSchedule | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<DoctorSchedule | null>(null);

  // Exception modal state
  const [exceptionFormOpen, setExceptionFormOpen] = useState(false);
  const [deleteException, setDeleteException] = useState<ScheduleException | null>(null);

  // Fetch doctors for selector
  const doctorsQuery = useListDoctors(
    { convenio: convenioId, page_size: 100 },
    { query: { client: queryClient, enabled: Boolean(convenioId) } }
  );
  const doctors: DoctorList[] = doctorsQuery.data?.data ?? [];

  // Fetch schedules for selected doctor
  const schedulesQuery = useListDoctorSchedules(
    selectedDoctorId ? { page_size: 100 } : undefined,
    { query: { client: queryClient, enabled: !!selectedDoctorId } }
  );
  const schedules: DoctorSchedule[] = schedulesQuery.data?.data ?? [];

  // Filter schedules client-side by selected doctor
  // (API may not support doctor filter param, so we filter locally)
  const filteredSchedules = selectedDoctorId
    ? schedules.filter((s) => s.doctor === selectedDoctorId)
    : [];

  // Fetch exceptions for selected doctor
  const exceptionsQuery = useListScheduleExceptions(
    selectedDoctorId ? { page_size: 100 } : undefined,
    { query: { client: queryClient, enabled: !!selectedDoctorId } }
  );
  const exceptions: ScheduleException[] = exceptionsQuery.data?.data ?? [];

  const filteredExceptions = selectedDoctorId
    ? exceptions.filter((e) => e.doctor === selectedDoctorId)
    : [];

  const mutations = useScheduleMutations();

  // --- Handlers ---
  const handleSelectDoctor = useCallback((doctorId: string) => {
    setSelectedDoctorId((prev) => (prev === doctorId ? null : doctorId));
  }, []);

  const handleAddSchedule = useCallback(() => {
    setEditSchedule(null);
    setScheduleFormOpen(true);
  }, []);

  const handleEditSchedule = useCallback((s: DoctorSchedule) => {
    setEditSchedule(s);
    setScheduleFormOpen(true);
  }, []);

  const handleDeleteSchedulePrompt = useCallback((s: DoctorSchedule) => {
    setDeleteSchedule(s);
  }, []);

  const handleAddException = useCallback(() => {
    setExceptionFormOpen(true);
  }, []);

  const handleDeleteExceptionPrompt = useCallback((exc: ScheduleException) => {
    setDeleteException(exc);
  }, []);

  async function handleScheduleSubmit(data: DoctorScheduleRequest | PatchedDoctorScheduleRequest) {
    if (!selectedDoctorId) return;
    if (editSchedule) {
      await mutations.patchSchedule(editSchedule.id, data);
      setEditSchedule(null);
    } else {
      await mutations.createSchedule({ ...(data as DoctorScheduleRequest), doctor: selectedDoctorId });
    }
    setScheduleFormOpen(false);
  }

  async function handleScheduleDeleteConfirm() {
    if (!deleteSchedule) return;
    await mutations.deleteSchedule(deleteSchedule.id);
    setDeleteSchedule(null);
  }

  async function handleExceptionSubmit(data: ScheduleExceptionRequest) {
    if (!selectedDoctorId) return;
    await mutations.createException({ ...data, doctor: selectedDoctorId });
    setExceptionFormOpen(false);
  }

  async function handleExceptionRangeSubmit(
    startDate: string,
    endDate: string,
    data: Omit<ScheduleExceptionRequest, 'date'>
  ) {
    if (!selectedDoctorId) return;

    // Generate all dates in range and create an exception for each
    const start = new Date(startDate);
    const end = new Date(endDate);
    const promises: Promise<unknown>[] = [];

    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]!;
      promises.push(
        mutations.createException({ ...data, doctor: selectedDoctorId, date: dateStr })
      );
      current.setDate(current.getDate() + 1);
    }

    await Promise.all(promises);
    setExceptionFormOpen(false);
  }

  async function handleExceptionDeleteConfirm() {
    if (!deleteException) return;
    await mutations.deleteException(deleteException.id);
    setDeleteException(null);
  }

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) ?? null;

  return (
    <>
      {/* Page header */}
      <div className="mb-6 space-y-4">
        <PageBreadcrumb />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agendas Médicas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os horários semanais e exceções de agenda dos médicos.
          </p>
        </div>
      </div>

      <div className="grid min-h-[600px] gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
        {/* Left column — Doctor selector */}
        <div className="min-w-0 xl:sticky xl:top-0">
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Médicos</span>
              </div>
            </div>

            {doctorsQuery.isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : doctorsQuery.isError ? (
              <ErrorStateBlock
                title="Erro ao carregar médicos"
                message="Tente novamente."
                onRetry={() => doctorsQuery.refetch()}
                className="py-8"
              />
            ) : doctors.length === 0 ? (
              <EmptyStateBlock
                icon={StethoscopeIcon}
                title="Nenhum médico"
                description="Cadastre médicos primeiro."
                className="py-8"
              />
            ) : (
              <ScrollArea className="h-[280px] xl:h-[calc(100vh-280px)]">
                <div className="p-2 space-y-1">
                  {doctors.map((doctor) => {
                    const isSelected = doctor.id === selectedDoctorId;
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => handleSelectDoctor(doctor.id)}
                        className={`group w-full rounded-md px-3 py-2.5 text-left transition-[background-color,color,transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'hover:bg-muted motion-safe:hover:translate-x-[2px]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isSelected
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {doctor.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm font-medium truncate ${
                                isSelected ? 'text-primary-foreground' : 'text-foreground'
                              }`}
                            >
                              {doctor.user_name}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                isSelected
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {doctor.specialty}
                            </div>
                          </div>
                        </div>
                        {doctor.is_available === false && (
                          <Badge
                            variant="secondary"
                            className={`mt-1 text-[10px] px-1 py-0 ${
                              isSelected ? 'opacity-70' : ''
                            }`}
                          >
                            Indisponível
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Right column — Schedule grid + exceptions */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Selected doctor info bar */}
          {selectedDoctor && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5">
              <StethoscopeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm">{selectedDoctor.user_name}</span>
              <span className="text-sm text-muted-foreground">{selectedDoctor.specialty}</span>
              {schedulesQuery.isFetching && (
                <LoaderIcon className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />
              )}
            </div>
          )}

          {/* Weekly grid */}
          <section>
            <WeeklyScheduleGrid
              schedules={filteredSchedules}
              isLoading={!!selectedDoctorId && schedulesQuery.isLoading}
              selectedDoctorId={selectedDoctorId}
              onAdd={handleAddSchedule}
              onEdit={handleEditSchedule}
              onDelete={handleDeleteSchedulePrompt}
            />
          </section>

          {/* Separator + Exceptions section */}
          {selectedDoctorId && (
            <>
              <Separator />
              <section className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">Exceções de Agenda</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bloqueios, férias e feriados que sobrepõem a agenda regular.
                  </p>
                </div>
                <ScheduleExceptionsList
                  exceptions={filteredExceptions}
                  isLoading={exceptionsQuery.isLoading}
                  isError={exceptionsQuery.isError}
                  onRetry={() => exceptionsQuery.refetch()}
                  onDelete={handleDeleteExceptionPrompt}
                  onAdd={handleAddException}
                />
              </section>
            </>
          )}
        </div>
      </div>

      {/* Schedule form dialog */}
      {selectedDoctorId && (
        <ScheduleFormDialog
          open={scheduleFormOpen}
          onClose={() => {
            setScheduleFormOpen(false);
            setEditSchedule(null);
          }}
          schedule={editSchedule}
          doctorId={selectedDoctorId}
          onSubmit={handleScheduleSubmit}
          isSubmitting={mutations.isCreatingSchedule || mutations.isPatchingSchedule}
        />
      )}

      {/* Schedule delete dialog */}
      <ScheduleDeleteDialog
        open={!!deleteSchedule}
        onClose={() => setDeleteSchedule(null)}
        schedule={deleteSchedule}
        onConfirm={handleScheduleDeleteConfirm}
        isDeleting={mutations.isDeletingSchedule}
      />

      {/* Exception form dialog */}
      {selectedDoctorId && (
        <ScheduleExceptionFormDialog
          open={exceptionFormOpen}
          onClose={() => setExceptionFormOpen(false)}
          doctorId={selectedDoctorId}
          onSubmit={handleExceptionSubmit}
          isSubmitting={mutations.isCreatingException}
          onSubmitRange={handleExceptionRangeSubmit}
        />
      )}

      {/* Exception delete dialog */}
      <AlertDialog
        open={!!deleteException}
        onOpenChange={(v) => !v && setDeleteException(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Exceção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a exceção do dia{' '}
              <strong>
                {deleteException?.date
                  ? new Date(deleteException.date + 'T00:00:00').toLocaleDateString('pt-BR')
                  : ''}
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.isDeletingException}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleExceptionDeleteConfirm();
              }}
              disabled={mutations.isDeletingException}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {mutations.isDeletingException && (
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
