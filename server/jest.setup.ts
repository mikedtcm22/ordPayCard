import { initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

// Initialize ECC library once for tests (required for P2TR payments)
initEccLib(ecc);


