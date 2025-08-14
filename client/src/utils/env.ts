/**
 * Environment variable validation utility for client
 * Validates required environment variables and provides defaults
 */

interface ClientEnvironmentConfig {
  API_URL: string;
  REGISTRY_API_URL: string;
  BITCOIN_NETWORK: string;
  DEV_MODE: boolean;
  ENABLE_LOGGING: boolean;
  SUPPORTED_WALLETS: string[];
  ENABLE_MANUAL_FLOWS: boolean;
  ENABLE_AUTO_POLLING: boolean;
}

/**
 * Validates and returns client environment configuration
 * @throws Error if required environment variables are missing
 */
export function getClientEnvironmentConfig(): ClientEnvironmentConfig {
  const requiredVars = ['VITE_API_URL'];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    API_URL: import.meta.env.VITE_API_URL!,
    REGISTRY_API_URL:
      import.meta.env.VITE_REGISTRY_API_URL || `${import.meta.env.VITE_API_URL}/registration`,
    BITCOIN_NETWORK: import.meta.env.VITE_BITCOIN_NETWORK || 'testnet',
    DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
    ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true',
    SUPPORTED_WALLETS: (import.meta.env.VITE_SUPPORTED_WALLETS || 'xverse,leather,unisat').split(
      ',',
    ),
    ENABLE_MANUAL_FLOWS: import.meta.env.VITE_ENABLE_MANUAL_FLOWS === 'true',
    ENABLE_AUTO_POLLING: import.meta.env.VITE_ENABLE_AUTO_POLLING === 'true',
  };
}

/**
 * Validates Bitcoin network configuration
 */
export function validateBitcoinNetwork(network: string): boolean {
  const validNetworks = ['mainnet', 'testnet', 'signet'];
  return validNetworks.includes(network);
}

/**
 * Validates API URL format
 */
export function validateApiUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets environment configuration with validation
 */
export function getValidatedConfig(): ClientEnvironmentConfig {
  const config = getClientEnvironmentConfig();

  if (!validateApiUrl(config.API_URL)) {
    throw new Error(`Invalid API URL: ${config.API_URL}`);
  }

  if (!validateBitcoinNetwork(config.BITCOIN_NETWORK)) {
    throw new Error(`Invalid Bitcoin network: ${config.BITCOIN_NETWORK}`);
  }

  return config;
}
