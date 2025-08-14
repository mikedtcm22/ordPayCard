# Xverse Wallet Integration - Deferred Feature

**Status**: Deferred to Phase 3+  
**Reason**: Integration complexity and debugging challenges  
**Date Deferred**: August 1, 2025  

## Issue Summary

During Phase 2 MVP development, we encountered persistent issues with Xverse wallet integration:

1. **Primary Error**: "t.purposes is not iterable" when attempting to connect
2. **Console Logging Issue**: Console logs disappear when the error occurs, making debugging difficult
3. **API Compatibility**: Xverse appears to use a different API structure than expected

## Technical Details

### What We Tried

1. **Multiple Connection Methods**:
   - Direct `window.XverseProviders` access
   - `window.btc_providers` array access
   - Various parameter formats for `getAccounts()`
   - `wallet_connect` method before `getAccounts`

2. **Parameter Formats Tested**:
   ```javascript
   { purposes: ['ordinals', 'payment'] }  // Causes "purposes not iterable" error
   { addresses: ['ordinals', 'payment'] }
   {}  // Empty object
   null
   undefined
   ```

3. **Debug Tools Created**:
   - `/xverse-debug` - Shows available wallet APIs
   - `/xverse-minimal` - Minimal connection test
   - `/xverse-race` - Tests for race conditions

### Current Status

- Xverse is detected in `window.btc_providers`
- The provider has a `request` method
- Any attempt to call `getAccounts` with purposes parameter fails
- Console logs mysteriously disappear when error occurs

## Workaround

For MVP, we're focusing on Unisat wallet which works reliably for testing recursive ordinals on Signet network.

## Future Investigation

When revisiting this integration:

1. **Check Xverse Documentation**: Look for updated API documentation
2. **Contact Xverse Support**: May need direct guidance on proper connection flow
3. **Test Different Versions**: The issue might be version-specific
4. **Consider WBIP Standards**: Ensure we're following the latest Bitcoin wallet standards

## Related Files

- `/client/src/components/wallet/RealWalletButton.tsx` - Main wallet integration
- `/client/src/pages/XverseDebugPage.tsx` - Debug utilities
- `/client/src/pages/XverseMinimalTest.tsx` - Minimal test case
- `/client/src/pages/XverseRaceConditionTest.tsx` - Race condition testing

## Decision

Given the time constraints and the fact that Unisat works well for our MVP testing needs, we're deferring Xverse (and Leather) wallet integration to a future phase. This allows us to focus on core functionality while maintaining the ability to expand wallet support later.