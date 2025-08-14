import { Transaction, address, networks, Network } from 'bitcoinjs-lib';
import type { SupportedNetwork } from './types';

function getBitcoinjsNetwork(net: SupportedNetwork): Network {
  switch (net) {
    case 'mainnet':
      return networks.bitcoin;
    case 'testnet':
    case 'signet':
    case 'regtest':
      return networks.testnet;
    default:
      // Exhaustive guard
      throw new Error(`Unsupported network: ${String(net)}`);
  }
}

/**
 * Sum all outputs in a raw transaction hex that pay to the exact `creatorAddr`.
 * Supports common output types implicitly by comparing the locking script
 * produced from the address to each tx output script.
 */
export function sumOutputsToAddress(
  rawTxHex: string,
  creatorAddr: string,
  network: SupportedNetwork,
): bigint {
  if (typeof rawTxHex !== 'string' || rawTxHex.length % 2 !== 0) {
    throw new Error('Invalid raw transaction hex');
  }

  const net = getBitcoinjsNetwork(network);
  const tx = Transaction.fromHex(rawTxHex);
  const targetScript = address.toOutputScript(creatorAddr, net);

  let total = 0n;
  for (const out of tx.outs) {
    if (out.script.equals(targetScript)) {
      total += BigInt(out.value);
    }
  }
  return total;
}


