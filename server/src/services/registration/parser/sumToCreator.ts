import { Transaction, address, networks, Network } from 'bitcoinjs-lib';

export type SupportedNetwork = 'regtest' | 'testnet' | 'mainnet';

function getBitcoinjsNetwork(net: SupportedNetwork): Network {
  if (net === 'mainnet') return networks.bitcoin;
  // Treat regtest as testnet for address/script encoding purposes here
  return networks.testnet;
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


