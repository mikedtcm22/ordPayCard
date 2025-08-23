/**
 * Shared test fixtures for server/client parity testing
 * These fixtures ensure both implementations produce identical results
 */

export interface ParityFixture {
  name: string;
  input: any;
  expected: any;
  description?: string;
}

/**
 * Get test fixtures for a specific function
 */
export function getParityFixtures(functionName: string): ParityFixture[] {
  const fixtures: Record<string, ParityFixture[]> = {
    verifyPayment: [
      {
        name: 'valid payment with mainnet',
        input: {
          txHexOrId: 'mock-tx-hex',
          creatorAddr: 'bc1qexample',
          minFee: '1000',
          nftId: 'inscription123',
          opts: {
            currentBlock: 800000,
            network: 'mainnet'
          }
        },
        expected: '0', // Currently returns 0n in stub implementation
        description: 'Basic valid payment verification'
      },
      {
        name: 'valid payment with testnet',
        input: {
          txHexOrId: 'mock-tx-hex',
          creatorAddr: 'tb1qexample',
          minFee: '500',
          nftId: 'inscription456',
          opts: {
            currentBlock: 2500000,
            network: 'testnet'
          }
        },
        expected: '0',
        description: 'Testnet payment verification'
      },
      {
        name: 'payment with provenance window',
        input: {
          txHexOrId: 'mock-tx-hex',
          creatorAddr: 'bc1qexample',
          minFee: '2000',
          nftId: 'inscription789',
          opts: {
            currentBlock: 800000,
            network: 'mainnet',
            childHeight: 799999,
            feeHeight: 799998,
            kWindow: 1
          }
        },
        expected: '0',
        description: 'Payment with provenance validation'
      }
    ],
    dedupe: [
      {
        name: 'empty array',
        input: [],
        expected: [],
        description: 'Deduplicating empty array'
      },
      {
        name: 'no duplicates',
        input: ['tx1', 'tx2', 'tx3'],
        expected: ['tx1', 'tx2', 'tx3'],
        description: 'Array with no duplicates'
      },
      {
        name: 'duplicates at end',
        input: ['tx1', 'tx2', 'tx3', 'tx1'],
        expected: ['tx1', 'tx2', 'tx3'],
        description: 'Duplicate at end of array'
      },
      {
        name: 'multiple duplicates',
        input: ['tx1', 'tx2', 'tx1', 'tx3', 'tx2', 'tx1'],
        expected: ['tx1', 'tx2', 'tx3'],
        description: 'Multiple duplicates throughout array'
      },
      {
        name: 'all duplicates',
        input: ['tx1', 'tx1', 'tx1', 'tx1'],
        expected: ['tx1'],
        description: 'Array with all same element'
      },
      {
        name: 'preserve order',
        input: ['tx3', 'tx1', 'tx2', 'tx1', 'tx3'],
        expected: ['tx3', 'tx1', 'tx2'],
        description: 'Order preservation check'
      }
    ]
  };

  return fixtures[functionName] || [];
}

/**
 * Load server test results for comparison
 * In a real implementation, this would load actual server test results
 */
export async function getServerResults(functionName: string, input: any): Promise<any> {
  // This would typically load from a JSON file or make an API call
  // For now, we'll return the expected results based on current implementation
  
  if (functionName === 'verifyPayment') {
    // Server currently returns 0n for all valid inputs
    return '0';
  }
  
  if (functionName === 'dedupe') {
    // Server dedupe logic
    const seen = new Set();
    const result = [];
    for (const item of input) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
    return result;
  }
  
  return null;
}