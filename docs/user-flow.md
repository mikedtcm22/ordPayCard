# SatSpray Membership Card – User Flow Documentation

**Project Name:** SatSpray Membership Card  
**Version:** 0.2 (Proof‑of‑Concept)  
**Document Type:** User Flow Specification  
**Date:** 11 July 2025  

---

## 1. User Personas

### 1.1 First-Time Users
- **Profile:** Visitors who don't yet have a membership card
- **Goals:** Understand the system, purchase first card, gain access to SatSpray features
- **Pain Points:** Unfamiliar with ordinals, wallet setup, understanding decay mechanism

### 1.2 Returning Visitors (Active Card Holders)
- **Profile:** Users with currently active membership cards
- **Goals:** Access SatSpray features, monitor card status, top-up when needed
- **Pain Points:** Tracking balance, remembering to top-up before expiration

### 1.3 Expired Card Holders
- **Profile:** Users whose membership cards have expired (balance = 0)
- **Goals:** Reactivate access by topping up card
- **Pain Points:** Realizing card is expired, understanding how to reactivate

---

## 2. Application Segments Overview

### 2.1 Landing/Mint Page
- **Purpose:** Entry point for new users, card purchase flow
- **Key Elements:** Explanation of system, pricing calculator, mint button

### 2.2 Recursive Ordinal Inscriptions
- **Purpose:** Self-contained membership cards with embedded logic
- **Key Elements:** Status badge, balance display, decay visualization
- **Location:** User's ordinals wallet (Xverse, Leather, Unisat)

### 2.3 Top-Up Widget
- **Purpose:** Add balance to existing cards
- **Key Elements:** Amount input, PSBT creation, transaction broadcasting

### 2.4 Site Authentication System
- **Purpose:** Verify active card ownership for site access
- **Key Elements:** Wallet connection, signature verification, session management

### 2.5 Backend API
- **Purpose:** Card verification, balance calculation, authentication
- **Key Elements:** Challenge/verify endpoints, ordinals data fetching

### 2.6 Manual Privacy Interface
- **Purpose:** Privacy-conscious user interactions without wallet connection
- **Key Elements:** Manual inscription ID entry, transaction instructions, signature verification
- **Components:** Manual top-up page, manual authentication page, transaction verification tools

---

## 3. Primary User Flows

### 3.1 Buy New Card Flow

#### 3.1.1 First-Time User Journey
**Entry Point:** Landing page visit

**Steps:**
1. **Landing Page Interaction**
   - User views explanation of membership card system
   - Reads about 35 sats/block decay rate
   - Uses pricing calculator to see costs (35 × 144 × desired_days)
   - Clicks "Buy Membership Card"

2. **Wallet Connection**
   - System prompts for wallet selection (Xverse/Leather/Unisat)
   - User connects wallet
   - System verifies Taproot address capability

3. **Card Configuration**
   - User selects initial top-up amount (optional)
   - System calculates total cost: card mint fee + initial balance
   - Displays preview of card design (active state)

4. **PSBT Creation & Signing**
   - Backend generates PSBT with:
     - Parent inscription (membership card HTML/JS)
     - Optional child inscription (initial top-up receipt)
     - Treasury payment output
   - User reviews transaction in wallet
   - User signs and broadcasts transaction

5. **Confirmation & Card Display**
   - System polls for transaction confirmation
   - Once confirmed, displays new card inscription ID
   - Status badge shows "ACTIVE" with full balance
   - User can view card in wallet (shows active SVG)

**UI Screens:**
- Landing page with explanation
- Wallet connection modal
- Card configuration form
- PSBT review screen
- Success confirmation page

**Technical Details:**
- GET `/mint/psbt` → returns unsigned PSBT
- Wallet signs PSBT with Taproot key
- POST `/mint/broadcast` → broadcasts signed transaction
- Poll `/inscriptions/{id}/status` until confirmed

**Error Handling:**
- Wallet connection failed → Retry with different wallet
- Insufficient funds → Display required amount, suggest funding
- Transaction failed → Show error message, allow retry
- Network issues → Show pending state, auto-retry

