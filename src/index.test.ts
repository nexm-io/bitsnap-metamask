import { installSnap } from '@metamask/snaps-jest';
import { onRpcRequest } from './index';

describe('onRpcRequest', () => {

  it('should change network mainnet <> testnet', async () => {
    const { request } = await installSnap();
  });
});