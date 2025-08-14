# SatSpray Membership Card – Project Rules

**Project Name:** SatSpray Membership Card  
**Version:** 0.2 (Proof‑of‑Concept)  
**Document Type:** Development Guidelines & Project Rules  
**Date:** 11 July 2025  

---

## AI-First Development Principles

### Core Philosophy
This codebase is designed to be **AI-first**, meaning it should be easily understood, navigated, and modified by both human developers and AI systems. Every design decision prioritizes clarity, modularity, and maintainability.

### Key Principles
1. **Explicitness over Cleverness** - Code should be immediately understandable
2. **Modularity by Design** - Every component, service, and utility should be self-contained
3. **Documentation as Code** - Documentation should be comprehensive and up-to-date
4. **Consistent Patterns** - Similar problems should be solved in similar ways
5. **AI-Readable Structure** - File and directory names should clearly indicate purpose

---

## Directory Structure

### Root Level Organization
```
satspray-membership-card/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js application
├── shared/                 # Shared types and utilities
├── docs/                   # All documentation
├── scripts/                # Build and deployment scripts
├── tests/                  # Integration and E2E tests
├── .config/                # Configuration files
└── .github/                # GitHub workflows and templates
```

### Frontend Structure (client/)
```
client/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Generic UI components
│   │   ├── wallet/         # Wallet-specific components
│   │   ├── membership/     # Membership card components
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components
│   ├── pages/              # Route-level page components
│   │   ├── home/           # Home page components
│   │   ├── auth/           # Authentication pages
│   │   ├── membership/     # Membership management pages
│   │   └── manual/         # Manual flow pages
│   ├── hooks/              # Custom React hooks
│   │   ├── wallet/         # Wallet-related hooks
│   │   ├── membership/     # Membership-related hooks
│   │   └── common/         # General utility hooks
│   ├── services/           # API and external service integrations
│   │   ├── api/            # Backend API client
│   │   ├── bitcoin/        # Bitcoin/ordinals services
│   │   └── wallet/         # Wallet integration services
│   ├── stores/             # Zustand state management
│   │   ├── wallet.store.ts
│   │   ├── membership.store.ts
│   │   └── ui.store.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── bitcoin.types.ts
│   │   ├── wallet.types.ts
│   │   └── membership.types.ts
│   ├── utils/              # Utility functions
│   │   ├── bitcoin/        # Bitcoin-specific utilities
│   │   ├── validation/     # Input validation utilities
│   │   └── format/         # Data formatting utilities
│   ├── constants/          # Application constants
│   │   ├── bitcoin.constants.ts
│   │   ├── ui.constants.ts
│   │   └── api.constants.ts
│   ├── styles/             # Global styles and theme
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── utilities.css
│   └── assets/             # Static assets
│       ├── images/
│       ├── icons/
│       └── fonts/
├── public/                 # Public static files
├── tests/                  # Frontend tests
│   ├── components/         # Component tests
│   ├── hooks/              # Hook tests
│   ├── services/           # Service tests
│   └── utils/              # Utility tests
└── build/                  # Build output
```

### Backend Structure (server/)
```
server/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── membership.controller.ts
│   │   └── manual.controller.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── services/           # Business logic
│   │   ├── bitcoin.service.ts
│   │   ├── ordinals.service.ts
│   │   ├── membership.service.ts
│   │   └── wallet.service.ts
│   ├── models/             # Database models
│   │   ├── inscription.model.ts
│   │   └── session.model.ts
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   ├── membership.routes.ts
│   │   └── manual.routes.ts
│   ├── utils/              # Utility functions
│   │   ├── bitcoin/        # Bitcoin-specific utilities
│   │   ├── validation/     # Input validation
│   │   └── crypto/         # Cryptographic utilities
│   ├── types/              # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── bitcoin.types.ts
│   │   └── database.types.ts
│   ├── constants/          # Application constants
│   │   ├── bitcoin.constants.ts
│   │   └── api.constants.ts
│   ├── config/             # Configuration files
│   │   ├── database.config.ts
│   │   ├── bitcoin.config.ts
│   │   └── server.config.ts
│   └── database/           # Database setup and migrations
│       ├── connection.ts
│       ├── migrations/
│       └── seeds/
├── tests/                  # Backend tests
│   ├── controllers/        # Controller tests
│   ├── services/           # Service tests
│   ├── middleware/         # Middleware tests
│   └── utils/              # Utility tests
└── build/                  # Build output
```

