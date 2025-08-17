/** 
 * Standardized registration data structures for consistent API boundaries
 * between client and server. Part of B2 refactor for shape consistency.
 */

/** 
 * Core registration fields from buyer_registration.v1 schema
 * Extended with derived fields for API responses
 */
export interface RegistrationRecord {
  /** Registration schema version */
  schema: string;
  /** Parent NFT inscription ID */
  parent: string;
  /** Creator address that was paid */
  paid_to: string;
  /** Fee amount in satoshis */
  fee_sats: number;
  /** Transaction ID of the fee payment */
  txid: string;
  /** ISO8601 timestamp of registration */
  timestamp: string;
  
  // Derived fields for API responses
  /** Transaction ID of the fee payment (normalized field name) */
  feeTxid: string;
  /** Amount paid in satoshis (normalized field name) */
  amount: number;
  /** Child inscription ID containing this registration */
  childId?: string | undefined;
}

/**
 * Create a standardized RegistrationRecord from raw registration data
 * Normalizes field names and ensures required derived fields are present
 */
export function normalizeRegistration(raw: unknown): RegistrationRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  
  const obj = raw as Record<string, unknown>;
  
  // Validate required schema fields
  if (obj['schema'] !== 'buyer_registration.v1' ||
      typeof obj['parent'] !== 'string' ||
      typeof obj['paid_to'] !== 'string' ||
      typeof obj['fee_sats'] !== 'number' ||
      typeof obj['txid'] !== 'string' ||
      typeof obj['timestamp'] !== 'string') {
    return null;
  }

  return {
    schema: obj['schema'],
    parent: obj['parent'],
    paid_to: obj['paid_to'],
    fee_sats: obj['fee_sats'],
    txid: obj['txid'],
    timestamp: obj['timestamp'],
    // Derived normalized fields
    feeTxid: obj['txid'],
    amount: obj['fee_sats'],
    childId: typeof obj['childId'] === 'string' ? obj['childId'] : undefined,
  };
}
