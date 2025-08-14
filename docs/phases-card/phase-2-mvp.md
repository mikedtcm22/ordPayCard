# Phase 2: MVP Phase - Core Functionality

**Project Name:** SatSpray Membership Card  
**Phase:** 2 - MVP Phase  
**Duration:** 3-4 weeks  
**Document Type:** Development Plan  
**Date:** 11 July 2025  

---

## Phase Overview

### Goal
Implement essential features that deliver the project's primary value proposition. This phase creates a usable product with core functionality including wallet integration, membership card creation, authentication, balance tracking, and top-up capabilities.

### Success Criteria
- ✅ Users can connect Unisat wallet (Xverse & Leather deferred to later phase)
- ✅ Users can create membership cards through wallet integration
- ✅ Authentication system working with Bitcoin signatures
- ✅ Real-time balance calculation and status display
- ✅ Top-up functionality with PSBT creation and signing
- ✅ Core UI components fully functional and responsive
- ✅ All features working on testnet/signet

### Phase Dependencies
- **Prerequisites**: Phase 1 completed - basic project foundation established
- **Inputs**: Functional development environment, basic project structure, Bitcoin integration foundation
- **Outputs**: Functional MVP with core features, deployable application

---

## Feature Breakdown

### Feature 2.1: Wallet Connection System
**Goal**: Enable users to connect and manage Bitcoin wallets for ordinals transactions

#### Step 2.1.1: Direct Wallet Integration (Sats-Connect Not Used)
- Implement direct wallet integration without sats-connect (no Signet support)
- Set up wallet detection for Unisat wallet (Xverse/Leather deferred)
- Implement wallet connection request with proper permissions
- Create wallet selection interface focused on Unisat for MVP
- Add wallet connection state management in Zustand store

**Success Criteria:**
- Wallet detection works for Unisat wallet
- Connection requests properly request ordinals and payment permissions
- Wallet selection UI is intuitive (simplified for single wallet MVP)

#### Step 2.1.2: Wallet Connection Components
- Create WalletConnectionModal component with wallet selection
- Build WalletStatus component showing connection state
- Implement wallet switching functionality
- Add connection error handling and retry mechanisms
- Create wallet connection button with loading states

**Success Criteria:**
- Modal opens/closes correctly with proper animations
- Connection status updates in real-time
- Error states are handled gracefully with user feedback

#### Step 2.1.3: Wallet State Management
- Implement wallet store with connection persistence
- Add wallet address and network detection
- Create wallet disconnection functionality
- Set up automatic reconnection on app startup
- Add wallet network validation (testnet/signet)

**Success Criteria:**
- Wallet state persists across browser sessions
- Network validation prevents mainnet connections during development
- Disconnection properly clears sensitive data

#### Step 2.1.4: Wallet Disconnection Flow
- Create wallet disconnect button and confirmation
- Implement proper cleanup of wallet state
- Clear any cached wallet data
- Reset UI to disconnected state
- Add security confirmation for disconnection

**Success Criteria:**
- Disconnection properly clears all wallet data
- UI updates correctly to show disconnected state
- Security measures prevent accidental disconnection

#### Step 2.1.5: Wallet Connection Error Handling
- Implement error handling for wallet not found
- Create retry mechanisms for connection failures
- Add error messages for network mismatches
- Handle wallet rejection scenarios
- Create troubleshooting help for common issues

**Success Criteria:**
- Error messages are clear and actionable
- Retry functionality works correctly
- Help documentation guides users through common issues

### Feature 2.2: Membership Card Creation
**Goal**: Enable users to create new membership cards through wallet integration

#### Step 2.2.1: Parent Inscription Template
- Create HTML template for membership card inscription
- Embed active and expired SVG assets inline
- Implement JavaScript logic for balance calculation
- Add hardcoded decay rate (35 sats/block) and treasury address
- Create cardStatus() function for external queries

**Success Criteria:**
- HTML template renders correctly in browsers
- SVG assets display properly in both active and expired states
- JavaScript logic calculates balances accurately

#### Step 2.2.2: PSBT Generation for Card Creation
- Implement PSBT creation for membership card minting
- Add inscription output with proper ordinals formatting
- Include optional initial top-up in same transaction
- Calculate proper fees and change outputs
- Add transaction size optimization

**Success Criteria:**
- PSBT creation works without errors
- Inscription output follows ordinals standards
- Fee calculation produces reasonable estimates

#### Step 2.2.3: Card Creation Flow
- Create card creation page with pricing calculator
- Implement initial top-up amount selection
- Add card preview with active/expired states
- Build transaction review and confirmation
- Create success/failure feedback with inscription ID

