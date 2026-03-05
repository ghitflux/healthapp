'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useGetUnreadNotificationCount } from '@api/hooks/useNotifications';
import type { UnreadCount } from '@api/types/UnreadCount';
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
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CounterBadge } from '@/components/ds/counter-badge';
import { NotificationCenterPanel } from '@/components/sections/notifications';
import { authService } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { buildBreadcrumbLabel } from '@/components/patterns/page-breadcrumb';
import { unwrapEnvelope } from '@/hooks/owner/utils';
import { createNavItems, isNavItemActive } from './nav-config';

interface HeaderProps {
  variant: 'convenio' | 'owner';
}

export function Header({ variant }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems = createNavItems(variant);

  const unreadCountQuery = useGetUnreadNotificationCount({
    query: {
      client: queryClient,
      staleTime: 60_000,
    },
  });

  const unreadCount = unwrapEnvelope<UnreadCount>(unreadCountQuery.data)?.count ?? 0;
  const breadcrumb = buildBreadcrumbLabel(pathname);

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
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-sm">
            <div className="flex h-full flex-col gap-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Navegacao</p>
                <p className="text-sm text-muted-foreground">
                  Acesse as principais areas do painel.
                </p>
              </div>

              <nav className="grid gap-2">
                {navItems.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href);

                  return (
                    <SheetClose key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors',
                          isActive
                            ? 'border-primary-200 bg-primary-50 text-primary-700'
                            : 'border-border text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
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

        <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificacoes">
              <BellIcon className="h-4 w-4" />
              <CounterBadge
                count={unreadCount}
                className="absolute -right-1 -top-1"
                aria-label={`${unreadCount} notificacoes nao lidas`}
              />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full p-0 sm:max-w-md">
            <NotificationCenterPanel />
          </SheetContent>
        </Sheet>

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
