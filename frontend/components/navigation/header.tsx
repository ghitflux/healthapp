'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';

function buildBreadcrumb(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const labels: Record<string, string> = {
    convenio: 'Convênio',
    owner: 'Owner',
    dashboard: 'Dashboard',
    doctors: 'Médicos',
    schedules: 'Agendas',
    exams: 'Exames',
    appointments: 'Agendamentos',
    financial: 'Financeiro',
    settings: 'Configurações',
    convenios: 'Convênios',
    users: 'Usuários',
    analytics: 'Analytics',
    'audit-logs': 'Auditoria',
  };

  return segments
    .map((s) => labels[s] ?? s)
    .join(' › ');
}

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const breadcrumb = buildBreadcrumb(pathname);

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  async function handleLogout() {
    await authService.logout();
    logout();
  }

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
      {/* Left — Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <MenuIcon className="h-5 w-5" />
        </Button>
        <nav className="text-sm text-muted-foreground">
          <span>{breadcrumb}</span>
        </nav>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Alternar tema"
        >
          <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <BellIcon className="h-4 w-4" />
          <span
            className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-danger-500 text-white text-[10px] font-medium flex items-center justify-center px-1"
            aria-label="3 notificações não lidas"
          >
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name ?? 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOutIcon className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
