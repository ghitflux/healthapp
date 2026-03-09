'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  LogOutIcon,
  HeartIcon,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Separator } from '@/components/ui/separator';
import { prefetchOwnerData } from '@/lib/owner-prefetch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createNavItems, isNavItemActive } from './nav-config';

interface SidebarProps {
  variant: 'convenio' | 'owner';
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navItems = createNavItems(variant);

  async function handleLogout() {
    await authService.logout();
    logout();
  }

  function handlePrefetch(href: string) {
    void router.prefetch(href);
    if (variant === 'owner') {
      prefetchOwnerData(queryClient, href);
    }
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
        <span className="font-bold text-lg">Abase Saúde</span>
        {variant === 'owner' && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Owner
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider delayDuration={150}>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onMouseEnter={() => handlePrefetch(item.href)}
                      onFocus={() => handlePrefetch(item.href)}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-r-lg rounded-l-sm border-l-2 px-3 py-2.5 text-sm transition-[background-color,color,transform,box-shadow,border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)]',
                        isActive
                          ? 'border-primary-600 bg-primary-100/80 pl-[calc(theme(spacing.3)-2px)] font-semibold text-primary-700 shadow-xs dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-transparent font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground motion-safe:hover:translate-x-0.5'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-safe:group-hover:scale-110" />
                      {item.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </TooltipProvider>
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
          className="w-full justify-start text-muted-foreground hover:text-foreground motion-safe:hover:translate-x-0.5"
        >
          <LogOutIcon className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
