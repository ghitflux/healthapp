'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorStateBlock } from '@/components/patterns/error-state-block';
import { PageBreadcrumb } from '@/components/patterns/page-breadcrumb';
import { useConvenioSettings } from '@/hooks/settings/use-convenio-settings';
import { ConvenioInfoForm } from './convenio-info-form';
import { CancellationPolicySection } from './cancellation-policy-section';

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

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError || !convenio) {
    return (
      <ErrorStateBlock
        title="Erro ao carregar configuracoes"
        message="Nao foi possivel carregar os dados do convenio."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajuste dados cadastrais e politicas operacionais do convenio.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Informacoes Gerais</TabsTrigger>
          <TabsTrigger value="cancellation">Politica de Cancelamento</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <ConvenioInfoForm
            convenio={convenio}
            onSubmit={patchSettings}
            isSubmitting={isPatching}
          />
        </TabsContent>

        <TabsContent value="cancellation" className="mt-0">
          <CancellationPolicySection
            settings={(convenio.settings as Record<string, unknown>) ?? {}}
            onSave={patchSettings}
            isSubmitting={isPatching}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
