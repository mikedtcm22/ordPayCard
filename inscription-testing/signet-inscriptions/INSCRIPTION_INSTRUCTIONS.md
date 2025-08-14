# Signet Inscription Testing Instructions

## Template Details

**File**: `test1_base_card.min.html`  
**Size**: 8,417 bytes (8.2 KB)  
**Estimated inscription cost**: ~8,417 sats + network fees

## Configuration

- **Treasury Address**: `tb1pjqfzx3qye9hhgf0h7w9d5vhxfgjv7hgw56yp6xttz7t6h3kc8h3s0x49wn`
- **Decay Rate**: 100 sats/block (increased for testing)
- **Current Signet Block**: ~263,465

## Steps to Inscribe

### Option 1: Using Unisat Web Inscription Service

1. Visit [Unisat Inscription Service](https://unisat.io/inscribe) and switch to Signet network
2. Click "File" and upload `test1_base_card.min.html`
3. Set recipient address to your wallet: `tb1p39d957nu4w76nfdu3flsmvz9ka6huve5awetm0f9dy9lnznjmelsr6xhke`
4. Review fee and confirm inscription
5. Sign and broadcast the transaction

### Option 2: Using Ord CLI (if installed)

```bash
# Assuming ord is configured for Signet
ord --signet wallet inscribe test1_base_card.min.html --destination tb1p39d957nu4w76nfdu3flsmvz9ka6huve5awetm0f9dy9lnznjmelsr6xhke
```

## What This Template Does

1. **Base Card**: This creates a membership card with no initial balance
2. **Status**: Will show "EXPIRED" since no receipts are included
3. **Treasury**: Hardcoded to your specified Signet address
4. **Decay**: Set to 100 sats/block for easier testing

## After Inscription

Once inscribed, please provide:
1. The inscription ID
2. The transaction ID
3. Any errors encountered

## Next Steps

After the base card is inscribed, we can:
1. Monitor it using the Hiro API
2. Create child inscriptions (receipts) to add balance
3. Test the balance calculation on-chain
4. Verify the decay mechanism works correctly

## Testing the Template Locally

To preview the template before inscribing:
```bash
# Open the minified template in your browser
open test1_base_card.min.html

# Or use Python HTTP server
python3 -m http.server 8080
# Then visit http://localhost:8080/test1_base_card.min.html
```

## Important Notes

- The template will show "0 sats" balance initially (no receipts)
- Child inscriptions will be needed to test balance functionality
- The inscription is immutable once created
- Keep the inscription ID for future reference