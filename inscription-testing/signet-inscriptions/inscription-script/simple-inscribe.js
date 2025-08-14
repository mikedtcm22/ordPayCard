const bitcoin = require('bitcoinjs-lib');
const ECPair = require('ecpair');
const ecc = require('tiny-secp256k1');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize ECPair
bitcoin.initEccLib(ecc);
const { ECPairFactory } = ECPair;
const ECPairInstance = ECPairFactory(ecc);

// Signet network
const network = bitcoin.networks.testnet; // Signet uses testnet parameters

async function getBalance(address) {
  try {
    const response = await axios.get(`https://mempool.space/signet/api/address/${address}`);
    return response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
  } catch (error) {
    console.error('Error getting balance:', error.message);
    return 0;
  }
}

async function getUTXOs(address) {
  try {
    const response = await axios.get(`https://mempool.space/signet/api/address/${address}/utxo`);
    return response.data;
  } catch (error) {
    console.error('Error getting UTXOs:', error.message);
    return [];
  }
}

async function main() {
  try {
    // Parse private key
    const keyPair = ECPairInstance.fromWIF(process.env.PRIVATE_KEY, network);
    
    // Get P2TR address
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: keyPair.publicKey.slice(1, 33),
      network
    });

    console.log('Your Signet address:', address);
    
    // Check balance
    const balance = await getBalance(address);
    console.log('Balance:', balance, 'sats');

    if (balance < 10000) {
      console.log('\n⚠️  Low balance detected!');
      console.log('You need at least 10,000 sats for inscription fees.');
      console.log('\nGet Signet coins from:');
      console.log('- https://signet.bc-2.jp/');
      console.log('- https://alt.signetfaucet.com/');
      return;
    }

    // Get UTXOs
    const utxos = await getUTXOs(address);
    console.log('\nAvailable UTXOs:', utxos.length);

    // Check if file exists
    const filePath = path.resolve('../test1_base_card.min.html');
    if (!fs.existsSync(filePath)) {
      console.error('\n❌ File not found:', filePath);
      return;
    }

    const fileSize = fs.statSync(filePath).size;
    console.log('File size:', fileSize, 'bytes');

    // Estimate costs
    const estimatedFee = Math.ceil(fileSize * 2); // Rough estimate
    console.log('Estimated inscription cost:', estimatedFee, 'sats');

    console.log('\n📝 Inscription Details:');
    console.log('- File:', filePath);
    console.log('- Size:', fileSize, 'bytes');
    console.log('- Recipient:', process.env.RECIPIENT_ADDRESS);
    console.log('- Estimated cost:', estimatedFee, 'sats');

    console.log('\n⚠️  Note: Creating inscriptions requires:');
    console.log('1. A commit transaction');
    console.log('2. A reveal transaction');
    console.log('3. Proper script construction');
    
    console.log('\n🔧 Due to the complexity of ordinals inscription format,');
    console.log('I recommend using one of these alternatives:');
    console.log('\n1. Sparrow Wallet (supports Signet and has lower fees)');
    console.log('2. Ord wallet (if you can run a Signet node)');
    console.log('3. Wait for lower fees on Unisat');
    
    console.log('\n💡 Your wallet details for manual inscription:');
    console.log('- Address:', address);
    console.log('- Balance:', balance, 'sats');
    console.log('- File ready at:', filePath);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();