**Success Criteria:**
- Pricing calculator shows accurate costs
- Card preview displays correctly
- Transaction flow guides users clearly

#### Step 2.2.4: Transaction Confirmation Polling
- Implement transaction confirmation monitoring
- Add progress indicators for confirmation status
- Create block confirmation counter
- Set up automatic redirect after confirmation
- Add error handling for failed transactions

**Success Criteria:**
- Confirmation polling works reliably
- Progress indicators provide clear feedback
- Failed transactions are handled gracefully

#### Step 2.2.5: Card Creation Success/Failure Feedback
- Create success page with new card details
- Display inscription ID and ordinals explorer links
- Add error handling for transaction failures
- Implement retry mechanisms for failed transactions
- Create card sharing functionality

**Success Criteria:**
- Success page displays all relevant information
- Error handling provides clear next steps
- Retry functionality works correctly

### Feature 2.3: Authentication System
**Goal**: Implement secure authentication using Bitcoin signatures

#### Step 2.3.1: Challenge-Response Authentication
- Implement nonce generation for authentication challenges
- Create challenge message formatting
- Add challenge expiration and validation
- Set up challenge storage and cleanup
- Create challenge refresh functionality

**Success Criteria:**
- Nonce generation is cryptographically secure
- Challenge messages are properly formatted
- Expiration prevents replay attacks

#### Step 2.3.2: Message Signing with Wallet
- Implement message signing through wallet integration
- Create signing interface with clear messaging
- Add signature verification on backend
- Handle wallet rejection of signing requests
- Create signing retry mechanisms

**Success Criteria:**
- Message signing works with Unisat wallet
- Verification correctly validates signatures
- Rejection scenarios are handled gracefully

#### Step 2.3.3: JWT Token Generation and Validation
- Implement JWT token creation with proper claims
- Add token expiration and refresh logic
- Create token validation middleware
- Set up secure token storage (httpOnly cookies)
- Add token revocation functionality

**Success Criteria:**
- JWT tokens are properly signed and validated
- Token expiration prevents unauthorized access
- Secure storage prevents XSS attacks

#### Step 2.3.4: Session Management
- Implement session creation and management
- Add session persistence across browser restarts
- Create session timeout handling
- Set up session cleanup on logout
- Add concurrent session management

**Success Criteria:**
- Sessions persist correctly across browser sessions
- Timeout handling maintains security
- Cleanup prevents session leaks

#### Step 2.3.5: Authentication Middleware
- Create authentication middleware for protected routes
- Add inscription ownership verification
- Implement rate limiting for authentication attempts
- Create authentication bypass for public routes
- Add security logging for authentication events

**Success Criteria:**
- Protected routes require valid authentication
- Ownership verification works correctly
- Rate limiting prevents brute force attacks

### Feature 2.4: Balance Calculation & Status Display
**Goal**: Provide real-time balance tracking and status display

#### Step 2.4.1: Ordinals API Integration
- Implement ordinals API client with proper error handling
- Create inscription data fetching with caching
- Add child inscription (receipt) fetching
- Set up API response validation
- Create fallback mechanisms for API failures

**Success Criteria:**
- API client reliably fetches inscription data
- Caching improves performance for repeated requests
- Error handling maintains system stability

#### Step 2.4.2: Balance Calculation Algorithm
- Implement decay calculation (35 sats/block)
- Create balance aggregation from multiple receipts
- Add block height fetching and caching
- Implement proper receipt validation
- Create balance history tracking

**Success Criteria:**
- Balance calculations are accurate and consistent
- Block height updates in real-time
- Receipt validation prevents invalid data

#### Step 2.4.3: Status Badge Component
- Create status badge component with active/expired states
- Add real-time balance updates with polling
- Implement visual indicators for balance levels
- Create expiration countdown display
- Add click-to-refresh functionality

**Success Criteria:**
- Status badge updates in real-time
- Visual indicators are clear and accessible
- Polling is efficient and doesn't overload APIs

#### Step 2.4.4: Block Height Fetching and Caching
- Implement Bitcoin block height fetching
- Add intelligent caching for block height
- Create block height update polling
- Set up cache invalidation strategies
- Add error handling for network issues

**Success Criteria:**
- Block height updates are timely and accurate
- Caching reduces API calls
- Network errors don't break functionality

#### Step 2.4.5: Balance History and Expiration
- Create balance history tracking
- Implement expiration estimates
- Add balance trend visualization
- Create historical balance queries
- Set up balance change notifications

**Success Criteria:**
- Balance history is accurate and complete
- Expiration estimates are reliable
- Visualizations are helpful and clear

### Feature 2.5: Top-up Functionality
**Goal**: Enable users to add balance to existing membership cards

