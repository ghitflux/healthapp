import { getAuthUserConvenioId, normalizeAuthUser } from './auth-user';

describe('auth-user utils', () => {
  it('extracts convenio id from nested convenio objects', () => {
    expect(
      getAuthUserConvenioId({
        convenio: { id: '3c0b1cf5-5ca3-416a-9a5b-6c9477437410' },
      })
    ).toBe('3c0b1cf5-5ca3-416a-9a5b-6c9477437410');
  });

  it('normalizes nested convenio payloads into string ids', () => {
    expect(
      normalizeAuthUser({
        convenio: { id: '3c0b1cf5-5ca3-416a-9a5b-6c9477437410' },
      })
    ).toEqual({
      convenio: '3c0b1cf5-5ca3-416a-9a5b-6c9477437410',
      convenio_id: '3c0b1cf5-5ca3-416a-9a5b-6c9477437410',
    });
  });
});
