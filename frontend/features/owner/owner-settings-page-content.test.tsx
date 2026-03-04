import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerSettingsPageContent } from './owner-settings-page-content';

const useOwnerMutationsMock = jest.fn();
const useGetPlatformSettingsMock = jest.fn();

jest.mock('@/hooks/owner', () => ({
  useOwnerMutations: () => useOwnerMutationsMock(),
}));

jest.mock('@api/hooks/useOwner', () => ({
  useGetPlatformSettings: () => useGetPlatformSettingsMock(),
}));

function createSettingsQueryState() {
  return {
    data: {
      data: {
        id: 'settings-1',
        platform_fee_percentage: '10.00',
        max_advance_booking_days: 90,
        min_cancellation_hours: 24,
        cancellation_fee_percentage: '0.00',
        appointment_lock_ttl_minutes: 10,
        payment_timeout_minutes: 30,
        max_appointments_per_day_patient: 5,
        pix_enabled: true,
        credit_card_enabled: true,
        maintenance_mode: false,
        maintenance_message: '',
        updated_by: null,
        created_at: '2026-03-01T10:00:00Z',
        updated_at: '2026-03-01T10:00:00Z',
      },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  };
}

describe('OwnerSettingsPageContent', () => {
  beforeEach(() => {
    useGetPlatformSettingsMock.mockReset();
    useOwnerMutationsMock.mockReset();

    useGetPlatformSettingsMock.mockReturnValue(createSettingsQueryState());
    useOwnerMutationsMock.mockReturnValue({
      createConvenio: jest.fn(),
      deleteConvenio: jest.fn(),
      approveConvenio: jest.fn(),
      suspendConvenio: jest.fn(),
      updateSettings: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined),
      isCreatingConvenio: false,
      isDeletingConvenio: false,
      isApprovingConvenio: false,
      isSuspendingConvenio: false,
      isUpdatingSettings: false,
    });
  });

  it('submits updated settings using generated schema form', async () => {
    const user = userEvent.setup();
    const updateSettings = jest
      .fn<Promise<void>, [{ platform_fee_percentage?: string }]>()
      .mockResolvedValue(undefined);

    useOwnerMutationsMock.mockReturnValue({
      createConvenio: jest.fn(),
      deleteConvenio: jest.fn(),
      approveConvenio: jest.fn(),
      suspendConvenio: jest.fn(),
      updateSettings,
      isCreatingConvenio: false,
      isDeletingConvenio: false,
      isApprovingConvenio: false,
      isSuspendingConvenio: false,
      isUpdatingSettings: false,
    });

    render(<OwnerSettingsPageContent />);

    const platformFeeInput = screen.getByLabelText('Taxa da plataforma (%)');
    await user.clear(platformFeeInput);
    await user.type(platformFeeInput, '12.50');

    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledTimes(1);
    });

    const payload = updateSettings.mock.calls[0]?.[0];
    expect(payload?.platform_fee_percentage).toBe('12.50');
  });
});