### Shared Structure (shared/)
```
shared/
├── types/                  # Shared type definitions
│   ├── api.types.ts
│   ├── bitcoin.types.ts
│   └── membership.types.ts
├── constants/              # Shared constants
│   ├── bitcoin.constants.ts
│   └── api.constants.ts
├── utils/                  # Shared utility functions
│   ├── validation.utils.ts
│   └── format.utils.ts
└── schemas/                # Validation schemas
    ├── membership.schema.ts
    └── bitcoin.schema.ts
```

---

## File Naming Conventions

### General Rules
- Use **kebab-case** for directories: `membership-card`, `wallet-connection`
- Use **PascalCase** for React components: `MembershipCard.tsx`, `WalletConnection.tsx`
- Use **camelCase** for TypeScript files: `bitcoinService.ts`, `membershipStore.ts`
- Use **descriptive suffixes** to indicate file type:
  - `.component.tsx` for React components
  - `.service.ts` for service classes
  - `.store.ts` for state management
  - `.utils.ts` for utility functions
  - `.types.ts` for type definitions
  - `.constants.ts` for constants
  - `.config.ts` for configuration
  - `.test.ts` or `.spec.ts` for tests

### Specific Naming Patterns

#### Components
```
// Good
MembershipCard.component.tsx
WalletConnection.component.tsx
StatusBadge.component.tsx
TopUpModal.component.tsx

// Bad
card.tsx
wallet.tsx
status.tsx
modal.tsx
```

#### Services
```
// Good
bitcoin.service.ts
ordinals.service.ts
membership.service.ts
wallet.service.ts

// Bad
bitcoin.ts
ord.ts
membership.ts
w.ts
```

#### Hooks
```
// Good
useWalletConnection.hook.ts
useMembershipStatus.hook.ts
useBalanceCalculation.hook.ts

// Bad
useWallet.ts
useMembership.ts
useBalance.ts
```

#### Types
```
// Good
bitcoin.types.ts
wallet.types.ts
membership.types.ts
api.types.ts

// Bad
types.ts
interfaces.ts
t.ts
```

#### Utilities
```
// Good
bitcoin.utils.ts
validation.utils.ts
format.utils.ts
crypto.utils.ts

// Bad
utils.ts
helpers.ts
misc.ts
```

---

## Code Organization Rules

### File Size Limits
- **Maximum 500 lines per file** to ensure AI compatibility
- **Maximum 50 lines per function** for readability
- **Maximum 10 functions per file** for maintainability
- When files exceed limits, split into logical modules

### Function Organization
```typescript
/**
 * Service for handling Bitcoin operations and PSBT creation
 * Provides methods for creating top-up transactions and verifying signatures
 */
export class BitcoinService {
  private network: bitcoin.Network;
  
  /**
   * Initialize Bitcoin service with network configuration
   * @param isMainnet - Whether to use mainnet (true) or testnet (false)
   */
  constructor(isMainnet: boolean = false) {
    this.network = isMainnet ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
  }
  
  /**
   * Create a PSBT for membership card top-up transaction
   * @param inscriptionId - The parent inscription ID to top up
   * @param topUpAmount - Amount in satoshis to add to the card
   * @param treasuryAddress - Address to send the treasury payment
   * @param utxos - Available UTXOs for the transaction
   * @returns Partially signed Bitcoin transaction
   */
  public createTopUpPSBT(
    inscriptionId: string,
    topUpAmount: number,
    treasuryAddress: string,
    utxos: UTXO[]
  ): bitcoin.Psbt {
    // Implementation here
  }
  
  // Additional methods...
}
```

