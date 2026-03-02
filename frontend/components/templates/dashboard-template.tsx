/**
 * @file components/templates/dashboard-template.tsx
 * @description Template — Layout padrão de páginas de dashboard.
 * Compõe PageHeader + grid de KPIs + seções de gráficos + tabelas.
 */

import { cn } from '@/lib/utils';

export interface DashboardTemplateProps {
  /** Título da página */
  title: string;
  /** Subtítulo/descrição */
  description?: string;
  /** Ações do header (ex: botão de refresh) */
  headerActions?: React.ReactNode;
  /** Linha de KPI cards */
  kpis?: React.ReactNode;
  /** Linha de gráficos (normalmente 2 colunas) */
  charts?: React.ReactNode;
  /** Linha de tabelas/listas (normalmente 2 colunas) */
  tables?: React.ReactNode;
  /** Conteúdo extra abaixo */
  extra?: React.ReactNode;
  className?: string;
}

export function DashboardTemplate({
  title,
  description,
  headerActions,
  kpis,
  charts,
  tables,
  extra,
  className,
}: DashboardTemplateProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
        )}
      </div>

      {/* KPIs */}
      {kpis && <section aria-label="Indicadores">{kpis}</section>}

      {/* Charts */}
      {charts && (
        <section
          aria-label="Gráficos"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {charts}
        </section>
      )}

      {/* Tables / Lists */}
      {tables && (
        <section
          aria-label="Dados detalhados"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {tables}
        </section>
      )}

      {/* Extra content */}
      {extra && <section aria-label="Informações adicionais">{extra}</section>}
    </div>
  );
}
