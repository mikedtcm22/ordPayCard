# Wallet Integration Solution for ord-connect Issues

## Problem Summary

The `@ordzaar/ord-connect` package has critical issues preventing proper integration:
1. **Buffer is not defined** - Package tries to use Node.js `Buffer` in browser
2. **Export configuration issues** - Malformed package.json exports
3. **Peer dependency conflicts** - React 18/19 compatibility issues

## Solution Implemented

### 1. Temporary Workaround (SimpleWalletButton)
- Created mock wallet connection for development
- Simulates wallet connections without requiring actual extensions
- Allows continued development while fixing real integration

### 2. Real Wallet Integration (RealWalletButton)
- Direct integration with wallet APIs without ord-connect
- Supports Unisat, Xverse, and Leather wallets
- Proper Signet network support for ordinals testing

## Xverse Wallet Integration Fix

### Issue Discovered
The initial implementation used `window.XverseProviders.request()` which caused the error:
```
window.XverseProviders.request is not a function
```

### Root Cause
Xverse doesn't expose a direct `request` method on `window.XverseProviders`. Instead, it uses different APIs and expects integration through the sats-connect library or other methods.

### Solution
Updated the RealWalletButton to try multiple connection methods:

1. **Direct Methods**: Check for `connect()`, `getAccounts()`, `getAddress()` on XverseProviders
2. **BitcoinProvider**: Try window.BitcoinProvider if available
3. **btc_providers Array**: Look for Xverse in the WBIP004 standard providers array
4. **Graceful Fallback**: Clear error messages if wallet not detected

## Implementation Details

### RealWalletButton Features
```typescript
// Wallet detection
window.unisat         // Unisat wallet
window.XverseProviders // Xverse wallet  
window.LeatherProvider // Leather wallet

// Network support
- Unisat: testnet/signet switching
- Xverse: testnet/signet support
- Leather: primarily testnet
```

### Key Improvements
1. **No dependencies on ord-connect** - Avoids all package issues
2. **Direct wallet API usage** - More control and flexibility
3. **Automatic wallet detection** - Only shows installed wallets
4. **Better error handling** - Clear messages for users
5. **Signet network support** - Essential for recursive ordinals testing

## Usage

### For Development
Use `SimpleWalletButton` for quick testing without wallet extensions:
```jsx
import { SimpleWalletButton } from '@/components/wallet/SimpleWalletButton';
```

### For Production
Use `RealWalletButton` for actual wallet connections:
```jsx
import { RealWalletButton } from '@/components/wallet/RealWalletButton';
```

## Testing Pages

### Wallet Test Page (`/wallet-test`)
Compare both SimpleWalletButton and RealWalletButton implementations side by side.

### Xverse Debug Page (`/xverse-debug`)
Specialized debugging page for Xverse wallet integration:
- Shows all available window objects
- Lists available methods and properties
- Tests multiple connection approaches
- Logs detailed results to console

## Xverse Connection Flow

```javascript
// The updated connection flow tries multiple methods:
1. Check XverseProviders.connect()
2. Check XverseProviders.getAccounts() with multiple parameter formats:
   - { purposes: ['ordinals', 'payment'] } // Fix for "purposes not iterable" error
   - { addresses: ['ordinals', 'payment'] }
   - {}
   - undefined (no parameters)
3. Check XverseProviders.getAddress()
4. Check window.BitcoinProvider
5. Search window.btc_providers array and try:
   - request('getAccounts', params) with multiple formats
   - request('wallet_getAccount', null) // Newer non-legacy method
6. Provide clear error if all methods fail
```

### Xverse "purposes not iterable" Fix

The error occurs when Xverse expects a `purposes` array but receives `null` or an incompatible format. The fix:

1. **Try multiple parameter formats** - Different Xverse versions may expect different formats
2. **Use the newer wallet_getAccount method** - This is the non-legacy approach
3. **Enhanced error logging** - Console logs show which parameter format works
4. **Graceful fallback** - If one method fails, try the next

## Future Considerations

1. **Monitor ord-connect updates** - Check if package issues get fixed
2. **Expand wallet support** - Add more wallet providers as needed
3. **Enhanced features** - Add PSBT signing, message signing, etc.
4. **Consider forking ord-connect** - If we need its specific features
5. **Update based on wallet API changes** - Wallet APIs evolve rapidly

## Migration Path

When ord-connect is fixed:
1. Test new version thoroughly
2. Compare feature parity with our implementation
3. Gradually migrate if beneficial
4. Keep our implementation as fallback

## Conclusion

Our custom wallet integration provides a more reliable solution than the broken ord-connect package. It gives us full control over wallet connections and ensures Signet network support for recursive ordinals testing.