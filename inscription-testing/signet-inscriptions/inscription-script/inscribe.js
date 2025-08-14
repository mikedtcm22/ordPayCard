const bitcoin = require('bitcoinjs-lib');
const ECPair = require('ecpair');
const ecc = require('tiny-secp256k1');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize ECPair with tiny-secp256k1
bitcoin.initEccLib(ecc);
const ECPairFactory = ECPair.ECPairFactory(ecc);

// Signet network configuration
const SIGNET = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};

class SignetInscriber {
  constructor(privateKeyWIF) {
    this.network = SIGNET;
    this.keyPair = ECPairFactory.fromWIF(privateKeyWIF, this.network);
    this.address = bitcoin.payments.p2tr({
      internalPubkey: this.keyPair.publicKey.slice(1, 33),
      network: this.network
    }).address;
    
    console.log('Wallet address:', this.address);
  }

  async getUTXOs() {
    try {
      const response = await axios.get(`${process.env.SIGNET_API}/address/${this.address}/utxo`);
      return response.data.filter(utxo => utxo.status.confirmed);
    } catch (error) {
      console.error('Error fetching UTXOs:', error.message);
      throw error;
    }
  }

  async getCurrentFeeRate() {
    try {
      const response = await axios.get(`${process.env.SIGNET_API}/v1/fees/recommended`);
      return response.data.halfHourFee || 1; // Use 1 sat/vB as minimum
    } catch (error) {
      console.warn('Could not fetch fee rate, using default');
      return 1;
    }
  }

  createInscriptionScript(contentType, content) {
    // Create inscription envelope
    // OP_FALSE OP_IF "ord" OP_1 <content-type> OP_0 <content> OP_ENDIF
    const parts = [
      Buffer.from([0x00]), // OP_FALSE
      Buffer.from([0x63]), // OP_IF
      Buffer.from('ord', 'utf8'),
      Buffer.from([0x01]), // OP_1
      Buffer.from(contentType, 'utf8'),
      Buffer.from([0x00]), // OP_0
      content,
      Buffer.from([0x68]), // OP_ENDIF
    ];

    // Build the script
    const chunks = [];
    for (const part of parts) {
      if (part.length <= 75) {
        // Direct push
        chunks.push(Buffer.from([part.length]));
        chunks.push(part);
      } else if (part.length <= 255) {
        // OP_PUSHDATA1
        chunks.push(Buffer.from([0x4c])); // OP_PUSHDATA1
        chunks.push(Buffer.from([part.length]));
        chunks.push(part);
      } else if (part.length <= 65535) {
        // OP_PUSHDATA2
        chunks.push(Buffer.from([0x4d])); // OP_PUSHDATA2
        chunks.push(Buffer.from([part.length & 0xff, (part.length >> 8) & 0xff]));
        chunks.push(part);
      } else {
        throw new Error('Content too large');
      }
    }

    return Buffer.concat(chunks);
  }

  async createInscriptionTransaction(contentPath, recipientAddress, feeRate) {
    // Read content
    const content = fs.readFileSync(contentPath);
    const contentType = 'text/html;charset=utf-8';
    
    console.log(`Inscribing ${content.length} bytes of ${contentType}`);

    // Get UTXOs
    const utxos = await this.getUTXOs();
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }

    // Sort UTXOs by value (use smallest first)
    utxos.sort((a, b) => a.value - b.value);

    // Create inscription script
    const inscriptionScript = this.createInscriptionScript(contentType, content);
    
    // Create reveal script (inscription script + OP_DROP + internal pubkey + OP_CHECKSIG)
    const internalPubkey = this.keyPair.publicKey.slice(1, 33);
    const revealScript = Buffer.concat([
      inscriptionScript,
      Buffer.from([0x75]), // OP_DROP
      Buffer.from([0x20]), // Push 32 bytes
      internalPubkey,
      Buffer.from([0xac]), // OP_CHECKSIG
    ]);

    // Calculate script address for commit transaction
    const scriptTree = {
      output: revealScript
    };
    
    const commitAddress = bitcoin.payments.p2tr({
      internalPubkey,
      scriptTree,
      network: this.network
    }).address;

    console.log('Commit address:', commitAddress);

    // Create commit transaction
    const psbt = new bitcoin.Psbt({ network: this.network });
    
    let totalInput = 0;
    const dustLimit = 546;
    const commitOutput = dustLimit; // Minimal amount for commit
    
