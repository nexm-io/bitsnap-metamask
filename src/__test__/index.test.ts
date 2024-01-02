import { installSnap } from '@metamask/snaps-jest';

describe('onRpcRequest', () => {

  it('should change network mainnet <> testnet', async () => {
    const { request } = await installSnap();
  });

});