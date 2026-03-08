'use client';

import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { SkeletonTable } from '@/components/patterns/skeleton-table';
import { BookableServicesSection } from '@/features/settings/bookable-services-section';
import type { BookableService } from '@/features/settings/convenio-settings';

interface PricingTableProps {
  services: BookableService[];
  isLoading: boolean;
  isError: boolean;
  isSubmitting: boolean;
  onSave: (services: BookableService[]) => Promise<void>;
}

export function PricingTable({
  services,
  isLoading,
  isError,
  isSubmitting,
  onSave,
}: PricingTableProps) {
  if (isLoading) {
    return <SkeletonTable rows={6} columns={7} />;
  }

  if (isError) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar serviços"
        message="Não foi possível carregar o catálogo comercial do convênio."
      />
    );
  }

  return (
    <BookableServicesSection
      services={services}
      onSave={onSave}
      isSubmitting={isSubmitting}
      title="Tabela comercial do app"
      description="Cadastre consultas, exames e retornos com preço, repasse e comissão sem depender do cadastro de médicos."
    />
  );
}
