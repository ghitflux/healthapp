/**
 * @file components/patterns/form-actions-bar.tsx
 * @description Molécula — Barra de ações de formulário (cancelar / salvar).
 */

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoaderIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface FormActionsBarProps {
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  /** Layout inline (lado a lado) ou separado com borda */
  variant?: 'inline' | 'footer';
  className?: string;
}

export function FormActionsBar({
  onCancel,
  cancelLabel = 'Cancelar',
  submitLabel = 'Salvar',
  isLoading = false,
  isDisabled = false,
  variant = 'inline',
  className,
}: FormActionsBarProps) {
  const isFooter = variant === 'footer';

  return (
    <div className={cn(isFooter && 'border-t pt-4 mt-4', className)}>
      {isFooter && <Separator className="mb-4 -mx-0" />}
      <div className={cn('flex gap-3', isFooter ? 'justify-end' : 'items-center')}>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isLoading || isDisabled}>
          {isLoading && <LoaderIcon className="h-4 w-4 animate-spin mr-2" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
