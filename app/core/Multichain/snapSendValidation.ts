import { HandlerType } from '@metamask/snaps-utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { SnapId, CaipAssetType } from '@metamask/snaps-sdk';

import Engine from '../Engine';
import { handleSnapRequest } from '../Snaps/utils';

/**
 * Result returned by a wallet Snap's `onAmountInput` client request.
 */
export interface SnapAmountValidationResult {
  valid: boolean;
  errors?: { code: string }[];
}

/**
 * Result returned by a wallet Snap's `getMaxSendableAmount` client request.
 */
export interface SnapMaxSendableAmountResult {
  amount: string;
}

/**
 * Shared client-request plumbing for Snap-managed non-EVM accounts (Tron,
 * Stellar). The chain modules wrap these with their own documented semantics.
 */
async function sendSnapClientRequest(
  fromAccount: InternalAccount,
  method: 'onAmountInput' | 'getMaxSendableAmount',
  params: Record<string, unknown>,
): Promise<unknown> {
  return handleSnapRequest(Engine.controllerMessenger, {
    snapId: fromAccount.metadata?.snap?.id as SnapId,
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: { method, params },
  });
}

/**
 * Asks the account's Snap to validate a transfer amount (`onAmountInput`).
 *
 * @param fromAccount - The Snap-managed account sending the funds.
 * @param params - The transfer to validate.
 * @param params.accountId - The internal account id of the sender.
 * @param params.assetId - The CAIP-19 asset id being sent.
 * @param params.value - The amount to send, in display units.
 * @param params.toAddress - The destination address (optional for balance-only validation).
 * @returns The Snap validation result, or undefined if the Snap returned nothing.
 */
export async function validateSnapTransferAmount(
  fromAccount: InternalAccount,
  params: {
    accountId: string;
    assetId: CaipAssetType;
    value: string;
    toAddress?: string;
  },
): Promise<SnapAmountValidationResult | undefined> {
  return (await sendSnapClientRequest(fromAccount, 'onAmountInput', params)) as
    | SnapAmountValidationResult
    | undefined;
}

/**
 * Asks the account's Snap for the maximum amount that passes `onAmountInput`
 * (`getMaxSendableAmount`). Returns `0` when no amount can pass.
 *
 * @param fromAccount - The Snap-managed account.
 * @param params - The request parameters.
 * @param params.accountId - The internal account id.
 * @param params.assetId - The CAIP-19 asset id.
 * @param params.toAddress - Optional destination address.
 * @returns The max sendable amount result with `{ amount }`, or undefined if the Snap returned nothing.
 */
export async function getMaxSendableSnapAmount(
  fromAccount: InternalAccount,
  params: {
    accountId: string;
    assetId: CaipAssetType;
    toAddress?: string;
  },
): Promise<SnapMaxSendableAmountResult | undefined> {
  return (await sendSnapClientRequest(
    fromAccount,
    'getMaxSendableAmount',
    params,
  )) as SnapMaxSendableAmountResult | undefined;
}
