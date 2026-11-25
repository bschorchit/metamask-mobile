import { useEffect, useState } from 'react';

import Logger from '../../../../util/Logger';
import { fetchLighterWithdrawableBalance } from './lighter-balance';

/**
 * @param enabled - Whether a Lighter withdraw is open. Nothing is fetched otherwise.
 * @returns Human-readable USDC balance, or `undefined` until loaded.
 */
export function useLighterWithdrawableBalance(
  enabled: boolean,
): string | undefined {
  const [balance, setBalance] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    fetchLighterWithdrawableBalance()
      .then((fetched) => {
        if (!cancelled) {
          setBalance(fetched);
        }
      })
      .catch((error: unknown) => {
        Logger.error(error as Error, 'Failed to load the Lighter balance');
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return balance;
}
