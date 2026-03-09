export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

export interface ApiEnvelope<T> {
  status?: string;
  data?: T;
  meta?: ApiMeta;
  errors?: { field?: string; detail: string }[];
  code?: string;
}

export function asEnvelope<T>(payload: unknown): ApiEnvelope<T> | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  return payload as ApiEnvelope<T>;
}

export function unwrapEnvelope<T>(payload: T | ApiEnvelope<T> | undefined | null): T | undefined {
  if (!payload) return undefined;
  if (typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export function unwrapPaginatedData<T>(
  payload: ApiEnvelope<T[]> | T[] | undefined | null
): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

export function getEnvelopeMeta<T>(
  payload: ApiEnvelope<T> | T | undefined | null
): ApiMeta | undefined {
  if (!payload || typeof payload !== 'object' || !('meta' in payload)) {
    return undefined;
  }
  return (payload as ApiEnvelope<T>).meta;
}

export function getErrorMessage(error: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const maybeError = error as {
      message?: string;
      response?: { data?: ApiEnvelope<unknown> | { detail?: string; message?: string } };
    };

    const envelope = maybeError.response?.data;
    if (envelope && typeof envelope === 'object') {
      if ('errors' in envelope && Array.isArray(envelope.errors) && envelope.errors.length > 0) {
        return envelope.errors[0]?.detail ?? fallback;
      }
      if ('detail' in envelope && typeof envelope.detail === 'string') {
        return envelope.detail;
      }
      if ('message' in envelope && typeof envelope.message === 'string') {
        return envelope.message;
      }
    }

    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
  }

  return fallback;
}
