import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/snaps-sdk';

import {
  getMaxSendableSnapAmount,
  validateSnapTransferAmount,
  type SnapAmountValidationResult,
  type SnapMaxSendableAmountResult,
} from './snapSendValidation';

export type { SnapAmountValidationResult, SnapMaxSendableAmountResult };

/**
 * Asks the account's Tron Snap to validate a transfer before it is sent.
 *
 * Tron fees depend on the destination (energy and bandwidth), so `toAddress`
 * is passed along with the amount so the Snap can check that the account can
 * cover both the value and the resources needed for that specific transfer.
 *
 * When `toAddress` is omitted, the Snap probes to the Tron zero address and
 * returns a conservative fee estimate (including account activation reserve
 * for native TRX). This is useful for balance-only validation before the
 * destination is known (e.g., on the amount input screen).
 *
 * @param fromAccount - The Snap-managed Tron account sending the funds.
 * @param params - The transfer to validate.
 * @param params.accountId - The internal account id of the sender.
 * @param params.assetId - The CAIP-19 asset id being sent.
 * @param params.value - The amount to send, in display units.
 * @param params.toAddress - The destination address (optional for balance-only validation).
 * @returns The Snap validation result, or undefined if the Snap returned nothing.
 */
export async function validateTronTransferAmount(
  fromAccount: InternalAccount,
  params: {
    accountId: string;
    assetId: CaipAssetType;
    value: string;
    toAddress?: string;
  },
): Promise<SnapAmountValidationResult | undefined> {
  return validateSnapTransferAmount(fromAccount, params);
}

/**
 * Asks the account's Tron Snap for the maximum sendable amount for an asset.
 *
 * The Snap returns the maximum amount that can be entered so `onAmountInput`
 * passes, accounting for network fees and (when applicable) account activation
 * reserves. Returns `0` when no amount can pass (e.g., insufficient TRX for fees).
 *
 * @param fromAccount - The Snap-managed Tron account.
 * @param params - The request parameters.
 * @param params.accountId - The internal account id.
 * @param params.assetId - The CAIP-19 asset id.
 * @param params.toAddress - Optional destination address for precise fee estimates.
 * @returns The max sendable amount result with `{ amount }`, or undefined if the Snap returned nothing.
 */
export async function getMaxSendableTronAmount(
  fromAccount: InternalAccount,
  params: {
    accountId: string;
    assetId: CaipAssetType;
    toAddress?: string;
  },
): Promise<SnapMaxSendableAmountResult | undefined> {
  return getMaxSendableSnapAmount(fromAccount, params);
}
