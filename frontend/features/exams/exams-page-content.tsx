'use client';

/**
 * @file features/exams/exams-page-content.tsx
 * @description Conteúdo completo da página de exames: CRUD de tipos + tabela de preços.
 */

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { CrudTableTemplate } from '@/components/templates/crud-table-template';
import { DataTableToolbar } from '@/components/patterns/data-table-toolbar';
import { ExamTypesTable } from './exam-types-table';
import { ExamTypeFormDialog } from './exam-type-form-dialog';
import { ExamTypeDeleteDialog } from './exam-type-delete-dialog';
import { PricingTable } from './pricing-table';
import { useExamTypesList } from '@/hooks/exams/use-exam-types-list';
import { useExamTypeMutations } from '@/hooks/exams/use-exam-type-mutations';
import { useDoctorsList } from '@/hooks/doctors/use-doctors-list';
import { useDoctorMutations } from '@/hooks/doctors/use-doctor-mutations';
import type { ExamType } from '@api/types/ExamType';
import type { ExamTypeRequest } from '@api/types/ExamTypeRequest';
import type { PatchedExamTypeRequest } from '@api/types/PatchedExamTypeRequest';
import { useAuthStore } from '@/stores/auth-store';

export function ExamsPageContent() {
  const convenioId = useAuthStore((s) => s.user?.convenio_id ?? '');
  const [createOpen, setCreateOpen] = useState(false);
  const [editExamType, setEditExamType] = useState<ExamType | null>(null);
  const [deleteExamType, setDeleteExamType] = useState<ExamType | null>(null);

  const list = useExamTypesList(convenioId);
  const mutations = useExamTypeMutations();

  // For pricing table
  const doctorList = useDoctorsList({ convenio: convenioId });
  const doctorMutations = useDoctorMutations();

  const handleCreate = useCallback(() => setCreateOpen(true), []);
  const handleEdit = useCallback((et: ExamType) => setEditExamType(et), []);
  const handleDeletePrompt = useCallback((et: ExamType) => setDeleteExamType(et), []);

  async function handleFormSubmit(data: ExamTypeRequest | PatchedExamTypeRequest) {
    if (editExamType) {
      await mutations.patchExamType(editExamType.id, data);
      setEditExamType(null);
    } else {
      await mutations.createExamType(data as ExamTypeRequest);
      setCreateOpen(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteExamType) return;
    await mutations.deleteExamType(deleteExamType.id);
    setDeleteExamType(null);
  }

  async function handlePatchDoctorPrice(id: string, price: string) {
    await doctorMutations.patchDoctor(id, { consultation_price: price });
  }

  async function handlePatchExamTypePrice(id: string, price: string) {
    await mutations.patchExamType(id, { price });
  }

  return (
    <Tabs defaultValue="exams">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exames e Preços</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie tipos de exame e a tabela de preços do convênio.
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="exams">Tipos de Exame</TabsTrigger>
          <TabsTrigger value="pricing">Tabela de Preços</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="exams" className="mt-0">
        <CrudTableTemplate
          title=""
          createLabel="Novo Tipo de Exame"
          onCreate={handleCreate}
          toolbar={
            <DataTableToolbar
              searchValue={list.search}
              onSearch={list.handleSearch}
              searchPlaceholder="Buscar por nome do exame..."
            />
          }
          table={
            <ExamTypesTable
              examTypes={list.examTypes}
              isLoading={list.isLoading}
              isError={list.isError}
              onRetry={list.refetch}
              onEdit={handleEdit}
              onDelete={handleDeletePrompt}
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
                      className={list.page >= list.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : undefined
          }
        />
      </TabsContent>

      <TabsContent value="pricing" className="mt-0">
        <PricingTable
          doctors={doctorList.doctors}
          examTypes={list.examTypes}
          isLoadingDoctors={doctorList.isLoading}
          isLoadingExams={list.isLoading}
          onPatchDoctor={handlePatchDoctorPrice}
          onPatchExamType={handlePatchExamTypePrice}
        />
      </TabsContent>

      {/* Modais */}
      <ExamTypeFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        convenioId={convenioId}
        onSubmit={handleFormSubmit}
        isSubmitting={mutations.isCreating}
      />
      <ExamTypeFormDialog
        open={!!editExamType}
        onClose={() => setEditExamType(null)}
        examType={editExamType}
        convenioId={convenioId}
        onSubmit={handleFormSubmit}
        isSubmitting={mutations.isPatching}
      />
      <ExamTypeDeleteDialog
        open={!!deleteExamType}
        onClose={() => setDeleteExamType(null)}
        examType={deleteExamType}
        onConfirm={handleDeleteConfirm}
        isDeleting={mutations.isDeleting}
      />
    </Tabs>
  );
}
