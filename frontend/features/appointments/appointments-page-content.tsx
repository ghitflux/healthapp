'use client';

/**
 * @file features/appointments/appointments-page-content.tsx
 * @description Organism: conteudo completo da página de agendamentos da clínica.
 * Integra listagem, toolbar, paginação, drawer e dialogs de ação.
 */

import { useState, useCallback } from 'react';
import { CrudTableTemplate } from '@/components/templates/crud-table-template';
import { TablePagination } from '@/components/patterns/table-pagination';
import { AppointmentsToolbar } from './appointments-toolbar';
import { AppointmentsTable } from './appointments-table';
import { AppointmentDetailDrawer } from './appointment-detail-drawer';
import { AppointmentCancelDialog } from './appointment-cancel-dialog';
import { AppointmentCompleteDialog } from './appointment-complete-dialog';
import { AppointmentNoShowDialog } from './appointment-noshow-dialog';
import { ActionConfirmationDialog } from '@/components/patterns/action-confirmation-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppointmentsList } from '@/hooks/appointments/use-appointments-list';
import { useAppointmentMutations } from '@/hooks/appointments/use-appointment-mutations';
import { InfoIcon } from '@/lib/icons';
import type { AppointmentList } from '@api/types/AppointmentList';

export function AppointmentsPageContent() {
  const list = useAppointmentsList();
  const mutations = useAppointmentMutations();

  // Detail drawer
  const [viewId, setViewId] = useState<string | null>(null);
  // Action dialogs
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [startId, setStartId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [noShowId, setNoShowId] = useState<string | null>(null);

  const handleView = useCallback((apt: AppointmentList) => setViewId(apt.id), []);
  const handleCancelPrompt = useCallback((apt: AppointmentList) => setCancelId(apt.id), []);
  const handleStartPrompt = useCallback((apt: AppointmentList) => setStartId(apt.id), []);
  const handleCompletePrompt = useCallback((apt: AppointmentList) => setCompleteId(apt.id), []);
  const handleNoShowPrompt = useCallback((apt: AppointmentList) => setNoShowId(apt.id), []);

  async function handleCancel(reason?: string) {
    if (!cancelId) return;
    await mutations.cancelAppointment(cancelId, reason);
    setCancelId(null);
  }

  async function handleStart() {
    if (!startId) return;
    await mutations.startAppointment(startId);
    setStartId(null);
  }

  async function handleComplete(notes?: string) {
    if (!completeId) return;
    await mutations.completeAppointment(completeId, notes);
    setCompleteId(null);
  }

  async function handleNoShow(reason?: string) {
    if (!noShowId) return;
    await mutations.markNoShow(noShowId, reason);
    setNoShowId(null);
  }

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Fila operacional da clínica</AlertTitle>
        <AlertDescription>
          Consultas e exames aparecem aqui somente após confirmação do pagamento no app. Agendamentos aguardando PIX ficam fora desta fila.
        </AlertDescription>
      </Alert>

      <CrudTableTemplate
        title="Agendamentos"
        description="Gerencie os atendimentos liberados para a clínica após confirmação do pagamento."
        toolbar={
          <AppointmentsToolbar
            search={list.search}
            onSearchChange={list.handleSearch}
            status={list.status}
            onStatusChange={list.handleStatus}
            appointmentType={list.appointmentType}
            onTypeChange={list.handleType}
            dateFrom={list.dateFrom}
            dateTo={list.dateTo}
            onDateFromChange={list.handleDateFrom}
            onDateToChange={list.handleDateTo}
            ordering={list.ordering}
            onOrderingChange={list.handleOrdering}
            activeFilterCount={list.activeFilterCount}
            onResetFilters={list.handleResetFilters}
          />
        }
        table={
          <AppointmentsTable
            appointments={list.appointments}
            isLoading={list.isLoading}
            isError={list.isError}
            onRetry={list.refetch}
            onView={handleView}
            onCancel={handleCancelPrompt}
            onStart={handleStartPrompt}
            onComplete={handleCompletePrompt}
            onNoShow={handleNoShowPrompt}
          />
        }
        pagination={
          <TablePagination
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
          />
        }
      />

      {/* Detail drawer */}
      <AppointmentDetailDrawer
        appointmentId={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
        onCancel={(id) => { setViewId(null); setCancelId(id); }}
        onStart={(id) => { setViewId(null); setStartId(id); }}
        onComplete={(id) => { setViewId(null); setCompleteId(id); }}
        onNoShow={(id) => { setViewId(null); setNoShowId(id); }}
      />

      {/* Start dialog */}
      <ActionConfirmationDialog
        open={!!startId}
        onClose={() => setStartId(null)}
        title="Iniciar Consulta"
        description="Confirme o início da consulta."
        confirmLabel="Iniciar"
        onConfirm={handleStart}
        isLoading={mutations.isStarting}
      />

      {/* Cancel dialog */}
      <AppointmentCancelDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        isLoading={mutations.isCancelling}
      />

      {/* Complete dialog */}
      <AppointmentCompleteDialog
        open={!!completeId}
        onClose={() => setCompleteId(null)}
        onConfirm={handleComplete}
        isLoading={mutations.isCompleting}
      />

      {/* No-show dialog */}
      <AppointmentNoShowDialog
        open={!!noShowId}
        onClose={() => setNoShowId(null)}
        onConfirm={handleNoShow}
        isLoading={mutations.isMarkingNoShow}
      />
    </div>
  );
}
