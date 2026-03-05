'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { exportConvenioAppointments } from '@api/clients/convenioClient/exportConvenioAppointments';
import { Button } from '@/components/ui/button';
import { buildExportFilename } from '@/lib/export-utils';
import { DownloadIcon, LoaderIcon } from '@/lib/icons';
import { getFriendlyApiError } from '@/lib/error-messages';

interface FinancialExportButtonProps {
  dateFrom: string;
  dateTo: string;
  convenioId?: string;
}

function downloadCsv(payload: unknown) {
  const blob =
    payload instanceof Blob
      ? payload
      : new Blob([typeof payload === 'string' ? payload : JSON.stringify(payload)], {
          type: 'text/csv;charset=utf-8;',
        });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildExportFilename('convenio_appointments', 'csv');
  link.click();
  URL.revokeObjectURL(url);
}

export function FinancialExportButton({
  dateFrom,
  dateTo,
  convenioId,
}: FinancialExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    try {
      setIsLoading(true);
      const payload = await exportConvenioAppointments(
        {
          start_date: dateFrom,
          end_date: dateTo,
          format: 'csv',
          ...(convenioId ? { convenio_id: convenioId } : {}),
        },
        {
          responseType: 'blob',
        }
      );

      downloadCsv(payload as unknown);
      toast.success('CSV exportado com sucesso.');
    } catch (error) {
      toast.error(getFriendlyApiError(error, 'Erro ao exportar CSV.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void handleExport()} disabled={isLoading}>
      {isLoading ? (
        <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <DownloadIcon className="mr-2 h-4 w-4" />
      )}
      Exportar CSV
    </Button>
  );
}