#### Step 2.5.1: Top-up Widget
- Create top-up widget with amount input
- Add days-to-sats calculator (35 × 144 × days)
- Implement custom amount input validation
- Create balance projection display
- Add preset amount buttons for common top-ups

**Success Criteria:**
- Calculator accurately converts days to sats
- Input validation prevents invalid amounts
- Balance projection shows expected results

#### Step 2.5.2: Receipt Inscription JSON Generation
- Implement receipt JSON schema (satspray.topup.v1)
- Create proper parent inscription linking
- Add transaction metadata (amount, block, txid)
- Implement receipt validation
- Create receipt signing for integrity

**Success Criteria:**
- Receipt JSON follows specified schema
- Parent linking works correctly
- Validation catches format errors

#### Step 2.5.3: PSBT Creation for Top-up
- Create PSBT for top-up transactions
- Add treasury payment output
- Include 1-sat receipt inscription output
- Implement proper fee calculation
- Add change output handling

**Success Criteria:**
- PSBT creation works without errors
- Treasury payment goes to correct address
- Fee calculation is accurate

#### Step 2.5.4: Transaction Signing and Broadcasting
- Implement transaction signing through wallet
- Add transaction broadcasting functionality
- Create signing progress indicators
- Handle signing rejection gracefully
- Add transaction retry mechanisms

**Success Criteria:**
- Signing works with Unisat wallet
- Broadcasting successfully submits transactions
- Progress indicators provide clear feedback

#### Step 2.5.5: Top-up Confirmation and Updates
- Create top-up confirmation monitoring
- Add balance update after confirmation
- Implement success/failure feedback
- Create transaction history updates
- Add receipt validation after confirmation

**Success Criteria:**
- Confirmation monitoring works reliably
- Balance updates reflect new top-up
- Success/failure feedback is clear

### Feature 2.6: Core UI Components
**Goal**: Create polished, responsive UI components for all core functionality

#### Step 2.6.1: Membership Card Display
- Create MembershipCard component with status display
- Add balance visualization with progress bars
- Implement active/expired state styling
- Create card hover effects and interactions
- Add responsive design for all screen sizes

**Success Criteria:**
- Card component displays all relevant information
- Visual states clearly indicate active/expired status
- Responsive design works on all devices

#### Step 2.6.2: Status Badge Implementation
- Create StatusBadge component with real-time updates
- Add visual indicators for different balance levels
- Implement expiration warnings and alerts
- Create accessible design with proper contrast
- Add animation for status changes

**Success Criteria:**
- Status badge provides clear status information
- Visual indicators are accessible and clear
- Animations enhance user experience

#### Step 2.6.3: Top-up Modal
- Create TopUpModal component with form validation
- Add amount input with calculator functionality
- Implement transaction preview and confirmation
- Create progress indicators for transaction states
- Add error handling and retry mechanisms

**Success Criteria:**
- Modal provides clear top-up interface
- Form validation prevents invalid inputs
- Transaction flow guides users effectively

#### Step 2.6.4: Loading States and Error Handling
- Create loading components for all async operations
- Add skeleton screens for data loading
- Implement error boundary components
- Create retry mechanisms for failed operations
- Add proper error messaging throughout

**Success Criteria:**
- Loading states provide clear feedback
- Error boundaries prevent app crashes
- Retry mechanisms work correctly

#### Step 2.6.5: Mobile Responsive Design
- Implement mobile-first responsive design
- Create touch-friendly interfaces
- Add proper viewport configuration
- Implement mobile-specific optimizations
- Create tablet and desktop enhancements

**Success Criteria:**
- All components work correctly on mobile devices
- Touch interactions are intuitive
- Performance is optimized for mobile

---

## Technical Specifications

### Wallet Integration
- **Supported Wallets**: Unisat (MVP), Xverse & Leather (deferred to Phase 3+)
- **Permissions**: Ordinals signing, payment signing, address access
- **Network**: Testnet/Signet for MVP development
- **Security**: Message signing for authentication
- **Note**: Direct wallet integration used instead of sats-connect due to Signet requirements

### Membership Card Schema
```javascript
// Parent inscription (text/html)
window.CARD_SCHEMA_VER = "1";
window.DECAY_PER_BLOCK = 35;
window.TREASURY_ADDR = "tb1q...";

window.cardStatus = async () => ({
  balance: Number,
  blocksRemaining: Number,
  status: "ACTIVE" | "EXPIRED"
});
```

### Top-up Receipt Schema
```json
{
  "schema": "satspray.topup.v1",
  "parent": "inscription_id",
  "amount": 123000,
  "block": 841200,
  "paid_to": "tb1q...",
  "txid": "transaction_id"
}
```

