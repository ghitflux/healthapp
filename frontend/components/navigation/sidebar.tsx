'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboardIcon,
  StethoscopeIcon,
  CalendarIcon,
  FlaskConicalIcon,
  CalendarCheckIcon,
  DollarSignIcon,
  SettingsIcon,
  BarChart3Icon,
  Building2Icon,
  UsersIcon,
  WalletIcon,
  TrendingUpIcon,
  ShieldIcon,
  LogOutIcon,
  HeartIcon,
  type LucideIcon,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Factory Method pattern: cria os itens de navegação baseado no variant.
 */
function createNavItems(variant: 'convenio' | 'owner'): NavItem[] {
  if (variant === 'owner') {
    return [
      { label: 'Dashboard', href: '/owner/dashboard', icon: BarChart3Icon },
      { label: 'Convênios', href: '/owner/convenios', icon: Building2Icon },
      { label: 'Usuários', href: '/owner/users', icon: UsersIcon },
      { label: 'Financeiro', href: '/owner/financial', icon: WalletIcon },
      { label: 'Analytics', href: '/owner/analytics', icon: TrendingUpIcon },
      { label: 'Auditoria', href: '/owner/audit-logs', icon: ShieldIcon },
      { label: 'Configurações', href: '/owner/settings', icon: SettingsIcon },
    ];
  }

  return [
    { label: 'Dashboard', href: '/convenio/dashboard', icon: LayoutDashboardIcon },
    { label: 'Médicos', href: '/convenio/doctors', icon: StethoscopeIcon },
    { label: 'Agendas', href: '/convenio/schedules', icon: CalendarIcon },
    { label: 'Exames', href: '/convenio/exams', icon: FlaskConicalIcon },
    { label: 'Agendamentos', href: '/convenio/appointments', icon: CalendarCheckIcon },
    { label: 'Financeiro', href: '/convenio/financial', icon: DollarSignIcon },
    { label: 'Configurações', href: '/convenio/settings', icon: SettingsIcon },
  ];
}

interface SidebarProps {
  variant: 'convenio' | 'owner';
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navItems = createNavItems(variant);

  async function handleLogout() {
    await authService.logout();
    logout();
  }

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside className="hidden lg:flex flex-col w-[280px] border-r bg-sidebar h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <HeartIcon className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-lg">HealthApp</span>
        {variant === 'owner' && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Owner
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/convenio/dashboard' &&
                item.href !== '/owner/dashboard' &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User info + Logout */}
      <div className="border-t px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name ?? 'Usuário'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Separator />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOutIcon className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
