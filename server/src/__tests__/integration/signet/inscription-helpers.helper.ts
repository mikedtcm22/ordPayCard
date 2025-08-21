/**
 * Helper functions for working with inscriptions on Signet
 * Provides utilities for creating inscriptions and managing test data
 */

import { execSync } from 'child_process';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');
const CONFIG_FILE = path.join(PROJECT_ROOT, 'configs/bitcoin-signet.conf');

/**
 * Mock inscription creation on Signet
 * In a real implementation, this would use ord CLI
 * @param _content HTML content to inscribe (unused in mock)
 * @returns Inscription ID
 */
export async function inscribeOnSignet(_content: string): Promise<string> {
  // For testing, we'll create a mock inscription ID
  // In production, this would use: ord --signet wallet inscribe <file>
  const randomHex = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  return `${randomHex}i0`;
}

/**
 * Create a payment transaction to a parent inscription creator
 * @param parentId Parent inscription ID to pay
 * @param _blockOffset Optional block offset for simulating old payments (unused)
 * @returns Transaction ID of the payment
 */
export async function createSignetPayment(
  parentId: string, 
  _blockOffset: number = 0
): Promise<string> {
  
  // Get current block
  const currentBlock = await getCurrentBlockHeight();
  const expiryBlock = currentBlock + 144; // 1 day expiry
  
  // Create OP_RETURN data
  const opReturnData = Buffer.from(`${parentId}|${expiryBlock}`).toString('hex');
  
  // Create transaction with OP_RETURN
  const createResult = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" -rpcwallet=ordpaycard-test createrawtransaction '[]' '[{"data":"${opReturnData}"},{"tb1qz3kmh8r2ezsqkhes255wrlslk027n0sf0luukq":0.00001}]'`,
    { encoding: 'utf8' }
  ).trim();
  
  // Fund the transaction
  const fundResult = JSON.parse(
    execSync(
      `bitcoin-cli -conf="${CONFIG_FILE}" -rpcwallet=ordpaycard-test fundrawtransaction "${createResult}"`,
      { encoding: 'utf8' }
    )
  );
  
  // Sign the transaction
  const signResult = JSON.parse(
    execSync(
      `bitcoin-cli -conf="${CONFIG_FILE}" -rpcwallet=ordpaycard-test signrawtransactionwithwallet "${fundResult.hex}"`,
      { encoding: 'utf8' }
    )
  );
  
  // Send the transaction
  const txid = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" sendrawtransaction "${signResult.hex}"`,
    { encoding: 'utf8' }
  ).trim();
  
  return txid;
}

/**
 * Mock child inscription creation
 * @param _parentId Parent inscription ID (unused in mock)
 * @param _receipt Registration receipt data (unused in mock)
 * @returns Child inscription ID
 */
export async function inscribeChild(
  _parentId: string,
  _receipt: { feeTxid: string }
): Promise<string> {
  // For testing, create a mock child inscription ID
  // In production, this would use ord to inscribe the child
  const randomHex = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  return `${randomHex}i0`;
}

/**
 * Get current Signet block height
 * @returns Current block height
 */
export async function getCurrentBlockHeight(): Promise<number> {
  const blockCount = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" getblockcount`,
    { encoding: 'utf8' }
  ).trim();
  
  return parseInt(blockCount, 10);
}

/**
 * Wait for transaction confirmations
 * @param _txid Transaction ID to wait for (unused in mock)
 * @param _confirmations Number of confirmations to wait for (unused in mock)
 */
export async function waitForConfirmations(
  _txid: string,
  _confirmations: number
): Promise<void> {
  // For testing, we'll skip waiting
  // In production, this would poll bitcoin-cli gettransaction
  return;
}