import type { QueryClient } from '@tanstack/react-query';
import {
  getOwnerDashboardQueryOptions,
  getOwnerFinancialReportQueryOptions,
  getPlatformSettingsQueryOptions,
  listAdminConveniosQueryOptions,
  listAdminUsersQueryOptions,
  listAuditLogsQueryOptions,
} from '@api/hooks/useOwner';

export function prefetchOwnerData(queryClient: QueryClient, href: string) {
  if (href === '/owner/dashboard' || href === '/owner/analytics') {
    void queryClient.prefetchQuery(getOwnerDashboardQueryOptions());
    return;
  }

  if (href === '/owner/convenios') {
    void queryClient.prefetchQuery(listAdminConveniosQueryOptions({ page: 1, page_size: 20 }));
    return;
  }

  if (href === '/owner/users') {
    void queryClient.prefetchQuery(listAdminUsersQueryOptions({ page: 1, page_size: 20 }));
    return;
  }

  if (href === '/owner/audit-logs') {
    void queryClient.prefetchQuery(listAuditLogsQueryOptions({ page: 1, page_size: 20 }));
    return;
  }

  if (href === '/owner/financial') {
    void queryClient.prefetchQuery(getOwnerFinancialReportQueryOptions());
    return;
  }

  if (href === '/owner/settings') {
    void queryClient.prefetchQuery(getPlatformSettingsQueryOptions());
  }
}
