import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/snaps-sdk';

import {
  getMaxSendableSnapAmount,
  validateSnapTransferAmount,
  type SnapAmountValidationResult,
  type SnapMaxSendableAmountResult,
} from './snapSendValidation';

/**
 * Asks the account's Stellar Snap to validate a transfer amount.
 *
 * The Snap simulates a full send (to self) and checks the amount against the
 * spendable XLM (balance minus the minimum balance, which includes one base
 * reserve per trustline/subentry) and the network fee. Reserve shortfalls are
 * reported as `InsufficientBalance` or `InsufficientBalanceToCoverFee`; the
 * Snap does not distinguish reserve from fee in the error code.
 *
 * @param fromAccount - The Snap-managed Stellar account sending the funds.
 * @param params - The transfer to validate.
 * @param params.accountId - The internal account id of the sender.
 * @param params.assetId - The CAIP-19 asset id being sent.
 * @param params.value - The amount to send, in display units.
 * @param params.toAddress - Optional; ignored by the Snap (destination is validated at confirmation).
 * @returns The Snap validation result, or undefined if the Snap returned nothing.
 */
export async function validateStellarTransferAmount(
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
 * Asks the account's Stellar Snap for the maximum sendable amount for an asset.
 *
 * For XLM this is the spendable balance after the minimum balance (reserves for
 * trustlines/subentries) and the fee; returns `0` when no amount can pass.
 *
 * @param fromAccount - The Snap-managed Stellar account.
 * @param params - The request parameters.
 * @param params.accountId - The internal account id.
 * @param params.assetId - The CAIP-19 asset id.
 * @param params.toAddress - Optional; accepted by the Snap but not used.
 * @returns The max sendable amount result with `{ amount }`, or undefined if the Snap returned nothing.
 */
export async function getMaxSendableStellarAmount(
  fromAccount: InternalAccount,
  params: {
    accountId: string;
    assetId: CaipAssetType;
    toAddress?: string;
  },
): Promise<SnapMaxSendableAmountResult | undefined> {
  return getMaxSendableSnapAmount(fromAccount, params);
}
