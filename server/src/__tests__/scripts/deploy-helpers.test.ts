/**
 * Tests for deployment helpers with ord CLI integration
 * Verifies feature flag behavior for real ord inscription
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { DeployHelpers } from '../../../../scripts/deploy-helpers';
import { execSync } from 'child_process';

// Mock child_process
jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('Deploy Helpers - ord CLI integration', () => {
  let helpers: DeployHelpers;
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment
    delete process.env['ORD_INTEGRATION'];
    delete process.env['ORD_WALLET'];
    delete process.env['ORD_NETWORK'];
    
    // Create helpers instance
    helpers = new DeployHelpers();
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });
  
  describe('feature flag detection', () => {
    it('should detect ORD_INTEGRATION=1 flag', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      
      // Act
      const config = helpers.getOrdConfig();
      
      // Assert
      expect(config.enabled).toBe(true);
      expect(config.mode).toBe('real');
    });
    
    it('should default to mock mode when flag is not set', () => {
      // Act
      const config = helpers.getOrdConfig();
      
      // Assert
      expect(config.enabled).toBe(false);
      expect(config.mode).toBe('mock');
    });
    
    it('should respect ORD_INTEGRATION=0 to explicitly disable', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '0';
      
      // Act
      const config = helpers.getOrdConfig();
      
      // Assert
      expect(config.enabled).toBe(false);
      expect(config.mode).toBe('mock');
    });
  });
  
  describe('ord availability check', () => {
    it('should check if ord CLI is available when integration enabled', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      mockExecSync.mockReturnValue(Buffer.from('ord 0.5.0\n'));
      
      // Act
      const available = helpers.isOrdAvailable();
      
      // Assert
      expect(available).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('ord --version', { encoding: 'utf8' });
    });
    
    it('should return false when ord CLI is not available', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found: ord');
      });
      
      // Act
      const available = helpers.isOrdAvailable();
      
      // Assert
      expect(available).toBe(false);
    });
    
    it('should not check ord availability when integration disabled', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '0';
      
      // Act
      const available = helpers.isOrdAvailable();
      
      // Assert
      expect(available).toBe(false);
      expect(mockExecSync).not.toHaveBeenCalled();
    });
  });
  
  describe('deployment with ord integration', () => {
    it('should use real ord CLI when available and enabled', async () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      process.env['ORD_WALLET'] = 'test-wallet';
      process.env['ORD_NETWORK'] = 'signet';
      
      // Mock ord available
      mockExecSync.mockImplementation(((cmd: string) => {
        if (cmd === 'ord --version') {
          return Buffer.from('ord 0.5.0\n');
        }
        if (cmd.includes('ord wallet inscribe')) {
          return Buffer.from('{"inscription":"abc123i0","fees":1000,"txid":"abc123"}\n');
        }
        return Buffer.from('');
      }) as any);
      
      // Act
      const result = await helpers.deployWithOrd({
        filePath: '/path/to/embers-core.js',
        network: 'signet'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.inscriptionId).toBe('abc123i0');
      expect(result.txid).toBe('abc123');
      expect(result.mode).toBe('real');
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('ord wallet inscribe'),
        expect.any(Object)
      );
    });
    
    it('should fallback to mock when ord unavailable but flag is set', async () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      
      // Mock ord not available
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found: ord');
      });
      
      // Act
      const result = await helpers.deployWithOrd({
        filePath: '/path/to/embers-core.js',
        network: 'signet'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.mode).toBe('mock');
      expect(result.warning).toContain('ord CLI not available');
      expect(result.inscriptionId).toMatch(/^[a-f0-9]{64}i0$/);
    });
    
    it('should surface actionable error when ord fails', async () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      
      // Mock ord available but inscription fails
      mockExecSync.mockImplementation(((cmd: string) => {
        if (cmd === 'ord --version') {
          return Buffer.from('ord 0.5.0\n');
        }
        if (cmd.includes('ord wallet inscribe')) {
          throw new Error('Insufficient funds');
        }
        return Buffer.from('');
      }) as any);
      
      // Act
      const result = await helpers.deployWithOrd({
        filePath: '/path/to/embers-core.js',
        network: 'signet'
      });
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
      expect(result.hint).toContain('Check wallet balance');
    });
  });
  
  describe('environment validation', () => {
    it('should validate required environment when ord enabled', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      // Missing ORD_WALLET
      
      // Act
      const validation = helpers.validateOrdEnvironment();
      
      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('ORD_WALLET not set');
    });
    
    it('should pass validation with all required vars', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      process.env['ORD_WALLET'] = 'test-wallet';
      process.env['ORD_NETWORK'] = 'signet';
      
      // Act
      const validation = helpers.validateOrdEnvironment();
      
      // Assert
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    it('should skip validation when ord disabled', () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '0';
      // No other env vars set
      
      // Act
      const validation = helpers.validateOrdEnvironment();
      
      // Assert
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
  
  describe('dry-run compatibility', () => {
    it('should respect dry-run mode even with ord enabled', async () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      mockExecSync.mockReturnValue(Buffer.from('ord 0.5.0\n'));
      
      // Act
      const result = await helpers.deployWithOrd({
        filePath: '/path/to/embers-core.js',
        network: 'signet',
        dryRun: true
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.mode).toBe('dry-run');
      expect(result.inscriptionId).toBeUndefined();
      expect(mockExecSync).toHaveBeenCalledWith('ord --version', { encoding: 'utf8' });
      expect(mockExecSync).not.toHaveBeenCalledWith(
        expect.stringContaining('ord wallet inscribe'),
        expect.any(Object)
      );
    });
  });
  
  describe('network-specific behavior', () => {
    it('should configure ord for correct network', async () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      process.env['ORD_WALLET'] = 'test-wallet';
      
      mockExecSync.mockImplementation(((cmd: string) => {
        if (cmd === 'ord --version') {
          return Buffer.from('ord 0.5.0\n');
        }
        if (cmd.includes('ord wallet inscribe')) {
          // Check that signet flag is present
          expect(cmd).toContain('--signet');
          return Buffer.from('{"inscription":"def456i0","fees":1000,"txid":"def456"}\n');
        }
        return Buffer.from('');
      }) as any);
      
      // Act
      const result = await helpers.deployWithOrd({
        filePath: '/path/to/embers-core.js',
        network: 'signet'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.network).toBe('signet');
    });
    
    it('should handle mainnet with appropriate warnings', async () => {
      // Arrange
      process.env['ORD_INTEGRATION'] = '1';
      process.env['ORD_WALLET'] = 'mainnet-wallet';
      
      mockExecSync.mockImplementation(((cmd: string) => {
        if (cmd === 'ord --version') {
          return Buffer.from('ord 0.5.0\n');
        }
        if (cmd.includes('ord wallet inscribe')) {
          // Mainnet has no network flag
          expect(cmd).not.toContain('--signet');
          expect(cmd).not.toContain('--testnet');
          return Buffer.from('{"inscription":"ghi789i0","fees":5000,"txid":"ghi789"}\n');
        }
        return Buffer.from('');
      }) as any);
      
      // Act
      const result = await helpers.deployWithOrd({
        filePath: '/path/to/embers-core.js',
        network: 'mainnet'
      });
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.network).toBe('mainnet');
      expect(result.warning).toContain('Mainnet inscription');
    });
  });
});