/**
 * @file components/templates/crud-table-template.tsx
 * @description Template — Layout padrão de páginas de CRUD com tabela.
 * Compõe PageHeader + DataTableToolbar + Table + Pagination.
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/lib/icons';
import { PageBreadcrumb } from '@/components/patterns/page-breadcrumb';

export interface CrudTableTemplateProps {
  /** Título da página */
  title: string;
  description?: string;
  /** Label do botão de criar novo item */
  createLabel?: string;
  /** Callback do botão de criar */
  onCreate?: () => void;
  /** Toolbar (DataTableToolbar) */
  toolbar?: React.ReactNode;
  /** Tabela de dados */
  table: React.ReactNode;
  /** Páginação */
  pagination?: React.ReactNode;
  /** Slots extras (modais, etc.) */
  extras?: React.ReactNode;
  className?: string;
}

export function CrudTableTemplate({
  title,
  description,
  createLabel = 'Novo',
  onCreate,
  toolbar,
  table,
  pagination,
  extras,
  className,
}: CrudTableTemplateProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageBreadcrumb />

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {onCreate && (
          <Button onClick={onCreate} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            {createLabel}
          </Button>
        )}
      </div>

      {/* Toolbar */}
      {toolbar && <div>{toolbar}</div>}

      {/* Table */}
      <div>{table}</div>

      {/* Pagination */}
      {pagination && <div className="flex justify-center">{pagination}</div>}

      {/* Extras (modais, drawers) */}
      {extras}
    </div>
  );
}
