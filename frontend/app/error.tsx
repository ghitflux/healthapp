'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-danger-500" />
        </div>
        <h1 className="text-2xl font-bold">Algo deu errado</h1>
        <p className="text-muted-foreground">
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg text-left font-mono">
            {error.message}
          </p>
        )}
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  );
}
