'use client';

/**
 * @file components/sections/notifications/notification-center-panel.tsx
 * @description Organismo — Painel de central de notificações.
 * Exibe lista de notificações com ações de leitura.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BellIcon, CheckIcon, InfoIcon } from '@/lib/icons';
import { StatusPill } from '@/components/ds/status-pill';
import { DateTimeText } from '@/components/ds/datetime-text';
import { EmptyStateBlock } from '@/components/patterns/empty-state-block';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  results?: Notification[];
  count?: number;
}

function NotificationItemSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  return (
    <div
      className={cn(
        'flex gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
        !notification.is_read && 'bg-primary-50/50 dark:bg-primary-900/10'
      )}
    >
      <div className="shrink-0 mt-0.5">
        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <InfoIcon className="h-4 w-4 text-primary-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium truncate', !notification.is_read && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Marcar como lida"
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <DateTimeText value={notification.created_at} variant="relative" className="text-xs text-muted-foreground" />
          {!notification.is_read && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" aria-label="Não lida" />
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationCenterPanel() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/v1/notifications/?page_size=20');
      return response.data.data ?? response.data;
    },
    staleTime: 1000 * 60,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/notifications/${id}/read/`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/v1/notifications/read-all/'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const notifications = data?.results ?? [];
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <BellIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Notificações</span>
          {data?.count !== undefined && (
            <StatusPill
              status="pending"
              label={String(data.count)}
              className="text-[10px]"
            />
          )}
        </div>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <NotificationItemSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyStateBlock
            icon={BellIcon}
            title="Nenhuma notificação"
            description="Você está em dia! Não há notificações no momento."
          />
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />
      <div className="p-3 text-center">
        <a
          href="/notifications"
          className="text-xs text-primary-600 hover:underline"
        >
          Ver todas as notificações
        </a>
      </div>
    </div>
  );
}
