import { HandlerType } from '@metamask/snaps-utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/snaps-sdk';

import Engine from '../../Engine';
import { handleSnapRequest } from '../../Snaps/utils';
import {
  validateStellarTransferAmount,
  getMaxSendableStellarAmount,
} from '../stellar';

jest.mock('../../Engine', () => ({
  controllerMessenger: { call: jest.fn() },
}));

jest.mock('../../Snaps/utils', () => ({
  handleSnapRequest: jest.fn(),
}));

const mockHandleSnapRequest = handleSnapRequest as jest.Mock;

const SNAP_ID = 'npm:@metamask/stellar-wallet-snap';

const mockAccount = {
  id: 'stellar-account-id',
  address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW',
  metadata: { snap: { id: SNAP_ID } },
} as unknown as InternalAccount;

const assetId = 'stellar:pubnet/slip44:148' as CaipAssetType;

describe('validateStellarTransferAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the Snap onAmountInput handler', async () => {
    mockHandleSnapRequest.mockResolvedValue({ valid: true, errors: [] });
    const params = { accountId: mockAccount.id, assetId, value: '10' };

    const result = await validateStellarTransferAmount(mockAccount, params);

    expect(result).toEqual({ valid: true, errors: [] });
    expect(mockHandleSnapRequest).toHaveBeenCalledWith(
      Engine.controllerMessenger,
      {
        snapId: SNAP_ID,
        origin: 'metamask',
        handler: HandlerType.OnClientRequest,
        request: { method: 'onAmountInput', params },
      },
    );
  });

  it('propagates Snap errors', async () => {
    mockHandleSnapRequest.mockRejectedValue(new Error('snap down'));

    await expect(
      validateStellarTransferAmount(mockAccount, {
        accountId: mockAccount.id,
        assetId,
        value: '10',
      }),
    ).rejects.toThrow('snap down');
  });
});

describe('getMaxSendableStellarAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the Snap getMaxSendableAmount handler', async () => {
    mockHandleSnapRequest.mockResolvedValue({ amount: '4.5' });
    const params = { accountId: mockAccount.id, assetId };

    const result = await getMaxSendableStellarAmount(mockAccount, params);

    expect(result).toEqual({ amount: '4.5' });
    expect(mockHandleSnapRequest).toHaveBeenCalledWith(
      Engine.controllerMessenger,
      {
        snapId: SNAP_ID,
        origin: 'metamask',
        handler: HandlerType.OnClientRequest,
        request: { method: 'getMaxSendableAmount', params },
      },
    );
  });

  it('returns undefined when the Snap returns nothing', async () => {
    mockHandleSnapRequest.mockResolvedValue(undefined);

    expect(
      await getMaxSendableStellarAmount(mockAccount, {
        accountId: mockAccount.id,
        assetId,
      }),
    ).toBeUndefined();
  });
});
