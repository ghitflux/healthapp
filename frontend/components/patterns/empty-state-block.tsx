/**
 * @file components/patterns/empty-state-block.tsx
 * @description Molécula — Estado vazio padronizado para listas e seções.
 * Localização canônica no design system.
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from '@/lib/icons';

export interface EmptyStateBlockProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyStateBlock({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateBlockProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 p-4">
          <Icon className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
