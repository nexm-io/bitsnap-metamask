import { installSnap } from '@metamask/snaps-jest';
import { Json } from '@metamask/snaps-sdk';
import { SnapMock } from '../rpc/__mocks__/snap';
import { onRpcRequest } from '../index';
import { signPsbt, manageNetwork, signLNInvoice } from '../rpc';
import { BitcoinNetwork } from '../interface';

jest.mock('../rpc', () => {
  return {
    signPsbt: jest.fn(),
    manageNetwork: jest.fn(),
    signLNInvoice: jest.fn(),
  };

});

const snap = new SnapMock();
const domain = "www.bitsnap.ai"

describe('onRpcRequest', () => {

  beforeAll(() => {
    (global as any).snap = snap;
  });

  afterAll(() => {
    delete (global as any).snap;
  });

  it('btc_network / mock / should get network correctly', async () => {
    await onRpcRequest({
      origin: 'origin',
      request: {
        method: 'btc_network',
        params: {
          action: 'get',
        },
      },
    });

    expect(manageNetwork).toHaveBeenCalled();
  });

  it('btc_network / should get network correctly', async () => {

    const { request } = await installSnap();

    // without network param
    const res1 = await request({
      origin: 'origin',
      method: 'btc_network',
      params: {
        action: 'get',
      },
    });

    // with network param
    const res2 = await request({
      origin: 'origin',
      method: 'btc_network',
      params: {
        action: 'get',
        network: BitcoinNetwork,
      },
    });

    expect(JSON.stringify(res1.response)).toBe(JSON.stringify(res2.response));

  });

  it('btc_network / should set the network without any error', async () => {
    const { request } = await installSnap();

    await onRpcRequest({
      origin: 'origin',
      request: {
        method: 'btc_network',
        params: {
          action: 'set',
          network: BitcoinNetwork.Test,
        },
      },
    });
    expect(manageNetwork).toHaveBeenCalled();
  });

});