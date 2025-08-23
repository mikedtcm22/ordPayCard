/**
 * Tests for deployment verification script
 * Verifies inscription content post-deploy with checksum and logging
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { verifyDeployment, VerificationResult, VerificationError } from '../../../../scripts/verifyDeployment';
import * as crypto from 'crypto';

describe('verifyDeployment', () => {
  let fetchMock: ReturnType<typeof jest.fn>;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;
  
  beforeEach(() => {
    // Mock global fetch
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock environment variables
    process.env['BITCOIN_NETWORK'] = 'signet';
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete process.env['EMBERS_INSCRIPTION_ID_SIGNET'];
  });
  
  describe('successful verification', () => {
    it('should compute SHA-256 checksum and log verification details', async () => {
      // Arrange
      const inscriptionId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0';
      const scriptContent = 'console.log("embers-core v1.0.0");';
      const expectedChecksum = crypto
        .createHash('sha256')
        .update(scriptContent)
        .digest('hex');
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });
      
      // Act
      const result = await verifyDeployment({ inscriptionId });
      
      // Assert
      const expected: VerificationResult = {
        success: true,
        inscriptionId,
        txid: expect.stringMatching(/^[a-f0-9]{64}$/) as any,
        byteLength: Buffer.byteLength(scriptContent),
        checksum: expectedChecksum,
        network: 'signet'
      };
      expect(result).toEqual(expected);
      
      // Verify logging includes key information
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Verification successful')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Inscription ID: ${inscriptionId}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Checksum: ${expectedChecksum}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Size: ${Buffer.byteLength(scriptContent)} bytes`)
      );
    });
    
    it('should extract txid from inscription ID', async () => {
      // Arrange
      const txid = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';
      const inscriptionId = `${txid}i0`;
      const scriptContent = 'test content';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });
      
      // Act
      const result = await verifyDeployment({ inscriptionId });
      
      // Assert
      expect(result.txid).toBe(txid);
    });
  });
  
  describe('checksum mismatch', () => {
    it('should throw error with "checksum mismatch" message', async () => {
      // Arrange
      const inscriptionId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0';
      const fetchedContent = 'actual content';
      const expectedChecksum = 'wrong-checksum-value';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => fetchedContent
      });
      
      // Act & Assert
      await expect(
        verifyDeployment({ inscriptionId, expectedChecksum })
      ).rejects.toThrow('checksum mismatch');
      
      // Verify error logging
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Checksum mismatch')
      );
    });
    
    it('should exit with non-zero code when used as CLI', async () => {
      // Arrange
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('Process exit');
      }) as any);
      
      const inscriptionId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content'
      });
      
      // Act
      try {
        await verifyDeployment({ 
          inscriptionId, 
          expectedChecksum: 'wrong',
          isCLI: true 
        });
      } catch (e) {
        // Expected to throw
      }
      
      // Assert
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
  
  describe('input validation', () => {
    it('should accept --inscription flag or environment variable', async () => {
      // Arrange
      const inscriptionId = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890i0';
      process.env['EMBERS_INSCRIPTION_ID_SIGNET'] = inscriptionId;
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content'
      });
      
      // Act - no inscriptionId passed, should use env
      const result = await verifyDeployment({});
      
      // Assert
      expect(result.inscriptionId).toBe(inscriptionId);
    });
    
    it('should reject missing inscription ID with guidance', async () => {
      // Act & Assert
      await expect(verifyDeployment({})).rejects.toThrow(VerificationError);
      
      try {
        await verifyDeployment({});
      } catch (error) {
        expect((error as VerificationError).message).toContain('Missing inscription ID');
        expect((error as VerificationError).message).toContain('--inscription');
        expect((error as VerificationError).message).toContain('EMBERS_INSCRIPTION_ID');
      }
    });
    
    it('should reject invalid inscription ID format', async () => {
      // Act & Assert
      await expect(
        verifyDeployment({ inscriptionId: 'invalid-format' })
      ).rejects.toThrow('Invalid inscription ID format');
    });
  });
  
  describe('network errors and retries', () => {
    it('should retry transient HTTP errors with backoff', async () => {
      // Arrange
      const inscriptionId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0';
      const content = 'test content';
      
      // First two calls fail, third succeeds
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => content
        });
      
      // Mock timers for backoff
      jest.useFakeTimers();
      
      // Act
      const verifyPromise = verifyDeployment({ 
        inscriptionId,
        maxRetries: 3,
        retryDelay: 1000
      });
      
      // Advance timers for retries
      await jest.advanceTimersByTimeAsync(1000); // First retry
      await jest.advanceTimersByTimeAsync(2000); // Second retry (with backoff)
      
      const result = await verifyPromise;
      
      // Assert
      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      
      // Verify retry logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 2')
      );
      
      jest.useRealTimers();
    });
    
    it('should fail after max retries with clear error', async () => {
      // Arrange
      const inscriptionId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0';
      
      fetchMock.mockRejectedValue(new Error('Persistent network error'));
      
      // Act & Assert
      await expect(
        verifyDeployment({ 
          inscriptionId,
          maxRetries: 2,
          retryDelay: 100
        })
      ).rejects.toThrow('Failed to fetch inscription after 1 retries');
    });
  });
  
  describe('CLI wrapper', () => {
    it('should parse command line arguments', async () => {
      // Arrange
      const inscriptionId = 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321i0';
      const argv = ['node', 'verifyDeployment.ts', '--inscription', inscriptionId];
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content'
      });
      
      // Act
      const result = await verifyDeployment({ 
        inscriptionId,
        argv 
      });
      
      // Assert
      expect(result.inscriptionId).toBe(inscriptionId);
    });
    
    it('should support --network flag', async () => {
      // Arrange
      const argv = [
        'node', 'verifyDeployment.ts',
        '--inscription', '1111111111111111111111111111111111111111111111111111111111111111i0',
        '--network', 'mainnet'
      ];
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content'
      });
      
      // Act
      const result = await verifyDeployment({ argv });
      
      // Assert
      expect(result.network).toBe('mainnet');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('ordinals.com') // Mainnet URL
      );
    });
  });
  
  describe('structured output', () => {
    it('should emit JSON output when --json flag is used', async () => {
      // Arrange
      const inscriptionId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0';
      const scriptContent = 'test';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });
      
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      
      // Act
      await verifyDeployment({ 
        inscriptionId,
        json: true 
      });
      
      // Assert
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('"success": true')
      );
    });
  });
});