### Component Organization
```typescript
/**
 * Membership card component that displays card status and provides top-up functionality
 * Handles wallet connection, balance display, and transaction creation
 */
interface MembershipCardProps {
  /** The inscription ID of the membership card */
  inscriptionId: string;
  /** Optional callback when card status changes */
  onStatusChange?: (status: CardStatus) => void;
  /** Whether to show the top-up button */
  showTopUp?: boolean;
}

/**
 * Main membership card component
 * Displays card status, balance, and provides top-up functionality
 */
export const MembershipCard: React.FC<MembershipCardProps> = ({
  inscriptionId,
  onStatusChange,
  showTopUp = true
}) => {
  // State management
  const [status, setStatus] = useState<CardStatus>('loading');
  const [balance, setBalance] = useState<number>(0);
  
  // Custom hooks
  const { isConnected, address } = useWalletConnection();
  const { calculateBalance } = useBalanceCalculation();
  
  // Effects and handlers
  useEffect(() => {
    // Effect implementation
  }, [inscriptionId]);
  
  const handleTopUp = useCallback(async () => {
    // Handler implementation
  }, [inscriptionId, address]);
  
  // Render logic
  return (
    <div className="membership-card">
      {/* Component JSX */}
    </div>
  );
};
```

---

## Documentation Standards

### File Headers
Every file must include a header comment explaining its purpose:

```typescript
/**
 * @fileoverview Bitcoin service for handling ordinals transactions and PSBT creation
 * @module services/bitcoin
 * @author SatSpray Development Team
 * @since 0.2.0
 * 
 * This service provides functionality for:
 * - Creating top-up PSBTs for membership cards
 * - Verifying Bitcoin signatures
 * - Managing transaction broadcasts
 * - Calculating transaction fees
 */
```

### Function Documentation
All functions must include JSDoc comments:

```typescript
/**
 * Calculate the current balance of a membership card
 * @param inscriptionId - The inscription ID of the membership card
 * @param currentBlock - The current Bitcoin block height
 * @returns Promise resolving to the balance in satoshis
 * @throws {Error} When inscription ID is invalid
 * @throws {NetworkError} When unable to fetch ordinals data
 * @example
 * ```typescript
 * const balance = await calculateBalance('abc123', 850000);
 * console.log(`Balance: ${balance} sats`);
 * ```
 */
async function calculateBalance(
  inscriptionId: string,
  currentBlock: number
): Promise<number> {
  // Implementation
}
```

### Type Documentation
All types and interfaces must be documented:

```typescript
/**
 * Represents a Bitcoin UTXO (Unspent Transaction Output)
 * Used for building transactions and calculating fees
 */
interface UTXO {
  /** Transaction hash containing the UTXO */
  txid: string;
  /** Output index within the transaction */
  vout: number;
  /** Value of the UTXO in satoshis */
  value: number;
  /** Script pub key of the UTXO */
  scriptPubKey: string;
  /** Optional confirmation count */
  confirmations?: number;
}

/**
 * Status of a membership card
 * - 'loading': Initial state while fetching data
 * - 'active': Card has balance and is usable
 * - 'expired': Card balance is zero or negative
 * - 'error': Error occurred while fetching status
 */
type CardStatus = 'loading' | 'active' | 'expired' | 'error';
```

---

## Import/Export Standards

### Import Organization
```typescript
// 1. Node.js built-in modules
import { promisify } from 'util';
import * as path from 'path';

// 2. Third-party libraries
import * as bitcoin from 'bitcoinjs-lib';
import { Request, Response } from 'express';
import React, { useState, useEffect } from 'react';

// 3. Internal modules (absolute imports)
import { BitcoinService } from '@/services/bitcoin.service';
import { MembershipCard } from '@/components/membership/MembershipCard.component';
import { BITCOIN_CONSTANTS } from '@/constants/bitcoin.constants';

// 4. Relative imports (only when necessary)
import { validateInscriptionId } from '../utils/validation.utils';
import { CardStatus } from './types';
```

