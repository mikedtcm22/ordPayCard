/**
 * Environment variable validation utility
 * Validates required environment variables and provides defaults
 */

import { isValidAddress } from './addressValidation';
import * as bitcoin from 'bitcoinjs-lib';

interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  BITCOIN_NETWORK: 'testnet' | 'signet';
  TREASURY_ADDRESS: string;
  ORDINALS_API_URL: string;
  CLIENT_URL: string;
  REGISTRY_API_URL: string;
  CREATOR_WALLET: string;
  REGISTRATION_FEE_SATS: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  DB_PATH: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
}

/**
 * Validates and returns environment configuration
 * @throws Error if required environment variables are missing
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // For development, don't require all variables
  const requiredVars =
    process.env['NODE_ENV'] === 'production' ? ['JWT_SECRET', 'TREASURY_ADDRESS'] : [];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const bitcoinNetwork = (process.env['BITCOIN_NETWORK'] || 'testnet') as 'testnet' | 'signet';

  // Validate Bitcoin network
  if (!['testnet', 'signet'].includes(bitcoinNetwork)) {
    throw new Error(`Invalid BITCOIN_NETWORK: ${bitcoinNetwork}. Must be 'testnet' or 'signet'`);
  }

  const config: EnvironmentConfig = {
    PORT: parseInt(process.env['PORT'] || '3001', 10),
    NODE_ENV: process.env['NODE_ENV'] || 'development',
    BITCOIN_NETWORK: bitcoinNetwork,
    TREASURY_ADDRESS: process.env['TREASURY_ADDRESS'] || '',
    ORDINALS_API_URL: process.env['ORDINALS_API_URL'] || 'https://api.hiro.so',
    CLIENT_URL: process.env['CLIENT_URL'] || 'http://localhost:3000',
    REGISTRY_API_URL: process.env['REGISTRY_API_URL'] || 'http://localhost:3001/api/registration',
    CREATOR_WALLET: process.env['CREATOR_WALLET'] || '',
    REGISTRATION_FEE_SATS: parseInt(process.env['REGISTRATION_FEE_SATS'] || '50000', 10),
    JWT_SECRET: process.env['JWT_SECRET'] || 'dev-secret-change-in-production',
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '24h',
    DB_PATH: process.env['DB_PATH'] || './data/satspray.db',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
    LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  };

  // Validate treasury address if provided
  if (config.TREASURY_ADDRESS) {
    const network =
      bitcoinNetwork === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.testnet;
    if (!isValidAddress(config.TREASURY_ADDRESS, network)) {
      throw new Error(`Invalid TREASURY_ADDRESS: ${config.TREASURY_ADDRESS}`);
    }
  }

  // Validate ordinals API URL
  try {
    new URL(config.ORDINALS_API_URL);
  } catch {
    throw new Error(`Invalid ORDINALS_API_URL: ${config.ORDINALS_API_URL}`);
  }

  // Validate registry API URL
  try {
    new URL(config.REGISTRY_API_URL);
  } catch {
    throw new Error(`Invalid REGISTRY_API_URL: ${config.REGISTRY_API_URL}`);
  }

  return config;
}

/**
 * Validates Bitcoin network configuration
 */
export function validateBitcoinNetwork(network: string): boolean {
  const validNetworks = ['testnet', 'signet'];
  return validNetworks.includes(network);
}

/**
 * Environment validation with comprehensive checks
 */
export function validateEnvironment(): void {
  try {
    const config = getEnvironmentConfig();
    console.log('✅ Environment validation passed');
    console.log(`   Network: ${config.BITCOIN_NETWORK}`);
    console.log(`   API URL: ${config.ORDINALS_API_URL}`);
    if (config.TREASURY_ADDRESS) {
      console.log(`   Treasury: ${config.TREASURY_ADDRESS}`);
    }
  } catch (error) {
    console.error(
      '❌ Environment validation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    throw error;
  }
}
