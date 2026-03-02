/**
 * @file components/patterns/error-state-block.tsx
 * @description Molécula — Estado de erro padronizado com botão de retry.
 * Localização canônica no design system.
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, RefreshIcon } from '@/lib/icons';

export interface ErrorStateBlockProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorStateBlock({
  title = 'Erro ao carregar dados',
  message = 'Ocorreu um erro inesperado. Tente novamente.',
  onRetry,
  className,
}: ErrorStateBlockProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className
      )}
      role="alert"
    >
      <div className="mb-4 rounded-full bg-danger-50 dark:bg-danger-900/20 p-4">
        <AlertCircleIcon className="h-8 w-8 text-danger-500" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshIcon className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