    // Add inputs
    for (const utxo of utxos) {
      const txHex = await this.fetchTransaction(utxo.txid);
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: Buffer.from(txHex.vout[utxo.vout].scriptpubkey, 'hex'),
          value: utxo.value,
        },
        tapInternalKey: internalPubkey,
      });
      
      totalInput += utxo.value;
      
      // Estimate if we have enough
      const estimatedSize = 200 + (psbt.inputCount * 100); // Rough estimate
      const estimatedFee = estimatedSize * feeRate;
      
      if (totalInput >= commitOutput + estimatedFee + dustLimit) {
        break;
      }
    }

    // Add commit output
    psbt.addOutput({
      address: commitAddress,
      value: commitOutput,
    });

    // Calculate fee and add change output
    const estimatedSize = 200 + (psbt.inputCount * 100);
    const fee = Math.ceil(estimatedSize * feeRate);
    const change = totalInput - commitOutput - fee;
    
    if (change > dustLimit) {
      psbt.addOutput({
        address: this.address,
        value: change,
      });
    }

    // Sign commit transaction
    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, this.keyPair);
    }
    
    psbt.finalizeAllInputs();
    const commitTx = psbt.extractTransaction();
    const commitTxId = commitTx.getId();
    
    console.log('Commit transaction:', commitTxId);

    // Create reveal transaction
    const revealPsbt = new bitcoin.Psbt({ network: this.network });
    
    // Add commit output as input
    revealPsbt.addInput({
      hash: commitTxId,
      index: 0,
      witnessUtxo: {
        script: bitcoin.payments.p2tr({
          internalPubkey,
          scriptTree,
          network: this.network
        }).output,
        value: commitOutput,
      },
      tapLeafScript: [{
        leafVersion: 0xc0,
        script: revealScript,
        controlBlock: bitcoin.payments.p2tr({
          internalPubkey,
          scriptTree,
          network: this.network
        }).witness[0],
      }],
    });

    // Add output to recipient
    const revealFee = Math.ceil((200 + revealScript.length) * feeRate);
    const inscriptionValue = commitOutput - revealFee;
    
    if (inscriptionValue < dustLimit) {
      throw new Error('Inscription value too low after fees');
    }

    revealPsbt.addOutput({
      address: recipientAddress,
      value: inscriptionValue,
    });

    // Sign reveal transaction
    revealPsbt.signInput(0, this.keyPair);
    revealPsbt.finalizeAllInputs();
    
    const revealTx = revealPsbt.extractTransaction();
    const revealTxId = revealTx.getId();
    
    console.log('Reveal transaction:', revealTxId);

    return {
      commitTx: commitTx.toHex(),
      commitTxId,
      revealTx: revealTx.toHex(),
      revealTxId,
      inscriptionId: `${revealTxId}i0`,
    };
  }

  async fetchTransaction(txid) {
    try {
      const response = await axios.get(`${process.env.SIGNET_API}/tx/${txid}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error.message);
      throw error;
    }
  }

  async broadcastTransaction(txHex) {
    try {
      const response = await axios.post(`${process.env.SIGNET_API}/tx`, txHex, {
        headers: { 'Content-Type': 'text/plain' }
      });
      return response.data;
    } catch (error) {
      console.error('Broadcast error:', error.response?.data || error.message);
      throw error;
    }
  }

  async inscribe(contentPath, recipientAddress) {
    try {
      // Get current fee rate
      const feeRate = await this.getCurrentFeeRate();
      console.log(`Using fee rate: ${feeRate} sat/vB`);

      // Check balance
      const utxos = await this.getUTXOs();
      const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      console.log(`Wallet balance: ${balance} sats`);

      if (balance < 10000) {
        throw new Error('Insufficient balance. Need at least 10,000 sats');
      }

      // Create inscription transactions
      const { commitTx, commitTxId, revealTx, revealTxId, inscriptionId } = 
        await this.createInscriptionTransaction(contentPath, recipientAddress, feeRate);

      // Broadcast commit transaction
      console.log('\nBroadcasting commit transaction...');
      await this.broadcastTransaction(commitTx);
      console.log('Commit transaction broadcast successfully');
      console.log(`View on mempool: https://mempool.space/signet/tx/${commitTxId}`);

      // Wait a bit for propagation
      console.log('\nWaiting 5 seconds for commit transaction to propagate...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Broadcast reveal transaction
      console.log('\nBroadcasting reveal transaction...');
      await this.broadcastTransaction(revealTx);
      console.log('Reveal transaction broadcast successfully');
      console.log(`View on mempool: https://mempool.space/signet/tx/${revealTxId}`);

      console.log('\n✅ Inscription created successfully!');
      console.log(`Inscription ID: ${inscriptionId}`);
      console.log(`\nView inscription: https://ordinals.com/inscription/${inscriptionId}`);

      return inscriptionId;
    } catch (error) {
      console.error('\n❌ Inscription failed:', error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node inscribe.js <path-to-content-file>');
    console.log('Example: node inscribe.js ../test1_base_card.min.html');
    process.exit(1);
  }

  const contentPath = path.resolve(args[0]);
  
  if (!fs.existsSync(contentPath)) {
    console.error('Error: File not found:', contentPath);
    process.exit(1);
  }

  const inscriber = new SignetInscriber(process.env.PRIVATE_KEY);
  
  try {
    await inscriber.inscribe(contentPath, process.env.RECIPIENT_ADDRESS);
  } catch (error) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}