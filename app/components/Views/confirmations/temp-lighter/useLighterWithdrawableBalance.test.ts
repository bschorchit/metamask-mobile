import { renderHook, waitFor } from '@testing-library/react-native';

import Logger from '../../../../util/Logger';
import { fetchLighterWithdrawableBalance } from './lighter-balance';
import { useLighterWithdrawableBalance } from './useLighterWithdrawableBalance';

jest.mock('./lighter-balance');
jest.mock('../../../../util/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

describe('useLighterWithdrawableBalance', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the fetched balance', async () => {
    jest.mocked(fetchLighterWithdrawableBalance).mockResolvedValue('5.57');

    const { result } = renderHook(() => useLighterWithdrawableBalance(true));

    await waitFor(() => expect(result.current).toBe('5.57'));
    expect(fetchLighterWithdrawableBalance).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useLighterWithdrawableBalance(false));

    expect(result.current).toBeUndefined();
    expect(fetchLighterWithdrawableBalance).not.toHaveBeenCalled();
  });

  it('logs a failed lookup and leaves the balance unset', async () => {
    jest
      .mocked(fetchLighterWithdrawableBalance)
      .mockRejectedValue(new Error('down'));

    const { result } = renderHook(() => useLighterWithdrawableBalance(true));

    await waitFor(() => expect(Logger.error).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });
});
