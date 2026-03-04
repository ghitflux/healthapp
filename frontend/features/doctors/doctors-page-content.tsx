'use client';

/**
 * @file features/doctors/doctors-page-content.tsx
 * @description Organism: conteúdo completo da página de médicos.
 * Integra listagem, toolbar, paginação, modais CRUD.
 */

import { useState, useCallback } from 'react';
import { CrudTableTemplate } from '@/components/templates/crud-table-template';
import { DoctorsToolbar } from './doctors-toolbar';
import { DoctorsTable } from './doctors-table';
import { DoctorFormDialog } from './doctor-form-dialog';
import { DoctorDeleteDialog } from './doctor-delete-dialog';
import { DoctorDetailDrawer } from './doctor-detail-drawer';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useDoctorsList } from '@/hooks/doctors/use-doctors-list';
import { useDoctorMutations } from '@/hooks/doctors/use-doctor-mutations';
import { useAuthStore } from '@/stores/auth-store';
import type { DoctorList } from '@api/types/DoctorList';
import type { DoctorRequest } from '@api/types/DoctorRequest';
import type { PatchedDoctorRequest } from '@api/types/PatchedDoctorRequest';

export function DoctorsPageContent() {
  const convenioId = useAuthStore((s) => s.user?.convenio_id ?? '');
  const [createOpen, setCreateOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<DoctorList | null>(null);
  const [deleteDoctor, setDeleteDoctor] = useState<DoctorList | null>(null);
  const [viewDoctor, setViewDoctor] = useState<DoctorList | null>(null);

  const list = useDoctorsList({ convenio: convenioId });
  const mutations = useDoctorMutations();

  const handleCreate = useCallback(() => setCreateOpen(true), []);
  const handleEdit = useCallback((d: DoctorList) => setEditDoctor(d), []);
  const handleDeletePrompt = useCallback((d: DoctorList) => setDeleteDoctor(d), []);
  const handleView = useCallback((d: DoctorList) => setViewDoctor(d), []);

  async function handleFormSubmit(data: DoctorRequest | PatchedDoctorRequest) {
    if (editDoctor) {
      await mutations.patchDoctor(editDoctor.id, data);
      setEditDoctor(null);
    } else {
      await mutations.createDoctor(data as DoctorRequest);
      setCreateOpen(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteDoctor) return;
    await mutations.deleteDoctor(deleteDoctor.id);
    setDeleteDoctor(null);
  }

  return (
    <>
      <CrudTableTemplate
        title="Médicos"
        description="Gerencie os médicos do seu convênio"
        createLabel="Novo Médico"
        onCreate={handleCreate}
        toolbar={
          <DoctorsToolbar
            search={list.search}
            onSearch={list.handleSearch}
            isAvailable={list.isAvailable}
            onAvailability={list.handleAvailability}
            ordering={list.ordering}
            onOrdering={list.handleOrdering}
          />
        }
        table={
          <DoctorsTable
            doctors={list.doctors}
            isLoading={list.isLoading}
            isError={list.isError}
            onRetry={list.refetch}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
            onView={handleView}
            onCreate={handleCreate}
          />
        }
        pagination={
          list.totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => list.setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={list.page <= 1}
                    className={list.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm px-3 py-2">
                    Página {list.page} de {list.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => list.setPage((p) => Math.min(list.totalPages, p + 1))}
                    aria-disabled={list.page >= list.totalPages}
                    className={
                      list.page >= list.totalPages ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : undefined
        }
      />

      {/* Modal criar */}
      <DoctorFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        convenioId={convenioId}
        onSubmit={handleFormSubmit}
        isSubmitting={mutations.isCreating}
      />

      {/* Modal editar */}
      <DoctorFormDialog
        open={!!editDoctor}
        onClose={() => setEditDoctor(null)}
        doctor={editDoctor}
        convenioId={convenioId}
        onSubmit={handleFormSubmit}
        isSubmitting={mutations.isPatching}
      />

      {/* Dialog excluir */}
      <DoctorDeleteDialog
        open={!!deleteDoctor}
        onClose={() => setDeleteDoctor(null)}
        doctor={deleteDoctor}
        onConfirm={handleDeleteConfirm}
        isDeleting={mutations.isDeleting}
      />

      {/* Drawer detalhes */}
      <DoctorDetailDrawer
        open={!!viewDoctor}
        onClose={() => setViewDoctor(null)}
        doctor={viewDoctor}
      />
    </>
  );
}
