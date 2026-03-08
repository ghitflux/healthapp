'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { PageBreadcrumb } from '@/components/patterns/page-breadcrumb';
import { useConvenioSettings } from '@/hooks/settings/use-convenio-settings';
import { ConvenioInfoForm } from './convenio-info-form';
import { CancellationPolicySection } from './cancellation-policy-section';
import { BookingOperationsSection } from './booking-operations-section';
import { BookableServicesSection } from './bookable-services-section';
import {
  normalizeBookableServices,
  toConvenioSettingsRecord,
} from './convenio-settings';

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="h-96 animate-pulse rounded-xl border bg-muted/30" />
    </div>
  );
}

export function SettingsPageContent() {
  const { convenio, isLoading, isError, refetch, patchSettings, isPatching } = useConvenioSettings();
  const settings = toConvenioSettingsRecord(convenio?.settings);
  const services = normalizeBookableServices(settings);

  async function handleSaveServices(nextServices: ReturnType<typeof normalizeBookableServices>) {
    await patchSettings({
      settings: {
        ...settings,
        bookable_services: nextServices,
      },
    });
  }

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError || !convenio) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar configurações"
        message="Não foi possível carregar os dados do convênio."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações da Clínica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajuste dados cadastrais, regras do app e o catálogo comercial usado pelo agendamento.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start rounded-2xl border border-border/80 bg-muted/75 p-1.5 shadow-xs">
          <TabsTrigger value="general">Informações Gerais</TabsTrigger>
          <TabsTrigger value="booking">Agendamento e Operação</TabsTrigger>
          <TabsTrigger value="services">Serviços e Comissões</TabsTrigger>
          <TabsTrigger value="cancellation">Política de Cancelamento</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <ConvenioInfoForm
            convenio={convenio}
            onSubmit={patchSettings}
            isSubmitting={isPatching}
          />
        </TabsContent>

        <TabsContent value="booking" className="mt-0">
          <BookingOperationsSection
            settings={settings}
            onSave={patchSettings}
            isSubmitting={isPatching}
          />
        </TabsContent>

        <TabsContent value="services" className="mt-0">
          <BookableServicesSection
            services={services}
            onSave={handleSaveServices}
            isSubmitting={isPatching}
          />
        </TabsContent>

        <TabsContent value="cancellation" className="mt-0">
          <CancellationPolicySection
            settings={settings}
            onSave={patchSettings}
            isSubmitting={isPatching}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