---

### 3.2 Site Authentication Flow

#### 3.2.1 Active Card Holder Journey
**Entry Point:** Accessing protected SatSpray features

**Steps:**
1. **Access Protection Trigger**
   - User attempts to access paid SatSpray feature
   - System detects no active session
   - Redirects to authentication page

2. **Wallet Connection**
   - User selects wallet (Xverse/Leather/Unisat)
   - Wallet connects and provides address
   - System detects ordinals in wallet

3. **Card Selection**
   - System scans wallet for SatSpray membership cards
   - Displays list of found cards with status preview
   - User selects card to authenticate with

4. **Challenge-Response Authentication**
   - System generates nonce: GET `/auth/challenge`
   - User signs nonce with card-controlling address
   - System verifies signature: POST `/auth/verify`

5. **Balance Verification**
   - Backend verifies card balance by querying ordinal inscription:
     - Calls ordinal's `cardStatus()` function
     - Cross-references with child receipts for verification
     - Determines ACTIVE/EXPIRED status from ordinal logic
   - Returns authentication result (mirrors ordinal's self-reported status)

6. **Session Creation**
   - If active: Creates session cookie, grants access
   - If expired: Redirects to top-up flow
   - User gains access to protected features

**UI Screens:**
- Authentication prompt page
- Wallet connection modal
- Card selection interface
- Signature request screen
- Success/redirect page

**Technical Details:**
- GET `/auth/challenge` → `{nonce: "32-byte-hex"}`
- Wallet signs message with Taproot key
- POST `/auth/verify` → `{addr, sig, inscriptionId}`
- Response: `{active: bool, balance: number}`

**Error Handling:**
- No wallet detected → Installation guide
- No cards found → Redirect to purchase flow
- Signature failed → Retry prompt
- Card expired → Redirect to top-up flow
- Network error → Retry mechanism

---

### 3.3 Balance Confirmation Flow

#### 3.3.1 Website-Based Balance Check
**Entry Point:** Status badge component, authentication system

**Steps:**
1. **Automatic Balance Polling**
   - Status badge loads on page
   - System fetches card inscription ID
   - Polls `/inscriptions/{id}/children` every 30 seconds

2. **Balance Calculation**
   - For each child receipt:
     - Verify payment to treasury address
     - Calculate age: current_block - receipt_block
     - Apply decay: max(amount - age * 35, 0)
   - Sum all non-expired balances

3. **Status Display**
   - ACTIVE: ✅ "Active - X sats remaining"
   - EXPIRED: ❌ "Expired - Top-up required"
   - Shows decay rate: "35 sats/block"
   - Displays blocks remaining if active

**UI Elements:**
- Status badge with real-time updates
- Balance progress bar
- Decay rate information
- Time until expiration estimate

#### 3.3.2 Visual Ordinal Image Display
**Entry Point:** Ordinal wallet, inscription viewers

**Steps:**
1. **Ordinal Rendering**
   - Wallet loads inscription HTML
   - Embedded JavaScript executes
   - Calls `window.cardStatus()` function

2. **Dynamic SVG Selection**
   - Script calculates current balance
   - If balance > 0: Shows `active.svg`
   - If balance = 0: Shows `expired.svg`

3. **Status Overlay**
   - Renders balance text on image
   - Shows "X sats remaining" or "EXPIRED"
   - Displays decay rate information

**Technical Details:**
- HTML contains both SVG assets inline
- JavaScript: `DECAY_PER_BLOCK = 35`
- Function: `cardStatus()` returns `{balance, blocksRemaining, status}`

---

### 3.4 Top-Up Flow

#### 3.4.1 Active Card Holder Journey
**Entry Point:** Status badge shows low balance, or manual top-up

**Steps:**
1. **Top-Up Initiation**
   - User clicks "Top-Up" from status badge
   - Or accesses dedicated top-up page
   - System loads top-up widget

2. **Amount Selection**
   - User inputs desired days OR custom sat amount
   - Calculator shows: `35 × 144 × days` if days selected
   - Displays current balance + new balance after top-up

3. **PSBT Creation**
   - System builds PSBT with:
     - Payment to treasury address (specified amount)
     - 1-sat output with receipt JSON inscription
     - Change output (wallet adds automatically)

4. **Transaction Signing**
   - User reviews PSBT in wallet
   - Signs transaction with wallet
   - Broadcasts to network

5. **Confirmation Tracking**
   - System polls `/r/children/{parent_id}` for new receipt
   - Status badge refreshes to query ordinal's embedded logic for updated balance
   - Shows success message with new balance (retrieved from ordinal inscription)

**UI Screens:**
- Top-up widget/modal
- Amount selection interface
- PSBT review in wallet
- Transaction pending state
- Success confirmation

**Technical Details:**
- Receipt JSON schema: `satspray.topup.v1`
- PSBT outputs: treasury payment + 1-sat inscription
- Polling: Check for new children every 5 seconds

#### 3.4.2 Expired Card Holder Journey
**Entry Point:** Authentication fails due to expired card

**Steps:**
1. **Expiration Detection**
   - Authentication system detects balance = 0
   - Redirects to top-up flow
   - Shows "Card Expired" message

2. **Mandatory Top-Up**
   - User must add balance to regain access
   - Same top-up process as active users
   - Minimum top-up amount suggested

3. **Reactivation**
   - After successful top-up, card becomes active
   - User can retry authentication
   - Gains access to protected features

### 3.5 Manual Top-Up Flow (Privacy-Conscious)

#### 3.5.1 Ultra Privacy-Conscious User Journey
**Entry Point:** User prefers not to connect wallet to website

**Steps:**
1. **Manual Inscription ID Entry**
   - User accesses dedicated "Manual Top-Up" page
   - Enters membership card inscription ID manually
   - System validates inscription exists and is valid SatSpray card

2. **Membership Verification**
   - System displays current card status and balance
   - Shows "Valid Membership Card" confirmation
   - Displays current balance and expiration estimate

3. **Top-Up Amount Selection**
   - User selects desired top-up amount (days or custom sats)
   - System calculates: `35 × 144 × days` if days selected
   - Shows projected new balance after top-up

4. **Manual Transaction Instructions**
   - System generates and displays:
     - Treasury payment address
     - Exact payment amount
     - Receipt JSON template with pre-filled data
     - Step-by-step wallet instructions
   - User copies information to their wallet

5. **Manual PSBT Creation**
   - User creates transaction in their wallet:
     - Output 1: Payment to treasury address (specified amount)
     - Output 2: 1-sat inscription with receipt JSON
     - Change output handled by wallet
   - User signs and broadcasts transaction independently

6. **Transaction Verification (Optional)**
   - User returns to site with transaction ID (optional)
   - System provides "Check Transaction Status" tool for informational purposes
   - Once confirmed, user can verify new balance using inscription ID
   - Site does not update or store membership status - ordinal inscription handles all balance logic

**UI Screens:**
- Manual top-up entry page
- Inscription ID validation screen
- Transaction instruction display
- Step-by-step wallet guide
- Transaction verification tool

**Technical Details:**
- GET `/manual/validate/{inscriptionId}` → validates ID is a known membership card, queries ordinal for status
- GET `/manual/topup-instructions` → treasury address, JSON template
- POST `/manual/verify-transaction` → transaction status check (informational only)
- No wallet connection required
- Site only maintains list of valid inscription IDs, not membership status

**Error Handling:**
- Invalid inscription ID → Clear error message, retry option
- Inscription not found → "Card not found" with help links
- Transaction verification failed → Manual retry, support contact
- Network issues → Offline instruction download option

---

### 3.6 Manual Authentication Flow (Privacy-Conscious)

#### 3.6.1 Ultra Privacy-Conscious User Journey
**Entry Point:** User wants to authenticate without wallet connection

**Steps:**
1. **Manual Authentication Request**
   - User accesses "Manual Login" page
   - Enters membership card inscription ID manually
   - System validates inscription exists and is valid

2. **Challenge Generation**
   - System generates authentication nonce
   - Displays challenge message for signing
   - Shows inscription ID and current timestamp
   - Provides signing instructions for different wallets

3. **Manual Message Signing**
   - User copies challenge message to their wallet
   - Signs message with address controlling the inscription
   - Copies signature back to website
   - No wallet connection required

4. **Signature Verification**
   - User pastes signature into verification form
   - System verifies signature matches inscription-controlling address
   - Queries ordinal inscription for current balance and status
   - Determines ACTIVE/EXPIRED status from ordinal's embedded logic

5. **Session Creation**
   - If card active: Creates session cookie, grants access
   - If card expired: Redirects to manual top-up flow
   - Shows authentication success message

**UI Screens:**
- Manual authentication entry page
- Challenge message display
- Signature input form
- Wallet signing instructions
- Authentication result page

**Technical Details:**
- GET `/manual/challenge` → `{nonce, message, timestamp}`
- POST `/manual/verify` → `{inscriptionId, signature, address}`
- Response: `{active: bool, balance: number, session: string}`
- Message format: `SatSpray Auth: {nonce} - {timestamp}`

**Error Handling:**
- Invalid inscription ID → Clear error, retry option
- Invalid signature → "Signature verification failed" with retry
- Card expired → Auto-redirect to manual top-up
- Address mismatch → "Wrong signing address" error
- Network timeout → Manual retry option

---

## 4. Error Handling Flows

### 4.1 Valid Ordinal Not Found

#### 4.1.1 During Authentication
**Scenario:** User wallet contains no SatSpray membership cards

**Error Flow:**
1. System scans wallet for membership cards
2. No valid cards found
3. Display error: "No membership card found"
4. Options provided:
   - "Buy New Card" → Redirect to purchase flow
   - "Connect Different Wallet" → Retry wallet connection
   - "Help" → FAQ about card storage

#### 4.1.2 During Top-Up
**Scenario:** User tries to top-up with invalid inscription ID

**Error Flow:**
1. User enters inscription ID manually
2. System validates ID format and existence
3. Error: "Invalid inscription ID"
4. Options provided:
   - "Scan from Wallet" → Auto-detect cards
   - "Try Again" → Re-enter ID
   - "Buy New Card" → Redirect to purchase

### 4.2 Card Inactive/Expired

#### 4.2.1 During Authentication
**Scenario:** User has valid card but balance = 0

**Error Flow:**
1. System verifies card exists and is valid
2. Balance calculation returns 0
3. Authentication fails with "Card Expired"
4. Automatic redirect to top-up flow
5. After top-up, retry authentication

#### 4.2.2 During Feature Access
**Scenario:** Card expires while user is using features

**Error Flow:**
1. Real-time balance check detects expiration
2. Feature access immediately blocked
3. Session invalidated
4. Redirect to top-up flow
5. Show message: "Card expired during session"

### 4.3 Transaction Failures

#### 4.3.1 PSBT Signing Failure
**Error Flow:**
1. User rejects transaction in wallet
2. System shows "Transaction cancelled"
3. Options: "Try Again" or "Cancel"
4. Maintains form state for retry

#### 4.3.2 Network/Broadcasting Issues
**Error Flow:**
1. Transaction fails to broadcast
2. System shows "Network error"
3. Automatic retry after 5 seconds
4. Manual retry button available
5. After 3 failures, suggest checking wallet/network

### 4.4 Wallet Connection Issues

#### 4.4.1 No Wallet Detected
**Error Flow:**
1. User clicks "Connect Wallet"
2. No supported wallets found
3. Show installation guide for supported wallets
4. Links to wallet download pages

#### 4.4.2 Wallet Connection Refused
**Error Flow:**
1. User rejects connection request
2. Show "Connection required" message
3. Explain why connection is needed
4. "Try Again" button to retry

### 4.5 Manual Flow Specific Errors

#### 4.5.1 Manual Top-Up Errors
**Scenario:** User provides incorrect transaction details or fails verification

**Error Flow:**
1. User enters transaction ID for verification
2. System checks transaction against requirements
3. Error scenarios:
   - **Wrong treasury address:** "Payment not sent to correct address"
   - **Incorrect amount:** "Payment amount doesn't match specified amount"
   - **Missing receipt inscription:** "Receipt inscription not found in transaction"
   - **Invalid JSON format:** "Receipt format is invalid"
4. Options provided:
   - "Check Transaction Again" → Re-verify with same ID
   - "View Instructions" → Show transaction requirements again
   - "Contact Support" → Help with transaction issues

#### 4.5.2 Manual Authentication Errors
**Scenario:** User provides incorrect signature or inscription details

**Error Flow:**
1. User submits signature for verification
2. System validates signature and inscription ownership
3. Error scenarios:
   - **Invalid signature format:** "Signature format is invalid"
   - **Wrong signing address:** "Signature not from inscription owner"
   - **Expired challenge:** "Challenge expired, please request new one"
   - **Inscription not owned:** "Address doesn't control this inscription"
4. Options provided:
   - "Try Again" → Re-enter signature
   - "New Challenge" → Generate fresh challenge
   - "Signing Help" → Wallet-specific signing instructions
   - "Different Inscription" → Use different card

---

## 5. Feature Connections & Dependencies

### 5.1 Status Badge Dependencies
- **Backend API:** Balance calculation endpoint
- **Ordinals Data:** Child receipt inscriptions
- **Block Height:** Current Bitcoin block for decay calculation
- **Polling System:** 30-second refresh cycle

### 5.2 Top-Up Widget Connections
- **Status Badge:** Triggers widget from low balance warning
- **PSBT Creation:** Depends on treasury address and amount
- **Transaction Confirmation:** Updates status badge after success
- **Error Handling:** Connects to wallet connection flow

### 5.3 Authentication System Flow
- **Wallet Connection:** Required for signature generation
- **Card Verification:** Depends on ordinals data availability
- **Balance Calculation:** Real-time verification of card status
- **Session Management:** Creates/maintains user sessions

### 5.4 Cross-Component Data Flow
1. **Card Purchase** → **Status Badge** → **Top-Up Widget** → **Status Badge**
2. **Authentication** → **Balance Check** → **Feature Access** or **Top-Up Flow**
3. **Wallet Connection** → **Card Detection** → **Authentication** → **Session Creation**
4. **Manual Top-Up** → **Transaction Instructions** → **Manual Verification** → **Status Update**
5. **Manual Authentication** → **Challenge Generation** → **Manual Signing** → **Session Creation**

### 5.5 Privacy-Focused Manual Flow Dependencies
- **Manual Top-Up System:** Depends on treasury address, receipt JSON templates, optional transaction verification
- **Manual Authentication:** Requires challenge generation, signature verification, session management
- **Inscription Validation:** Shared validation logic between manual and automated flows (validates ID is known membership card)
- **Balance Verification:** Site queries ordinal inscription's embedded logic for both manual and wallet-connected flows

---

## 6. Technical Integration Points

### 6.1 Wallet Integration
- **Supported Wallets:** Xverse, Leather, Unisat
- **Required Features:** Taproot PSBT signing, message signing
- **Connection Flow:** Browser extension detection → connection request → address provision

### 6.2 Ordinals API Integration
- **Data Sources:** Ordinals indexer, Bitcoin RPC
- **Key Endpoints:** `/inscriptions/{id}`, `/inscriptions/{id}/children`
- **Rate Limits:** Considerate polling, caching strategies

### 6.3 Backend API Integration
- **Authentication:** Challenge/verify endpoints
- **Balance Verification:** Server queries ordinal inscription logic, maintains list of valid inscription IDs only
- **Session Management:** Cookie-based sessions with expiration
- **No Status Storage:** Site does not store membership status - relies on ordinal inscription self-reporting

---

*End of Document* 