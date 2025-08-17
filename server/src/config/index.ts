/**
 * @fileoverview Centralized configuration module for all application settings
 * @module config
 */

interface CacheConfig {
  ttl: number;
  maxSize: number;
}

interface RegistrationConfig {
  cache: CacheConfig;
  endpoints: {
    ordinalsApi: string;
    metadataPath: string;
    childrenPath: string;
    txPath: string;
    contentPath: string;
  };
  timeouts: {
    fetch: number;
    cache: number;
  };
  fees: {
    registrationSats: number;
    creatorWallet: string;
  };
  provenance: {
    windowK: number;
    currentBlockHeight: number;
  };
}

interface NetworkConfig {
  bitcoin: 'mainnet' | 'testnet' | 'signet' | 'regtest';
  ordinalsApiUrl: string;
}

interface CacheTypeConfig {
  status: CacheConfig;
  metadata: CacheConfig;
  children: CacheConfig;
}

export interface AppConfig {
  registration: RegistrationConfig;
  network: NetworkConfig;
  cache: CacheTypeConfig;
  export(): object;
  toJSON(): string;
}

export interface ConfigUpdates {
  registration?: Partial<RegistrationConfig>;
  network?: Partial<NetworkConfig>;
  cache?: Partial<CacheTypeConfig>;
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadDefaultConfig();
    this.applyEnvironmentVariables();
  }

  private loadDefaultConfig(): AppConfig {
    const baseConfig = {
      registration: {
        cache: {
          ttl: 30000, // 30 seconds
          maxSize: 1000
        },
        endpoints: {
          ordinalsApi: 'http://localhost:8080',
          metadataPath: '/r/metadata/',
          childrenPath: '/r/children/',
          txPath: '/r/tx/',
          contentPath: '/content/'
        },
        timeouts: {
          fetch: 5000,
          cache: 30000
        },
        fees: {
          registrationSats: 50000,
          creatorWallet: ''
        },
        provenance: {
          windowK: 1,
          currentBlockHeight: 1000
        }
      },
      network: {
        bitcoin: 'regtest' as const,
        ordinalsApiUrl: 'http://localhost:8080'
      },
      cache: {
        status: {
          ttl: 30000,
          maxSize: 1000
        },
        metadata: {
          ttl: 300000, // 5 minutes
          maxSize: 500
        },
        children: {
          ttl: 60000, // 1 minute
          maxSize: 500
        }
      },
      export: () => this.exportConfig(),
      toJSON: () => {
        // Serialize without the methods to avoid circular reference
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { export: _export, toJSON: _toJSON, ...configData } = this.config;
        return JSON.stringify(configData, null, 2);
      }
    };

    return baseConfig;
  }

  private applyEnvironmentVariables(): void {
    // Apply ordinals API URL
    if (process.env['ORDINALS_API_URL']) {
      this.config.registration.endpoints.ordinalsApi = process.env['ORDINALS_API_URL'];
      this.config.network.ordinalsApiUrl = process.env['ORDINALS_API_URL'];
    }

    // Apply registration fees
    if (process.env['REGISTRATION_FEE_SATS']) {
      this.config.registration.fees.registrationSats = parseInt(process.env['REGISTRATION_FEE_SATS'], 10);
    }

    if (process.env['CREATOR_WALLET']) {
      this.config.registration.fees.creatorWallet = process.env['CREATOR_WALLET'];
    }

    // Apply provenance settings
    if (process.env['PROVENANCE_WINDOW_K']) {
      this.config.registration.provenance.windowK = parseInt(process.env['PROVENANCE_WINDOW_K'], 10);
    }

    if (process.env['CURRENT_BLOCK_HEIGHT']) {
      this.config.registration.provenance.currentBlockHeight = parseInt(process.env['CURRENT_BLOCK_HEIGHT'], 10);
    }

    // Apply cache TTL
    if (process.env['CACHE_TTL_MS']) {
      const ttl = parseInt(process.env['CACHE_TTL_MS'], 10);
      this.config.registration.cache.ttl = ttl;
      this.config.cache.status.ttl = ttl;
    }

    // Apply Bitcoin network
    if (process.env['BITCOIN_NETWORK']) {
      const network = process.env['BITCOIN_NETWORK'];
      if (!['mainnet', 'testnet', 'signet', 'regtest'].includes(network)) {
        throw new Error(`Invalid Bitcoin network: ${network}`);
      }
      this.config.network.bitcoin = network as 'mainnet' | 'testnet' | 'signet' | 'regtest';
    }
  }

  private exportConfig(): object {
    // Export configuration without sensitive data
    const exported = {
      registration: {
        cache: { ...this.config.registration.cache },
        endpoints: { ...this.config.registration.endpoints },
        timeouts: { ...this.config.registration.timeouts },
        fees: {
          registrationSats: this.config.registration.fees.registrationSats
          // Omit creatorWallet for security
        },
        provenance: { ...this.config.registration.provenance }
      },
      network: { ...this.config.network },
      cache: {
        status: { ...this.config.cache.status },
        metadata: { ...this.config.cache.metadata },
        children: { ...this.config.cache.children }
      }
    };
    
    return exported;
  }

  private validateConfig(updates: ConfigUpdates): void {
    // Validate cache TTL
    if (updates.registration?.cache?.ttl !== undefined) {
      if (updates.registration.cache.ttl <= 0) {
        throw new Error('Invalid cache TTL: must be positive');
      }
    }

    // Validate registration fees
    if (updates.registration?.fees?.registrationSats !== undefined) {
      if (updates.registration.fees.registrationSats <= 0) {
        throw new Error('Invalid registration fee: must be positive');
      }
    }

    // Validate cache configs
    ['status', 'metadata', 'children'].forEach(cacheType => {
      if (updates.cache?.[cacheType]?.ttl !== undefined) {
        if (updates.cache[cacheType].ttl <= 0) {
          throw new Error(`Invalid ${cacheType} cache TTL: must be positive`);
        }
      }
    });
  }

  getConfig(): AppConfig {
    return this.config;
  }

  updateConfig(updates: ConfigUpdates): void {
    this.validateConfig(updates);
    
    // Deep merge updates into config
    if (updates.registration) {
      if (updates.registration.cache) {
        Object.assign(this.config.registration.cache, updates.registration.cache);
      }
      if (updates.registration.endpoints) {
        Object.assign(this.config.registration.endpoints, updates.registration.endpoints);
      }
      if (updates.registration.timeouts) {
        Object.assign(this.config.registration.timeouts, updates.registration.timeouts);
      }
      if (updates.registration.fees) {
        Object.assign(this.config.registration.fees, updates.registration.fees);
      }
      if (updates.registration.provenance) {
        Object.assign(this.config.registration.provenance, updates.registration.provenance);
      }
    }

    if (updates.network) {
      Object.assign(this.config.network, updates.network);
    }

    if (updates.cache) {
      if (updates.cache.status) {
        Object.assign(this.config.cache.status, updates.cache.status);
      }
      if (updates.cache.metadata) {
        Object.assign(this.config.cache.metadata, updates.cache.metadata);
      }
      if (updates.cache.children) {
        Object.assign(this.config.cache.children, updates.cache.children);
      }
    }
  }

  resetConfig(): void {
    this.config = this.loadDefaultConfig();
    this.applyEnvironmentVariables();
  }
}

// Singleton instance
let configManager: ConfigManager;

/**
 * Get the current configuration
 */
export function getConfig(): AppConfig {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  return configManager.getConfig();
}

/**
 * Update configuration at runtime
 */
export function updateConfig(updates: ConfigUpdates): void {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  configManager.updateConfig(updates);
}

/**
 * Reset configuration to defaults (with env vars applied)
 */
export function resetConfig(): void {
  configManager = new ConfigManager();
}