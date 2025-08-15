import { describe, test, expect } from 'vitest';
import { ParserError, withTimeout, validateHexBounds, validateAsciiLength } from '../defensiveParsing';

describe('Defensive parsing and timeouts (A6 client parity)', () => {
  describe('ParserError types', () => {
    test('ParserError.InvalidInput has correct type and message', () => {
      const error = new ParserError.InvalidInput('malformed hex data');
      expect(error.name).toBe('ParserError.InvalidInput');
      expect(error.message).toBe('malformed hex data');
      expect(error.code).toBe('INVALID_INPUT');
    });

    test('ParserError.BoundsExceeded has correct type and message', () => {
      const error = new ParserError.BoundsExceeded('payload too large', { limit: 1000, actual: 2000 });
      expect(error.name).toBe('ParserError.BoundsExceeded');
      expect(error.message).toBe('payload too large');
      expect(error.code).toBe('BOUNDS_EXCEEDED');
      expect(error.details).toEqual({ limit: 1000, actual: 2000 });
    });

    test('ParserError.Timeout has correct type and message', () => {
      const error = new ParserError.Timeout('operation timed out', { timeoutMs: 5000 });
      expect(error.name).toBe('ParserError.Timeout');
      expect(error.message).toBe('operation timed out');
      expect(error.code).toBe('TIMEOUT');
      expect(error.details).toEqual({ timeoutMs: 5000 });
    });
  });

  describe('withTimeout utility', () => {
    test('resolves when promise completes within timeout', async () => {
      const fastPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('success'), 10);
      });
      
      const result = await withTimeout(fastPromise, 100);
      expect(result).toBe('success');
    });

    test('throws ParserError.Timeout when promise exceeds timeout', async () => {
      const slowPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('too-late'), 200);
      });
      
      await expect(withTimeout(slowPromise, 50)).rejects.toThrow(ParserError.Timeout);
      await expect(withTimeout(slowPromise, 50)).rejects.toMatchObject({
        code: 'TIMEOUT',
        details: { timeoutMs: 50 }
      });
    });

    test('propagates rejection from underlying promise', async () => {
      const failingPromise = Promise.reject(new Error('network error'));
      
      await expect(withTimeout(failingPromise, 100)).rejects.toThrow('network error');
    });
  });

  describe('validateHexBounds', () => {
    test('accepts hex within bounds', () => {
      expect(() => validateHexBounds('abcd1234', 8)).not.toThrow();
      expect(() => validateHexBounds('ff', 4)).not.toThrow();
    });

    test('throws ParserError.BoundsExceeded when hex exceeds limit', () => {
      const longHex = 'a'.repeat(200);
      expect(() => validateHexBounds(longHex, 100)).toThrow(ParserError.BoundsExceeded);
      
      try {
        validateHexBounds(longHex, 100);
      } catch (error) {
        expect(error).toBeInstanceOf(ParserError.BoundsExceeded);
        expect((error as any).details).toEqual({ limit: 100, actual: 200 });
      }
    });

    test('throws ParserError.InvalidInput for non-hex input', () => {
      expect(() => validateHexBounds('xyz123', 10)).toThrow(ParserError.InvalidInput);
      expect(() => validateHexBounds('abcd12g', 10)).toThrow(ParserError.InvalidInput);
    });
  });

  describe('validateAsciiLength', () => {
    test('accepts ASCII within length limit', () => {
      expect(() => validateAsciiLength('hello world', 20)).not.toThrow();
      expect(() => validateAsciiLength('', 5)).not.toThrow();
    });

    test('throws ParserError.BoundsExceeded when ASCII exceeds limit', () => {
      const longText = 'x'.repeat(300);
      expect(() => validateAsciiLength(longText, 256)).toThrow(ParserError.BoundsExceeded);
      
      try {
        validateAsciiLength(longText, 256);
      } catch (error) {
        expect(error).toBeInstanceOf(ParserError.BoundsExceeded);
        expect((error as any).details).toEqual({ limit: 256, actual: 300 });
      }
    });

    test('throws ParserError.InvalidInput for non-ASCII characters', () => {
      expect(() => validateAsciiLength('hello\u00ff', 10)).toThrow(ParserError.InvalidInput);
      expect(() => validateAsciiLength('测试', 10)).toThrow(ParserError.InvalidInput);
    });
  });
});
