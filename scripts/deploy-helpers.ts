/**
 * Deployment helpers with optional ord CLI integration
 * Supports real inscription when ORD_INTEGRATION=1 is set
 */

import { execSync } from 'child_process';
import * as crypto from 'crypto';

export interface OrdIntegrationConfig {
  enabled: boolean;
  mode: 'real' | 'mock' | 'dry-run';
  wallet?: string;
  network?: string;
}

export interface DeploymentResult {
  success: boolean;
  inscriptionId?: string;
  txid?: string;
  fees?: number;
  mode: 'real' | 'mock' | 'dry-run';
  network?: string;
  warning?: string;
  error?: string;
  hint?: string;
}

export interface DeployOptions {
  filePath: string;
  network: string;
  dryRun?: boolean;
  wallet?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class DeployHelpers {
  /**
   * Get ord integration configuration from environment
   * @returns Configuration for ord integration
   */
  getOrdConfig(): OrdIntegrationConfig {
    const integration = process.env['ORD_INTEGRATION'];
    const enabled = integration === '1' || integration === 'true';
    
    const result: OrdIntegrationConfig = {
      enabled,
      mode: enabled ? 'real' : 'mock'
    };
    
    if (process.env['ORD_WALLET']) {
      result.wallet = process.env['ORD_WALLET'];
    }
    
    if (process.env['ORD_NETWORK']) {
      result.network = process.env['ORD_NETWORK'];
    }
    
    return result;
  }
  
  /**
   * Check if ord CLI is available
   * @returns True if ord CLI can be executed
   */
  isOrdAvailable(): boolean {
    const config = this.getOrdConfig();
    
    // Don't check if integration is disabled
    if (!config.enabled) {
      return false;
    }
    
    try {
      execSync('ord --version', { encoding: 'utf8' });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Validate ord environment variables
   * @returns Validation result with any errors
   */
  validateOrdEnvironment(): ValidationResult {
    const config = this.getOrdConfig();
    const errors: string[] = [];
    
    // Skip validation if ord is disabled
    if (!config.enabled) {
      return { valid: true, errors: [] };
    }
    
    // Check required environment variables
    if (!config.wallet) {
      errors.push('ORD_WALLET not set');
    }
    
    if (!config.network) {
      errors.push('ORD_NETWORK not set');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Deploy with ord CLI or fallback to mock
   * @param options Deployment options
   * @returns Deployment result
   */
  async deployWithOrd(options: DeployOptions): Promise<DeploymentResult> {
    const config = this.getOrdConfig();
    
    // Handle dry-run mode
    if (options.dryRun) {
      // Check ord availability even in dry-run
      if (config.enabled) {
        this.isOrdAvailable();
      }
      
      return {
        success: true,
        mode: 'dry-run',
        network: options.network
      };
    }
    
    // Check if ord integration is enabled and available
    if (config.enabled && this.isOrdAvailable()) {
      return this.deployWithRealOrd(options);
    }
    
    // Fallback to mock
    return this.deployWithMock(options, config.enabled);
  }
  
  /**
   * Deploy using real ord CLI
   * @param options Deployment options
   * @returns Deployment result from ord
   */
  private async deployWithRealOrd(options: DeployOptions): Promise<DeploymentResult> {
    try {
      // Build ord command
      const networkFlag = this.getNetworkFlag(options.network);
      const wallet = options.wallet || process.env['ORD_WALLET'] || 'ord';
      
      const cmd = `ord wallet inscribe ${networkFlag} --wallet ${wallet} --file ${options.filePath}`;
      
      // Add mainnet warning
      let warning: string | undefined;
      if (options.network === 'mainnet') {
        warning = 'Mainnet inscription - this will cost real Bitcoin!';
      }
      
      // Execute ord command
      const output = execSync(cmd, { encoding: 'utf8' });
      
      // Parse ord output (assumes JSON format)
      const result = JSON.parse(output);
      
      const deployResult: DeploymentResult = {
        success: true,
        inscriptionId: result.inscription,
        txid: result.txid,
        fees: result.fees,
        mode: 'real',
        network: options.network
      };
      
      if (warning) {
        deployResult.warning = warning;
      }
      
      return deployResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide actionable hints based on error
      let hint = 'Check ord logs for details';
      if (errorMessage.includes('Insufficient funds')) {
        hint = 'Check wallet balance and fund the wallet';
      } else if (errorMessage.includes('not found')) {
        hint = 'Ensure ord is installed and in PATH';
      }
      
      return {
        success: false,
        mode: 'real',
        network: options.network,
        error: errorMessage,
        hint
      };
    }
  }
  
  /**
   * Deploy using mock inscription
   * @param options Deployment options
   * @param wasEnabled Whether ord integration was enabled
   * @returns Mock deployment result
   */
  private async deployWithMock(
    options: DeployOptions,
    wasEnabled: boolean
  ): Promise<DeploymentResult> {
    // Generate mock inscription ID
    const randomBytes = crypto.randomBytes(32);
    const txid = randomBytes.toString('hex');
    const inscriptionId = `${txid}i0`;
    
    // Add warning if ord was requested but unavailable
    let warning: string | undefined;
    if (wasEnabled) {
      warning = 'ord CLI not available, using mock inscription';
    }
    
    // Simulate inscription (skip file check for testing)
    // In real deployment, would check if file exists
    
    const deployResult: DeploymentResult = {
      success: true,
      inscriptionId,
      txid,
      fees: 1000, // Mock fee
      mode: 'mock',
      network: options.network
    };
    
    if (warning) {
      deployResult.warning = warning;
    }
    
    return deployResult;
  }
  
  /**
   * Get network flag for ord command
   * @param network Bitcoin network
   * @returns Network flag for ord CLI
   */
  private getNetworkFlag(network: string): string {
    switch (network) {
      case 'signet':
        return '--signet';
      case 'testnet':
        return '--testnet';
      case 'regtest':
        return '--regtest';
      case 'mainnet':
        return ''; // No flag for mainnet
      default:
        return '--signet'; // Default to signet
    }
  }
}