### API Endpoints
- `GET /api/auth/challenge` - Generate authentication challenge
- `POST /api/auth/verify` - Verify signature and create session
- `GET /api/inscriptions/:id` - Get inscription data
- `GET /api/inscriptions/:id/children` - Get child inscriptions
- `POST /api/inscriptions/validate` - Validate inscription ownership
- `POST /api/psbt/create` - Create PSBT for transactions
- `POST /api/psbt/broadcast` - Broadcast signed transaction

### Component Structure
```
src/components/
├── wallet/
│   ├── WalletConnectionModal.tsx
│   ├── WalletStatus.tsx
│   └── WalletButton.tsx
├── membership/
│   ├── MembershipCard.tsx
│   ├── StatusBadge.tsx
│   └── CardCreation.tsx
├── topup/
│   ├── TopUpModal.tsx
│   ├── TopUpWidget.tsx
│   └── AmountCalculator.tsx
├── auth/
│   ├── AuthModal.tsx
│   └── SigningProgress.tsx
└── common/
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── ProgressBar.tsx
```

---

## Testing Requirements

### Unit Tests
- [ ] Wallet connection state management
- [ ] Balance calculation algorithms
- [ ] PSBT creation and validation
- [ ] Component rendering and interactions
- [ ] Authentication flow logic

### Integration Tests
- [ ] End-to-end wallet connection flow
- [ ] Complete card creation process
- [ ] Authentication with signature verification
- [ ] Top-up transaction flow
- [ ] Balance update after top-up

### User Acceptance Tests
- [ ] User can connect wallet successfully
- [ ] User can create membership card
- [ ] User can authenticate with signature
- [ ] User can top-up existing card
- [ ] User can view real-time balance updates

---

## Performance Requirements

### Response Times
- Wallet connection: < 3 seconds
- Balance calculation: < 1 second
- PSBT creation: < 2 seconds
- Transaction confirmation: < 30 seconds (depending on network)

### User Experience
- Loading states for all async operations
- Error recovery mechanisms
- Responsive design for all devices
- Accessibility compliance (WCAG 2.1 AA)

---

## Security Requirements

### Authentication
- Cryptographically secure nonce generation
- Proper signature verification
- Session management with secure tokens
- Rate limiting on authentication attempts

### Transaction Security
- PSBT validation before signing
- Treasury address verification
- Transaction amount validation
- Network configuration validation

### Data Protection
- No private key storage
- Secure session management
- Input validation and sanitization
- Error handling without information leakage

---

## Deployment Requirements

### Development Deployment
- Testnet/Signet configuration
- Development treasury address
- Debug logging enabled
- Hot reload for development

### Staging Deployment
- Production-like environment
- Comprehensive testing
- Performance monitoring
- Security testing

---

## Success Metrics

### Functional Metrics
- Wallet connection success rate: > 95%
- Card creation success rate: > 90%
- Authentication success rate: > 95%
- Top-up transaction success rate: > 90%
- Balance calculation accuracy: 100%

### Performance Metrics
- Page load time: < 3 seconds
- API response time: < 500ms
- Transaction confirmation time: < 30 seconds
- Mobile performance score: > 90

### User Experience Metrics
- Task completion rate: > 85%
- Error recovery rate: > 90%
- Mobile usability score: > 90
- Accessibility compliance: WCAG 2.1 AA

---

## Risk Assessment

### Technical Risks
- **Wallet integration complexity**: Mitigation through phased approach (Unisat first)
- **Multi-wallet support challenges**: Deferred to post-MVP to reduce complexity
- **Ordinals API reliability**: Mitigation through fallback mechanisms
- **Bitcoin network performance**: Mitigation through proper timeout handling
- **PSBT compatibility**: Mitigation through focused testing on Unisat wallet

### User Experience Risks
- **Wallet setup complexity**: Mitigation through clear onboarding
- **Limited wallet support in MVP**: Mitigation through clear communication about future wallet support
- **Transaction confirmation delays**: Mitigation through progress indicators
- **Error handling confusion**: Mitigation through clear error messages

---

## Next Steps

Upon completion of Phase 2, the following should be functional:
1. **Core Product**: Fully functional membership card system
2. **User Flows**: Complete wallet connection, card creation, and top-up flows
3. **Authentication**: Secure Bitcoin signature-based authentication
4. **Real-time Updates**: Live balance tracking and status updates
5. **Mobile Support**: Responsive design for all device types

**Transition to Phase 3**: Enhanced features development can begin with manual privacy flows, advanced UI enhancements, performance optimizations, and expanded wallet support (Xverse and Leather integration).

---

*This document serves as the complete specification for Phase 2 MVP development. All features must be completed and tested before proceeding to Phase 3.* 