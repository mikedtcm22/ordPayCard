/** Shared types for registration parser utilities */

export type FetchMeta = (inscriptionId: string) => Promise<any>;
export type FetchTx = (txid: string) => Promise<any>;

export interface LastTransferDeps {
  fetchMeta: FetchMeta;
  fetchTx: FetchTx;
  nowMs?: () => number;
}

export interface ParsedOpReturnPayload {
  nftId: string;
  expiryBlock: number;
}

export type SupportedNetwork = 'regtest' | 'signet' | 'testnet' | 'mainnet';

export interface VerifyPaymentOptions {
  currentBlock: number;
  network: SupportedNetwork;
  minBlock?: number;
  /** Height of the tx's block when known (used for minBlock gating) */
  txBlockHeight?: number;
  /** Fetch raw tx hex when a txid is provided */
  fetchTx?: (txid: string) => Promise<string>;
  /** Optional timeout wrapper to be used with fetchTx (wired in A6) */
  withTimeout?: <T>(p: Promise<T>, ms: number) => Promise<T>;
  /** Timeout in ms for fetchTx when withTimeout is provided */
  fetchTimeoutMs?: number;
}


