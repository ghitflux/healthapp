/**
 * @file components/ds/permission-tag.tsx
 * @description Atom de domínio — Tag visual para roles/permissões de usuário.
 */

import { cn } from '@/lib/utils';
import { ShieldIcon, UserIcon, StethoscopeIcon, HeartIcon } from '@/lib/icons';

export type UserRole = 'owner' | 'convenio_admin' | 'doctor' | 'patient';

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  owner: {
    label: 'Owner',
    icon: ShieldIcon,
    className: 'bg-[#f5f3ff] text-[#4c1d95] border border-[#ede9fe]',
  },
  convenio_admin: {
    label: 'Admin Convênio',
    icon: HeartIcon,
    className: 'bg-primary-50 text-primary-700 border border-primary-100',
  },
  doctor: {
    label: 'Médico',
    icon: StethoscopeIcon,
    className: 'bg-success-50 text-success-700 border border-success-100',
  },
  patient: {
    label: 'Paciente',
    icon: UserIcon,
    className: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  },
};

export interface PermissionTagProps {
  role: UserRole;
  /** Exibir apenas badge sem ícone */
  compact?: boolean;
  className?: string;
}

export function PermissionTag({ role, compact = false, className }: PermissionTagProps) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const { label, icon: Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {!compact && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