### Export Standards
```typescript
// Named exports for utilities and services
export { BitcoinService } from './bitcoin.service';
export { OrdinalsService } from './ordinals.service';
export { MembershipService } from './membership.service';

// Default export for React components
export default MembershipCard;

// Type exports
export type { CardStatus, UTXO, InscriptionData } from './types';
```

---

## Testing Standards

### Test File Organization
```typescript
/**
 * @fileoverview Tests for Bitcoin service functionality
 * @module tests/services/bitcoin
 * 
 * Tests cover:
 * - PSBT creation and validation
 * - Signature verification
 * - Network configuration
 * - Error handling
 */

describe('BitcoinService', () => {
  let bitcoinService: BitcoinService;
  
  beforeEach(() => {
    bitcoinService = new BitcoinService(false); // testnet
  });
  
  describe('createTopUpPSBT', () => {
    it('should create valid PSBT with correct outputs', () => {
      // Test implementation
    });
    
    it('should handle insufficient funds error', () => {
      // Test implementation
    });
  });
  
  describe('verifySignature', () => {
    it('should verify valid Bitcoin signatures', () => {
      // Test implementation
    });
    
    it('should reject invalid signatures', () => {
      // Test implementation
    });
  });
});
```

### Test Naming
- Test files: `*.test.ts` or `*.spec.ts`
- Test directories mirror source structure
- Descriptive test names that explain expected behavior

---

## Error Handling Standards

### Error Types
```typescript
/**
 * Base error class for all application errors
 * Provides consistent error structure and logging
 */
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when Bitcoin operations fail
 * Includes transaction details and recovery suggestions
 */
class BitcoinError extends AppError {
  readonly code = 'BITCOIN_ERROR';
  readonly statusCode = 400;
  
  constructor(
    message: string,
    public readonly txid?: string,
    context?: Record<string, any>
  ) {
    super(message, context);
  }
}

/**
 * Error thrown when wallet operations fail
 * Includes wallet type and connection status
 */
class WalletError extends AppError {
  readonly code = 'WALLET_ERROR';
  readonly statusCode = 400;
  
  constructor(
    message: string,
    public readonly walletType?: string,
    context?: Record<string, any>
  ) {
    super(message, context);
  }
}
```

### Error Handling Pattern
```typescript
/**
 * Handle errors with consistent logging and user feedback
 * @param error - The error to handle
 * @param context - Additional context for logging
 * @returns Formatted error response
 */
export function handleError(error: unknown, context?: Record<string, any>) {
  // Log error with context
  logger.error('Operation failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context
  });
  
  // Return user-friendly error
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  };
}
```

---

## Performance Standards

### Code Splitting
```typescript
// Lazy load components for better performance
const MembershipCard = React.lazy(() => import('@/components/membership/MembershipCard.component'));
const WalletConnection = React.lazy(() => import('@/components/wallet/WalletConnection.component'));
const TopUpModal = React.lazy(() => import('@/components/modals/TopUpModal.component'));

// Use React.memo for expensive components
export const MembershipCard = React.memo<MembershipCardProps>(({ inscriptionId }) => {
  // Component implementation
});
```

### Caching Strategy
```typescript
/**
 * Cache service for storing frequently accessed data
 * Implements TTL-based caching with automatic cleanup
 */
class CacheService {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 30000; // 30 seconds
  
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or undefined if expired/missing
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }
  
  /**
   * Set value in cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }
}
```

---

## Security Standards

### Input Validation
```typescript
/**
 * Validate Bitcoin inscription ID format
 * @param inscriptionId - The inscription ID to validate
 * @throws {ValidationError} If ID format is invalid
 */
export function validateInscriptionId(inscriptionId: string): void {
  if (!inscriptionId || typeof inscriptionId !== 'string') {
    throw new ValidationError('Inscription ID must be a non-empty string');
  }
  
  if (!/^[a-f0-9]{64}i[0-9]+$/.test(inscriptionId)) {
    throw new ValidationError('Invalid inscription ID format');
  }
}

/**
 * Validate Bitcoin address format
 * @param address - The address to validate
 * @param network - The Bitcoin network (mainnet/testnet)
 * @throws {ValidationError} If address is invalid
 */
export function validateBitcoinAddress(address: string, network: bitcoin.Network): void {
  try {
    bitcoin.address.toOutputScript(address, network);
  } catch (error) {
    throw new ValidationError(`Invalid Bitcoin address: ${address}`);
  }
}
```

