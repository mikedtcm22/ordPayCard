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


