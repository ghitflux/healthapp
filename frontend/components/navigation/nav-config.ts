import type { LucideIcon } from '@/lib/icons';
import {
  BarChart3Icon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarIcon,
  DollarSignIcon,
  FlaskConicalIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from '@/lib/icons';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function createNavItems(variant: 'convenio' | 'owner'): NavItem[] {
  if (variant === 'owner') {
    return [
      { label: 'Dashboard', href: '/owner/dashboard', icon: BarChart3Icon },
      { label: 'Convenios', href: '/owner/convenios', icon: Building2Icon },
      { label: 'Usuarios', href: '/owner/users', icon: UsersIcon },
      { label: 'Financeiro', href: '/owner/financial', icon: WalletIcon },
      { label: 'Analytics', href: '/owner/analytics', icon: TrendingUpIcon },
      { label: 'Auditoria', href: '/owner/audit-logs', icon: ShieldIcon },
      { label: 'Configuracoes', href: '/owner/settings', icon: SettingsIcon },
    ];
  }

  return [
    { label: 'Dashboard', href: '/convenio/dashboard', icon: LayoutDashboardIcon },
    { label: 'Medicos', href: '/convenio/doctors', icon: StethoscopeIcon },
    { label: 'Agendas', href: '/convenio/schedules', icon: CalendarIcon },
    { label: 'Exames', href: '/convenio/exams', icon: FlaskConicalIcon },
    { label: 'Agendamentos', href: '/convenio/appointments', icon: CalendarCheckIcon },
    { label: 'Financeiro', href: '/convenio/financial', icon: DollarSignIcon },
    { label: 'Configuracoes', href: '/convenio/settings', icon: SettingsIcon },
  ];
}

export function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === '/convenio/dashboard' || href === '/owner/dashboard') return false;
  return pathname.startsWith(href);
}