### Environment Configuration
```typescript
/**
 * Environment configuration with validation
 * Ensures all required environment variables are present
 */
const config = {
  // Server configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Bitcoin configuration
  BITCOIN_NETWORK: process.env.BITCOIN_NETWORK || 'testnet',
  TREASURY_ADDRESS: requiredEnv('TREASURY_ADDRESS'),
  ORDINALS_API_URL: requiredEnv('ORDINALS_API_URL'),
  
  // Security configuration
  JWT_SECRET: requiredEnv('JWT_SECRET'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
} as const;

/**
 * Ensure required environment variable is present
 * @param key - Environment variable key
 * @returns Environment variable value
 * @throws {Error} If environment variable is missing
 */
function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
```

---

## Version Control Standards

### Commit Message Format
```
type(scope): description

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

Examples:
```
feat(wallet): add support for Leather wallet integration

- Implement Leather wallet connection
- Add PSBT signing for Leather
- Update wallet selection UI

Closes #123
```

### Branch Naming
- `feature/wallet-integration`
- `fix/balance-calculation-error`
- `docs/api-documentation`
- `refactor/service-layer`

---

## AI-Friendly Patterns

### Consistent Patterns
1. **Always use the same pattern for similar functionality**
2. **Prefer explicit over implicit**
3. **Use descriptive variable names**
4. **Keep functions focused on single responsibility**
5. **Include examples in documentation**

### AI-Readable Code
```typescript
// Good: Explicit and descriptive
const calculateMembershipCardBalance = async (
  inscriptionId: string,
  currentBlockHeight: number
): Promise<{ balance: number; status: CardStatus }> => {
  // Implementation
};

// Bad: Implicit and abbreviated
const calcBal = async (id: string, height: number) => {
  // Implementation
};
```

### Modular Design
```typescript
// Good: Single responsibility modules
export class BitcoinTransactionService {
  // Only handles Bitcoin transactions
}

export class OrdinalsDataService {
  // Only handles ordinals data
}

export class MembershipValidationService {
  // Only handles membership validation
}

// Bad: God class with mixed responsibilities
export class BitcoinService {
  // Handles transactions, data, validation, UI state, etc.
}
```

---

## Build and Deployment Standards

### Build Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && vite",
    "dev:server": "cd server && ts-node-dev src/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && vite build",
    "build:server": "cd server && tsc",
    "test": "npm run test:client && npm run test:server",
    "test:client": "cd client && jest",
    "test:server": "cd server && jest",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### Environment Files
```bash
# .env.development
NODE_ENV=development
BITCOIN_NETWORK=testnet
TREASURY_ADDRESS=tb1q...
ORDINALS_API_URL=https://api.testnet.ordinals.com

# .env.production
NODE_ENV=production
BITCOIN_NETWORK=mainnet
TREASURY_ADDRESS=bc1q...
ORDINALS_API_URL=https://api.ordinals.com
```

---

## Quality Gates

### Pre-commit Checks
1. **ESLint** - Code quality and style
2. **TypeScript** - Type checking
3. **Prettier** - Code formatting
4. **Unit Tests** - Test coverage
5. **Build** - Ensure code builds successfully

### CI/CD Pipeline
1. **Lint and Format** - Automated code quality
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Test suite execution
4. **Build** - Production build validation
5. **Integration Tests** - End-to-end testing
6. **Security Scan** - Vulnerability assessment

---

*This document establishes the complete set of rules and standards for developing the SatSpray Membership Card application in an AI-first, modular, and scalable manner. All team members and AI systems should follow these guidelines to ensure consistent, maintainable, and high-quality code.* 