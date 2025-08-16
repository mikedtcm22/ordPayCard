import { initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

// Set NODE_ENV to test for proper test isolation
process.env['NODE_ENV'] = 'test';

// Initialize ECC library once for tests (required for P2TR payments)
initEccLib(ecc);


