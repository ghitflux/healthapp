export interface AuthUserLike {
  convenio?: string | null;
  convenio_id?: string | null;
}

export function getAuthUserConvenioId(user?: AuthUserLike | null): string {
  if (typeof user?.convenio_id === 'string' && user.convenio_id.trim().length > 0) {
    return user.convenio_id;
  }

  if (typeof user?.convenio === 'string' && user.convenio.trim().length > 0) {
    return user.convenio;
  }

  return '';
}

export function normalizeAuthUser<T extends AuthUserLike>(user: T | null | undefined): T | null {
  if (!user) return null;

  const convenioId = getAuthUserConvenioId(user);

  return {
    ...user,
    convenio: typeof user.convenio === 'string' ? user.convenio : convenioId || undefined,
    convenio_id: convenioId || undefined,
  } as T;
}
