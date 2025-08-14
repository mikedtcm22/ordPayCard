const bitcoin = require('bitcoinjs-lib');
const ECPair = require('ecpair');
const ecc = require('tiny-secp256k1');
require('dotenv').config();

// Initialize
bitcoin.initEccLib(ecc);
const { ECPairFactory } = ECPair;
const ECPairInstance = ECPairFactory(ecc);

// Network
const network = bitcoin.networks.testnet;

// Parse key
const keyPair = ECPairInstance.fromWIF(process.env.PRIVATE_KEY, network);

// Get internal pubkey for taproot
const internalPubkey = keyPair.publicKey.slice(1, 33);
const internalPubkeyHex = internalPubkey.toString('hex');

// Get taproot address
const { address } = bitcoin.payments.p2tr({
  internalPubkey,
  network
});

console.log('=== Sparrow Wallet Import Information ===\n');
console.log('Your Address:', address);
console.log('\nPrivate Key (WIF):', process.env.PRIVATE_KEY);
console.log('\nInternal Public Key (hex):', internalPubkeyHex);

console.log('\n=== For Sparrow Descriptor Import ===');
console.log('\nIf importing as descriptor, use:');
console.log(`tr(${process.env.PRIVATE_KEY})`);

console.log('\n=== Manual Import Steps ===');
console.log('1. File → New Wallet');
console.log('2. Name it "Signet Inscription Test"');
console.log('3. Choose "New or Imported Software Wallet"');
console.log('4. Script Type: P2TR (Taproot)');
console.log('5. Click "Import" tab');
console.log('6. Choose "Private Key"');
console.log('7. Paste the private key above');
console.log('8. Click "Import"');

console.log('\n=== Alternative: Electrum Wallet ===');
console.log('If Sparrow gives issues, try Electrum:');
console.log('1. Create new wallet');
console.log('2. Import Bitcoin addresses or private keys');
console.log('3. Paste: p2tr:' + process.env.PRIVATE_KEY);