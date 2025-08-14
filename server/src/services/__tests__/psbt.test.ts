/**
 * PSBT Service Tests
 *
 * Tests for PSBT creation and validation functionality
 */

import * as bitcoin from 'bitcoinjs-lib';
import {
  createFundingPsbt,
  validatePsbt,
  getPsbtInfo,
  createDummyUtxo,
  type TxOutput,
  type CreatePsbtParams,
} from '../psbt';

describe('PSBT Service', () => {
  const testnetNetwork = bitcoin.networks.testnet;
  const originalEnv = process.env['BITCOIN_NETWORK'];

  beforeEach(() => {
    process.env['BITCOIN_NETWORK'] = 'testnet';
  });

  afterEach(() => {
    if (originalEnv) {
      process.env['BITCOIN_NETWORK'] = originalEnv;
    } else {
      delete process.env['BITCOIN_NETWORK'];
    }
  });

  describe('createDummyUtxo', () => {
    it('should create a valid dummy UTXO with default value', () => {
      const utxo = createDummyUtxo();

      expect(utxo.value).toBe(100000);
      expect(utxo.txid).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(utxo.vout).toBe(0);
      expect(utxo.scriptPubKey).toMatch(/^0014[0-9a-f]{40}$/); // P2WPKH: OP_0 + 20 bytes
      expect(utxo.address).toContain('tb1q');
    });

    it('should create a dummy UTXO with custom value', () => {
      const customValue = 50000;
      const utxo = createDummyUtxo(customValue);

      expect(utxo.value).toBe(customValue);
    });
  });

  describe('createFundingPsbt', () => {
    it('should create a valid PSBT with single input and output', () => {
      const input = createDummyUtxo(100000);
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000,
      };

      const params: CreatePsbtParams = {
        inputs: [input],
        outputs: [output],
        feeRate: 10,
      };

      const result = createFundingPsbt(params);

      expect(result.psbtBase64).toBeTruthy();
      expect(result.psbtHex).toBeTruthy();
      expect(result.totalInput).toBe(100000);
      expect(result.estimatedFee).toBeGreaterThan(0);
      expect(result.totalOutput).toBeLessThanOrEqual(100000);

      // Should be able to decode the PSBT
      expect(() =>
        bitcoin.Psbt.fromBase64(result.psbtBase64, { network: testnetNetwork }),
      ).not.toThrow();
    });

    it('should create PSBT with change output when change address provided', () => {
      const input = createDummyUtxo(100000);
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000,
      };

      const params: CreatePsbtParams = {
        inputs: [input],
        outputs: [output],
        feeRate: 10,
        changeAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      const result = createFundingPsbt(params);

      expect(result.changeAmount).toBeGreaterThan(0);

      // Decode PSBT and verify it has 2 outputs (payment + change)
      const psbt = bitcoin.Psbt.fromBase64(result.psbtBase64, { network: testnetNetwork });
      expect(psbt.txOutputs).toHaveLength(2);
    });

    it('should handle multiple inputs', () => {
      const input1 = createDummyUtxo(50000);
      const input2 = createDummyUtxo(60000);
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 80000,
      };

      const params: CreatePsbtParams = {
        inputs: [input1, input2],
        outputs: [output],
        feeRate: 10,
      };

      const result = createFundingPsbt(params);

      expect(result.totalInput).toBe(110000);

      // Decode PSBT and verify it has 2 inputs
      const psbt = bitcoin.Psbt.fromBase64(result.psbtBase64, { network: testnetNetwork });
      expect(psbt.inputCount).toBe(2);
    });

    it('should throw error when insufficient funds', () => {
      const input = createDummyUtxo(10000); // Small input
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000, // Large output
      };

      const params: CreatePsbtParams = {
        inputs: [input],
        outputs: [output],
        feeRate: 10,
      };

      expect(() => createFundingPsbt(params)).toThrow('Insufficient funds');
    });

    it('should throw error with empty inputs', () => {
      const params: CreatePsbtParams = {
        inputs: [],
        outputs: [
          {
            address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
            value: 50000,
          },
        ],
      };

      expect(() => createFundingPsbt(params)).toThrow('At least one input is required');
    });

    it('should throw error with empty outputs', () => {
      const params: CreatePsbtParams = {
        inputs: [createDummyUtxo()],
        outputs: [],
      };

      expect(() => createFundingPsbt(params)).toThrow('At least one output is required');
    });
  });

  describe('validatePsbt', () => {
    it('should validate a valid PSBT base64', () => {
      const input = createDummyUtxo(100000);
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000,
      };

      const result = createFundingPsbt({
        inputs: [input],
        outputs: [output],
      });

      const validation = validatePsbt(result.psbtBase64);
      expect(validation.isValid).toBe(true);
      expect(validation.format).toBe('base64');
    });

    it('should validate a valid PSBT hex', () => {
      const input = createDummyUtxo(100000);
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000,
      };

      const result = createFundingPsbt({
        inputs: [input],
        outputs: [output],
      });

      const validation = validatePsbt(result.psbtHex);
      expect(validation.isValid).toBe(true);
      expect(validation.format).toBe('hex');
    });

    it('should reject invalid PSBT', () => {
      const validation = validatePsbt('invalid-psbt-string');
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeTruthy();
    });
  });

  describe('getPsbtInfo', () => {
    it('should extract correct information from PSBT', () => {
      const input = createDummyUtxo(100000);
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000,
      };

      const result = createFundingPsbt({
        inputs: [input],
        outputs: [output],
      });

      const info = getPsbtInfo(result.psbtBase64);

      expect(info.inputCount).toBe(1);
      expect(info.outputCount).toBe(1);
      expect(info.totalInput).toBe(100000);
      expect(info.totalOutput).toBe(50000);
      expect(info.fee).toBeGreaterThan(0);
      expect(info.format).toBe('base64');
    });

    it('should handle PSBT hex format', () => {
      const input = createDummyUtxo(100000);
      const output: TxOutput = {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000,
      };

      const result = createFundingPsbt({
        inputs: [input],
        outputs: [output],
      });

      const info = getPsbtInfo(result.psbtHex);
      expect(info.format).toBe('hex');
    });

    it('should throw error for invalid PSBT', () => {
      expect(() => getPsbtInfo('invalid-psbt')).toThrow('Invalid PSBT format');
    });
  });
});
