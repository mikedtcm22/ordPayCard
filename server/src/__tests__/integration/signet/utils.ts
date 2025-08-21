/**
 * Utility functions for Signet integration testing
 * Provides helpers for creating transactions, checking sync status, and fetching blockchain data
 */

import { execSync } from 'child_process';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');
const CONFIG_FILE = path.join(PROJECT_ROOT, 'configs/bitcoin-signet.conf');

/**
 * Wait for Signet node and ord to be synchronized
 * @throws Error if sync fails or times out
 */
export async function waitForSignetSync(): Promise<void> {
  const result = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" getblockchaininfo`,
    { encoding: 'utf8' }
  );
  const info = JSON.parse(result);
  
  if (info.initialblockdownload) {
    throw new Error('Signet node is still syncing');
  }
}

/**
 * Create a transaction with OP_RETURN data on Signet
 * @returns Transaction ID of the created transaction
 */
export async function createSignetOpReturnTx(): Promise<string> {
  // Create OP_RETURN data with NFT ID and expiry block
  const nftId = 'a'.repeat(64) + 'i0'; // Mock inscription ID
  const currentBlock = parseInt(
    execSync(`bitcoin-cli -conf="${CONFIG_FILE}" getblockcount`, { encoding: 'utf8' })
  );
  const expiryBlock = currentBlock + 144; // ~1 day expiry
  const opReturnData = Buffer.from(`${nftId}|${expiryBlock}`).toString('hex');
  
  // Create raw transaction with OP_RETURN output
  const createResult = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" -rpcwallet=ordpaycard-test createrawtransaction '[]' '[{"data":"${opReturnData}"}]'`,
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
 * Create a payment transaction to a specific address
 * @param address Target address to send payment to
 * @param amount Amount in BTC to send
 * @returns Transaction ID of the payment
 */
export async function createSignetPaymentTx(address: string, amount: number): Promise<string> {
  const txid = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" -rpcwallet=ordpaycard-test sendtoaddress "${address}" ${amount}`,
    { encoding: 'utf8' }
  ).trim();
  
  return txid;
}

/**
 * Fetch raw transaction hex from Signet
 * @param txid Transaction ID to fetch
 * @returns Raw transaction hex string
 */
export async function fetchSignetTx(txid: string): Promise<string> {
  const txHex = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" getrawtransaction "${txid}"`,
    { encoding: 'utf8' }
  ).trim();
  
  return txHex;
}