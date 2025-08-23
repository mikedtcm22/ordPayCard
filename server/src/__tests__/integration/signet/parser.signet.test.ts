/**
 * Integration tests for parser functionality with real Signet blockchain data
 * Tests verify that the parser can handle actual Signet transactions with OP_RETURN data
 */

import { waitForSignetSync, createSignetOpReturnTx, fetchSignetTx, createSignetPaymentTx } from './utils.helper';
import { parseOpReturn } from '../../../services/registration/parser/opReturn';
import { sumOutputsToAddress } from '../../../services/registration/parser/sumToCreator';

// Skip these tests in CI environment as they require local Signet node
const describeSkipCI = process.env['CI'] ? describe.skip : describe;

describeSkipCI('Parser Signet integration (requires local Signet node)', () => {
  beforeAll(async () => {
    await waitForSignetSync();
  });
  
  it('should parse real Signet transaction', async () => {
    const txid = await createSignetOpReturnTx();
    const txHex = await fetchSignetTx(txid);
    
    const opReturn = parseOpReturn(txHex);
    expect(opReturn).toMatchObject({
      nftId: expect.any(String),
      expiryBlock: expect.any(Number)
    });
  });
  
  it('should sum outputs from real Signet tx', async () => {
    const txid = await createSignetPaymentTx('tb1qz3kmh8r2ezsqkhes255wrlslk027n0sf0luukq', 0.00001);
    const txHex = await fetchSignetTx(txid);
    
    const sum = sumOutputsToAddress(txHex, 'tb1qz3kmh8r2ezsqkhes255wrlslk027n0sf0luukq', 'signet');
    expect(sum).toBe(1000n);
  });
});