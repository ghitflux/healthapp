/**
 * @file components/templates/auth-template.tsx
 * @description Template — Layout padrão de páginas de autenticação.
 * Centralizado com card, logo e conteúdo do formulário.
 */

import { HeartIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface AuthTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthTemplate({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthTemplateProps) {
  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4',
        className
      )}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo + Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <HeartIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Abase Saúde</h1>
            <p className="text-sm text-muted-foreground">Gestão em Saúde</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-card p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>

        {/* Footer links */}
        {footer && (
          <div className="text-center text-xs text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}
