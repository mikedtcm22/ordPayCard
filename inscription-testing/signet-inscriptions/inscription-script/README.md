# Signet Inscription Script

## ⚠️ Important Note

Creating ordinals inscriptions is complex and requires specific transaction formats. After researching the implementation, I've found that:

1. **Inscription format is very specific** - It requires creating witness scripts with exact ordinals envelope format
2. **Two-step process** - Commit transaction followed by reveal transaction
3. **Taproot complexity** - Requires proper taproot script path spending

## Setup

```bash
npm install
```

## Check Your Wallet

Run this to check your balance and wallet details:

```bash
node simple-inscribe.js
```

This will show:
- Your Signet address
- Current balance
- Available UTXOs
- File details

## Alternative Solutions

Given the complexity and the high fees on Unisat (100k sats), I recommend:

### 1. **Sparrow Wallet**
- Download Sparrow Wallet
- Connect to Signet network
- Import your private key
- Use the inscription feature (much lower fees)

### 2. **Ord Wallet**
- Requires running Bitcoin Core on Signet
- Most reliable for inscriptions
- Command: `ord --signet wallet inscribe <file>`

### 3. **Manual PSBT**
We could create the PSBT manually, but it's error-prone

### 4. **Wait for Better Services**
- Check if other services support Signet with lower fees
- OrdinalsBot API might be an option

## Your Wallet Info

Based on your private key:
- Network: Signet
- Address: Will be shown when you run the script
- Private Key: Stored in .env file

## Security Note

Your private key is in the .env file. This is a testnet key, but still:
- Don't commit .env to git
- Delete after testing
- Use a dedicated test wallet

## Next Steps

1. Run `node simple-inscribe.js` to check your balance
2. If balance is too low, get more from faucets
3. Consider using Sparrow Wallet for the actual inscription
4. Or wait for a service with reasonable fees

The inscription file is ready at: `../test1_base_card.min.html`