/**
 * Template utilities for E2E registration testing on Signet
 * Provides functions for template generation, inscription, and validation
 */

import { execSync } from 'child_process';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');
const CONFIG_FILE = path.join(PROJECT_ROOT, 'configs/bitcoin-signet.conf');

/**
 * Generate a registration template with specified parameters
 * @param creatorAddress Address to receive registration fees
 * @param feeAmount Amount in sats required for registration
 * @returns HTML template string
 */
export function generateTemplate(creatorAddress: string, feeAmount: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Registration Template</title>
</head>
<body>
  <h1>Membership Registration</h1>
  <p>Creator: ${creatorAddress}</p>
  <p>Fee: ${feeAmount} sats</p>
  <div id="status">Pending</div>
  <script>
    // Mock EmbersCore functionality
    window.EmbersCore = {
      verifyPayment: () => ({ amount: ${feeAmount}n }),
      dedupe: (arr) => arr
    };
  </script>
</body>
</html>`;
}

/**
 * Mock inscription creation on Signet
 * @param content HTML content to inscribe
 * @returns Inscription ID
 */
export async function inscribeOnSignet(content: string): Promise<string> {
  // For testing, create a mock inscription ID
  // In production, this would use ord CLI
  const randomHex = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  // Store content for later rendering simulation
  global.__testTemplates = global.__testTemplates || {};
  global.__testTemplates[`${randomHex}i0`] = content;
  
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
 * Create transaction with OP_RETURN data
 * @param opReturnData Data to embed in OP_RETURN
 * @param toAddress Address to send payment to
 * @param amount Amount in BTC to send
 * @returns Transaction ID
 */
export async function createTxWithOpReturn(
  opReturnData: string,
  toAddress: string,
  amount: number
): Promise<string> {
  // Convert string to hex for OP_RETURN
  const dataHex = Buffer.from(opReturnData).toString('hex');
  
  // Create raw transaction with OP_RETURN and payment output
  const createResult = execSync(
    `bitcoin-cli -conf="${CONFIG_FILE}" -rpcwallet=ordpaycard-test createrawtransaction '[]' '[{"data":"${dataHex}"},{"${toAddress}":${amount}}]'`,
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
 * @param parentId Parent inscription ID
 * @param receipt Registration receipt
 * @returns Child inscription ID
 */
export async function inscribeChild(
  parentId: string,
  receipt: { feeTxid: string; timestamp: number }
): Promise<string> {
  // Mock child inscription with receipt data
  const randomHex = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  // Store parent-child relationship for testing
  global.__testChildren = global.__testChildren || {};
  global.__testChildren[parentId] = global.__testChildren[parentId] || [];
  global.__testChildren[parentId].push({
    id: `${randomHex}i0`,
    receipt
  });
  
  return `${randomHex}i0`;
}

/**
 * Wait for transaction confirmations
 * @param txid Transaction ID to wait for
 * @param confirmations Number of confirmations required
 */
export async function waitForConfirmations(
  _txid: string,
  _confirmations: number
): Promise<void> {
  // For testing, we skip waiting
  // In production, this would poll for confirmations
  return;
}

/**
 * Fetch registration status for a parent inscription
 * @param parentId Parent inscription ID
 * @returns Registration status object
 */
export async function fetchRegistrationStatus(
  parentId: string
): Promise<{ isRegistered: boolean }> {
  // Mock status check based on stored test data
  const children = global.__testChildren?.[parentId] || [];
  const isRegistered = children.length > 0;
  
  return { isRegistered };
}

/**
 * Render template to simulate browser behavior
 * @param parentId Parent inscription ID
 * @returns Rendered HTML with status
 */
export async function renderTemplate(parentId: string): Promise<string> {
  // Get stored template content
  const content = global.__testTemplates?.[parentId] || '';
  
  // Check if registration exists
  const children = global.__testChildren?.[parentId] || [];
  const isActive = children.length > 0;
  
  // Simulate rendering with status update
  if (isActive) {
    return content.replace('Pending', 'Active');
  }
  
  return content;
}

// TypeScript declarations for global test storage
declare global {
  var __testTemplates: Record<string, string>;
  var __testChildren: Record<string, Array<{ id: string; receipt: any }>>;
}