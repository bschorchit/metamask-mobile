import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/snaps-sdk';

import { validateTronTransferAmount } from '../../../../../core/Multichain/tron';
import {
  getMaxSendableStellarAmount,
  validateStellarTransferAmount,
} from '../../../../../core/Multichain/stellar';
import type { SnapAmountValidationResult } from '../../../../../core/Multichain/snapSendValidation';
import { RootState } from '../../../../../reducers';
import { getMemoizedInternalAccountByAddress } from '../../../../../selectors/accountsController';
import { strings } from '../../../../../../locales/i18n';

const VALIDATION_DEBOUNCE_MS = 500;

interface UseSnapAmountValidationParams {
  enabled: boolean;
  amount: string;
  assetChainId?: string;
  assetReference?: string;
  assetSymbol?: string;
  walletAddress?: string;
}

interface UseSnapAmountValidationResult {
  isValidating: boolean;
  validationError: string | undefined;
  isDebouncing: boolean;
}

const TRON_CHAIN_PREFIX = 'tron:';
const STELLAR_CHAIN_PREFIX = 'stellar:';

/**
 * Maps a Snap validation result to a user-facing error message.
 * Returns undefined when the transfer is valid.
 *
 * Tron reports fee shortfalls in terms of TRX / network resources. For Stellar
 * the Snap folds reserve shortfalls into the same codes without distinguishing
 * them, so the generic fee message is used.
 */
function getValidationErrorMessage(
  result: SnapAmountValidationResult | undefined,
  isTron: boolean,
  maxSendable?: { amount: string; symbol: string },
): string | undefined {
  if (!result) {
    return strings(
      'fiat_on_ramp_aggregator.tron_validation.validation_unavailable',
    );
  }
  if (result.valid) {
    return undefined;
  }
  const errorCode = result.errors?.[0]?.code;
  if (errorCode === 'InsufficientBalance') {
    return maxSendable
      ? strings(
          'fiat_on_ramp_aggregator.snap_validation.insufficient_funds_max',
          {
            amount: maxSendable.amount,
            symbol: maxSendable.symbol,
          },
        )
      : strings('send.insufficient_funds');
  }
  if (errorCode === 'InsufficientBalanceToCoverFee') {
    return isTron
      ? strings(
          'fiat_on_ramp_aggregator.send_transaction.insufficient_tron_resources',
        )
      : strings('send.insufficient_balance_to_cover_fee');
  }
  return strings('send.invalid_value');
}

/**
 * Debounced Snap amount validation (Tron, Stellar) for the BuildQuote screen.
 *
 * When enabled and a supported asset + amount are selected, this hook calls
 * the chain Snap's `onAmountInput` without a `toAddress` (balance-only
 * validation) after a debounce period. The Snap estimates fees (and, for
 * Stellar, account reserves) so the UI can show an inline error and disable
 * Continue when the amount is invalid.
 *
 * Does nothing when `enabled` is false or required params are missing.
 */
export function useSnapAmountValidation({
  enabled,
  amount,
  assetChainId,
  assetReference,
  assetSymbol,
  walletAddress,
}: UseSnapAmountValidationParams): UseSnapAmountValidationResult {
  const [isValidating, setIsValidating] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestValidationRef = useRef(0);

  const fromAccount = useSelector((state: RootState) =>
    walletAddress
      ? getMemoizedInternalAccountByAddress(state, walletAddress)
      : undefined,
  ) as InternalAccount | undefined;

  const validate = useCallback(async () => {
    if (
      !enabled ||
      !fromAccount ||
      !assetChainId ||
      !assetReference ||
      !amount ||
      amount === '0'
    ) {
      setValidationError(undefined);
      setIsValidating(false);
      return;
    }

    const validationId = Date.now();
    latestValidationRef.current = validationId;

    setIsValidating(true);

    try {
      const isTron = assetChainId.startsWith(TRON_CHAIN_PREFIX);
      if (!isTron && !assetChainId.startsWith(STELLAR_CHAIN_PREFIX)) {
        setValidationError(undefined);
        setIsValidating(false);
        return;
      }

      const validateAmount = isTron
        ? validateTronTransferAmount
        : validateStellarTransferAmount;

      const result = await validateAmount(fromAccount, {
        accountId: fromAccount.id,
        assetId: `${assetChainId}/${assetReference}` as CaipAssetType,
        value: amount,
      });

      // For Stellar, tell the user how much they can actually send (balance
      // minus reserves and fee). Best effort: any failure falls back to the
      // plain "Insufficient funds" message.
      let maxSendable: { amount: string; symbol: string } | undefined;
      if (
        !isTron &&
        assetSymbol &&
        !result?.valid &&
        result?.errors?.[0]?.code === 'InsufficientBalance'
      ) {
        try {
          const maxResult = await getMaxSendableStellarAmount(fromAccount, {
            accountId: fromAccount.id,
            assetId: `${assetChainId}/${assetReference}` as CaipAssetType,
          });
          if (maxResult?.amount && Number(maxResult.amount) > 0) {
            maxSendable = { amount: maxResult.amount, symbol: assetSymbol };
          }
        } catch {
          // Fall back to the plain message.
        }
      }

      if (latestValidationRef.current === validationId) {
        const errorMessage = getValidationErrorMessage(
          result,
          isTron,
          maxSendable,
        );
        setValidationError(errorMessage);
      }
    } catch {
      if (latestValidationRef.current === validationId) {
        setValidationError(
          strings(
            'fiat_on_ramp_aggregator.tron_validation.validation_unavailable',
          ),
        );
      }
    } finally {
      if (latestValidationRef.current === validationId) {
        setIsValidating(false);
      }
    }
  }, [enabled, fromAccount, assetChainId, assetReference, assetSymbol, amount]);

  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Invalidate any in-flight requests by bumping the validation ID.
    // This prevents stale results from overwriting the new state.
    latestValidationRef.current = Date.now();

    if (!enabled || !amount || amount === '0') {
      setValidationError(undefined);
      setIsValidating(false);
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    validationTimeoutRef.current = setTimeout(() => {
      setIsDebouncing(false);
      void validate();
    }, VALIDATION_DEBOUNCE_MS);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      // Invalidate on cleanup as well to ensure any in-flight request is ignored
      latestValidationRef.current = Date.now();
      setIsDebouncing(false);
    };
  }, [enabled, amount, validate]);

  return {
    isValidating,
    validationError,
    isDebouncing,
  };
}
