import type { AxiosError } from 'axios';

type ApiErrorPayload = {
  detail?: string;
  message?: string;
  errors?: Array<{ detail?: string; field?: string }>;
};

function isAxiosLike(error: unknown): error is AxiosError<ApiErrorPayload> {
  return Boolean(error && typeof error === 'object' && 'isAxiosError' in error);
}

function extractDetail(payload?: ApiErrorPayload): string | null {
  if (!payload) return null;
  if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors.find((item) => typeof item?.detail === 'string' && item.detail.trim());
    if (first?.detail) return first.detail;
  }
  return null;
}

export function getFriendlyApiError(error: unknown, fallback: string): string {
  if (!isAxiosLike(error)) return fallback;

  const status = error.response?.status;
  const detail = extractDetail(error.response?.data);

  if (status === 401) {
    return 'Sua sessão expirou. Faça login novamente para continuar.';
  }

  if (status === 403) {
    return 'Você não tem permissão para executar esta ação.';
  }

  if (status === 404) {
    return detail ?? 'Recurso não encontrado.';
  }

  if (status === 409) {
    return detail ?? 'Conflito de dados. Atualize a tela e tente novamente.';
  }

  if (status === 422 || status === 400) {
    return detail ?? 'Dados inválidos. Revise os campos e tente novamente.';
  }

  if (status && status >= 500) {
    return 'Erro interno no servidor. Tente novamente em alguns instantes.';
  }

  return detail ?? fallback;
}
