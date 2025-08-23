/**
 * Integration test for address validation in verifyPayment
 */

import { verifyPayment } from '../services/registration/parser/verifyPayment';

describe('Address validation integration', () => {
  it('should reject payment verification with invalid creator address', async () => {
    const mockTxHex = '01000000000100000000';
    
    await expect(verifyPayment(
      mockTxHex,
      'invalid_address',
      100n,
      'nftId',
      {
        currentBlock: 100,
        network: 'regtest'
      }
    )).rejects.toThrow(/Invalid creator address/);
  });

  it('should reject payment with address from wrong network', async () => {
    const mockTxHex = '01000000000100000000';
    
    await expect(verifyPayment(
      mockTxHex,
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // Mainnet address
      100n,
      'nftId',
      {
        currentBlock: 100,
        network: 'regtest'
      }
    )).rejects.toThrow(/Invalid creator address.*Address network mismatch/);
  });
});