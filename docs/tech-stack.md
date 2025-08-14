# SatSpray Membership Card – Technology Stack Guide

**Project Name:** SatSpray Membership Card  
**Version:** 0.2 (Proof‑of‑Concept)  
**Document Type:** Technology Stack Reference  
**Date:** 11 July 2025  

---

## Selected Technology Stack

### Frontend Stack
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Zustand (for simplicity)
- **Testing**: Jest + React Testing Library

### Backend Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Authentication**: JWT with httpOnly cookies
- **Database**: SQLite with better-sqlite3
- **Testing**: Jest + Supertest

### Bitcoin Integration
- **Bitcoin Library**: bitcoinjs-lib
- **Ordinals API**: Custom integration with ordinals indexer
- **Wallet Integration**: Sats-Connect + individual wallet adapters

### Development Tools
- **Package Manager**: npm (consistent with Node.js ecosystem)
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged

---

## Frontend Technologies

### React 18+ with TypeScript

#### Best Practices
```typescript
// Use functional components with hooks
const MembershipCard: React.FC<MembershipCardProps> = ({ inscriptionId }) => {
  const [status, setStatus] = useState<CardStatus>('loading');
  
  // Use useCallback for event handlers
  const handleTopUp = useCallback(async () => {
    // Implementation
  }, [inscriptionId]);
  
  // Use useMemo for expensive calculations
  const calculatedBalance = useMemo(() => {
    return calculateBalance(receipts, currentBlock);
  }, [receipts, currentBlock]);
  
  return (
    <div className="membership-card">
      {/* JSX */}
    </div>
  );
};
```

#### Conventions
- **File Structure**: Feature-based organization
```
src/
├── components/
│   ├── common/
│   ├── wallet/
│   └── membership/
├── hooks/
├── services/
├── types/
└── utils/
```

- **Component Naming**: PascalCase for components, camelCase for props
- **Hook Naming**: Always start with `use` prefix
- **Type Definitions**: Create interfaces for all props and state

#### Common Pitfalls
1. **Unnecessary Re-renders**: Use React.memo for components that don't need frequent updates
2. **Stale Closures**: Be careful with useEffect dependencies
3. **Memory Leaks**: Always cleanup subscriptions and timeouts
4. **Prop Drilling**: Use context or state management for deeply nested props

#### Important Considerations
- **Bitcoin Integration**: React components should never directly interact with Bitcoin APIs
- **Wallet State**: Use context for wallet connection state across components
- **Error Boundaries**: Implement error boundaries for wallet and API failures
- **Loading States**: Always handle loading and error states for async operations

#### Limitations
- **Bundle Size**: Can grow large with many dependencies
- **SEO**: Limited without SSR (not needed for this project)
- **Performance**: Virtual DOM overhead for very large lists

---

### Tailwind CSS

#### Best Practices
```typescript
// Use consistent spacing scale
const Card: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">
      Membership Card
    </h2>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Status</span>
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
          Active
        </span>
      </div>
    </div>
  </div>
);
```

#### Conventions
- **Responsive Design**: Mobile-first approach with `sm:`, `md:`, `lg:` prefixes
- **Color Consistency**: Use defined color palette, avoid arbitrary colors
- **Component Classes**: Create reusable component classes in CSS
```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500;
  }
}
```

#### Common Pitfalls
1. **Class Name Bloat**: Extract common patterns into component classes
2. **Inconsistent Spacing**: Stick to the spacing scale (4, 8, 12, 16, etc.)
3. **Arbitrary Values**: Avoid arbitrary values like `w-[243px]`, use scale values
4. **Unused Classes**: Configure purging correctly to remove unused styles

#### Important Considerations
- **Bitcoin UI**: Design for wallet interactions (loading states, error messages)
- **Accessibility**: Use proper contrast ratios and focus indicators
- **Dark Mode**: Consider implementing dark mode for better UX
- **Mobile**: Ensure wallet interactions work well on mobile devices

#### Limitations
- **Learning Curve**: Requires memorizing utility classes
- **HTML Verbosity**: Can make HTML look cluttered
- **Design System**: Requires discipline to maintain consistency

---

### Vite

#### Best Practices
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Define environment variables
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

#### Conventions
- **Environment Files**: Use `.env.local` for local development
- **Asset Imports**: Use explicit imports for assets
- **Code Splitting**: Use dynamic imports for route-based code splitting

#### Common Pitfalls
1. **Environment Variables**: Must be prefixed with `VITE_` to be exposed
2. **Node.js APIs**: Cannot be used in client-side code
3. **CommonJS**: Prefer ES modules, avoid CommonJS when possible

#### Important Considerations
- **Bitcoin Libraries**: Some Bitcoin libraries may need special handling
- **Wallet Extensions**: Ensure proper loading of wallet extension APIs
- **Build Output**: Configure build output for production deployment

#### Limitations
- **IE Support**: No support for Internet Explorer
- **Node.js Polyfills**: Not included by default

---

### Zustand (State Management)

#### Best Practices
```typescript
// stores/walletStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  wallet: string | null;
  connect: (wallet: string) => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  subscribeWithSelector((set, get) => ({
    address: null,
    isConnected: false,
    wallet: null,
    connect: async (wallet: string) => {
      try {
        const address = await connectWallet(wallet);
        set({ address, isConnected: true, wallet });
      } catch (error) {
        set({ address: null, isConnected: false, wallet: null });
        throw error;
      }
    },
    disconnect: () => {
      set({ address: null, isConnected: false, wallet: null });
    },
  }))
);
```

#### Conventions
- **Store Organization**: One store per domain (wallet, membership, etc.)
- **Async Actions**: Handle async operations within actions
- **Selector Pattern**: Use selectors for computed values

#### Common Pitfalls
1. **Mutating State**: Always return new objects, never mutate directly
2. **Async State**: Handle loading and error states properly
3. **Subscriptions**: Be careful with subscriptions to prevent memory leaks

#### Important Considerations
- **Bitcoin State**: Store minimal Bitcoin-related state, query when needed
- **Wallet Persistence**: Consider persisting wallet connection state
- **Error Handling**: Implement proper error handling for wallet operations

#### Limitations
- **DevTools**: Less sophisticated than Redux DevTools
- **Time Travel**: No built-in time travel debugging

---

## Backend Technologies

### Node.js with TypeScript

#### Best Practices
```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

export default app;
```

#### Conventions
- **File Structure**: Feature-based organization
```
src/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
└── types/
```

- **Error Handling**: Centralized error handling middleware
- **Logging**: Use structured logging (Winston or Pino)
- **Validation**: Input validation with Joi or Zod

#### Common Pitfalls
1. **Blocking Operations**: Avoid synchronous operations in request handlers
2. **Memory Leaks**: Be careful with event listeners and timers
3. **Unhandled Rejections**: Always handle promise rejections
4. **Security**: Never expose sensitive information in error messages

#### Important Considerations
- **Bitcoin RPC**: Configure proper connection pooling for Bitcoin RPC calls
- **Ordinals API**: Implement caching for ordinals data
- **Rate Limiting**: Protect against abuse, especially for Bitcoin operations
- **Error Logging**: Log all Bitcoin-related errors for debugging

#### Limitations
- **Single-threaded**: CPU-intensive operations can block the event loop
- **Memory Usage**: Can consume significant memory with large objects

---

### Express.js

#### Best Practices
```typescript
// routes/auth.ts
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/challenge',
  rateLimit({ windowMs: 60000, max: 10 }), // 10 requests per minute
  async (req, res, next) => {
    try {
      const nonce = generateNonce();
      const challenge = await createChallenge(nonce);
      res.json({ nonce, challenge });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/verify',
  [
    body('signature').isString().notEmpty(),
    body('address').isString().notEmpty(),
    body('inscriptionId').isString().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { signature, address, inscriptionId } = req.body;
      const result = await verifySignature(signature, address, inscriptionId);
      
      if (result.valid) {
        const token = generateJWT(address, inscriptionId);
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

#### Conventions
- **Route Organization**: Group related routes in separate files
- **Middleware Order**: Authentication → validation → business logic
- **Response Format**: Consistent JSON response format
- **Status Codes**: Use appropriate HTTP status codes

#### Common Pitfalls
1. **Middleware Order**: Middleware order matters, especially for authentication
2. **Error Handling**: Don't forget to call `next(error)` for async errors
3. **Route Conflicts**: Be careful with route parameter conflicts
4. **Memory Leaks**: Clean up resources in middleware

#### Important Considerations
- **Bitcoin Operations**: Implement proper timeouts for Bitcoin RPC calls
- **Inscription Validation**: Cache inscription validation results
- **Signature Verification**: Use proper Bitcoin signature verification
- **CORS**: Configure CORS properly for wallet interactions

#### Limitations
- **Middleware Complexity**: Can become complex with many middleware functions
- **Error Propagation**: Error handling can be tricky with nested middleware

---

### JWT Authentication

#### Best Practices
```typescript
// utils/jwt.ts
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
  address: string;
  inscriptionId: string;
  iat: number;
  exp: number;
}

export const generateJWT = (address: string, inscriptionId: string): string => {
  return jwt.sign(
    { address, inscriptionId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyJWT = promisify(jwt.verify) as (
  token: string,
  secret: string
) => Promise<JWTPayload>;

// middleware/auth.ts
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const payload = await verifyJWT(token, JWT_SECRET);
    
    // Verify inscription is still active
    const inscriptionStatus = await checkInscriptionStatus(payload.inscriptionId);
    if (!inscriptionStatus.active) {
      return res.status(401).json({ error: 'Inscription inactive' });
    }
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### Conventions
- **Token Storage**: Use httpOnly cookies for web applications
- **Refresh Tokens**: Consider implementing refresh tokens for long-lived sessions
- **Payload Structure**: Keep payload minimal and non-sensitive

#### Common Pitfalls
1. **Secret Management**: Never hardcode JWT secrets, use environment variables
2. **Token Expiration**: Handle token expiration gracefully
3. **Signature Algorithm**: Always specify the algorithm explicitly
4. **Sensitive Data**: Never store sensitive data in JWT payload

#### Important Considerations
- **Bitcoin Addresses**: Include Bitcoin address in JWT for verification
- **Inscription Status**: Verify inscription status on each authenticated request
- **Token Revocation**: Consider implementing token blacklisting
- **Clock Skew**: Account for clock skew in token validation

#### Limitations
- **Token Size**: JWTs can become large with lots of claims
- **Revocation**: Difficult to revoke tokens before expiration
- **Stateless**: Cannot track user sessions server-side

---

### SQLite with better-sqlite3

#### Best Practices
```typescript
// database/connection.ts
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'satspray.db');

export const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS valid_inscriptions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
  );
  
  CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    inscription_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (inscription_id) REFERENCES valid_inscriptions(id)
  );
`);

// services/inscriptionService.ts
export class InscriptionService {
  private static insertInscription = db.prepare(`
    INSERT OR REPLACE INTO valid_inscriptions (id, metadata)
    VALUES (?, ?)
  `);
  
  private static getInscription = db.prepare(`
    SELECT * FROM valid_inscriptions WHERE id = ?
  `);
  
  public static addValidInscription(id: string, metadata: object): void {
    this.insertInscription.run(id, JSON.stringify(metadata));
  }
  
  public static isValidInscription(id: string): boolean {
    const result = this.getInscription.get(id);
    return !!result;
  }
}
```

#### Conventions
- **Prepared Statements**: Always use prepared statements for queries
- **Transaction Management**: Use transactions for multiple related operations
- **Schema Migrations**: Implement schema versioning for updates
- **Backup Strategy**: Regular backups of the database file

#### Common Pitfalls
1. **Concurrent Writes**: SQLite has limitations with concurrent writes
2. **Long Transactions**: Avoid long-running transactions
3. **File Locking**: Be aware of file locking issues
4. **Memory Usage**: Large result sets can consume significant memory

#### Important Considerations
- **Inscription Storage**: Only store inscription IDs and minimal metadata
- **Performance**: Create indexes on frequently queried columns
- **Backup**: Implement automated backup for the database file
- **Monitoring**: Monitor database size and performance

#### Limitations
- **Concurrency**: Limited concurrent write performance
- **Network**: Not suitable for distributed systems
- **Size Limits**: Practical limits around 1TB
- **Replication**: No built-in replication features

---

## Bitcoin Integration

### bitcoinjs-lib

#### Best Practices
```typescript
// services/bitcoinService.ts
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

export class BitcoinService {
  private network: bitcoin.Network;
  
  constructor(isMainnet: boolean = false) {
    this.network = isMainnet ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
  }
  
  // Create PSBT for top-up transaction
  public createTopUpPSBT(
    inscriptionId: string,
    topUpAmount: number,
    treasuryAddress: string,
    utxos: UTXO[]
  ): bitcoin.Psbt {
    const psbt = new bitcoin.Psbt({ network: this.network });
    
    // Add inputs
    utxos.forEach(utxo => {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: Buffer.from(utxo.scriptPubKey, 'hex'),
          value: utxo.value,
        },
      });
    });
    
    // Add treasury payment output
    psbt.addOutput({
      address: treasuryAddress,
      value: topUpAmount,
    });
    
    // Add receipt inscription output
    const receiptData = this.createReceiptInscription(inscriptionId, topUpAmount);
    psbt.addOutput({
      script: this.createInscriptionScript(receiptData),
      value: 1, // 1 sat for inscription
    });
    
    return psbt;
  }
  
  // Verify signature
  public verifySignature(
    message: string,
    signature: string,
    address: string
  ): boolean {
    try {
      const messageBuffer = Buffer.from(message, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');
      
      return bitcoin.message.verify(messageBuffer, address, signatureBuffer);
    } catch (error) {
      return false;
    }
  }
  
  private createReceiptInscription(inscriptionId: string, amount: number): Buffer {
    const receipt = {
      schema: 'satspray.topup.v1',
      parent: inscriptionId,
      amount: amount,
      block: 0, // Will be filled when confirmed
      paid_to: process.env.TREASURY_ADDRESS,
      txid: '', // Will be filled when broadcast
    };
    
    return Buffer.from(JSON.stringify(receipt));
  }
  
  private createInscriptionScript(data: Buffer): Buffer {
    return bitcoin.script.compile([
      Buffer.from('ord'),
      bitcoin.opcodes.OP_1,
      Buffer.from('application/json'),
      bitcoin.opcodes.OP_0,
      data,
    ]);
  }
}
```

#### Conventions
- **Network Configuration**: Always specify network explicitly
- **Error Handling**: Wrap all Bitcoin operations in try-catch blocks
- **Validation**: Validate all inputs before creating transactions
- **Fee Calculation**: Implement proper fee calculation

#### Common Pitfalls
1. **Network Mismatch**: Always verify network compatibility
2. **UTXO Management**: Properly track and manage UTXOs
3. **Fee Calculation**: Underestimating fees can cause stuck transactions
4. **Signature Verification**: Use proper message signing format

#### Important Considerations
- **Testnet vs Mainnet**: Use testnet for development
- **PSBT Compatibility**: Ensure PSBT compatibility with target wallets
- **Transaction Size**: Monitor transaction size to avoid high fees
- **Inscription Format**: Follow ordinals inscription standards

#### Limitations
- **Complex Scripts**: Limited support for complex script types
- **Performance**: Can be slow for complex operations
- **Memory Usage**: Large transactions can consume significant memory

---

### Ordinals API Integration

#### Best Practices
```typescript
// services/ordinalsService.ts
import axios, { AxiosResponse } from 'axios';

export class OrdinalsService {
  private baseURL: string;
  private cache: Map<string, any> = new Map();
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  // Get inscription data with caching
  public async getInscription(id: string): Promise<Inscription | null> {
    const cacheKey = `inscription:${id}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response: AxiosResponse<Inscription> = await axios.get(
        `${this.baseURL}/inscriptions/${id}`,
        { timeout: 10000 }
      );
      
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch inscription ${id}:`, error);
      return null;
    }
  }
  
  // Get child inscriptions (receipts)
  public async getChildren(parentId: string): Promise<Inscription[]> {
    const cacheKey = `children:${parentId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response: AxiosResponse<Inscription[]> = await axios.get(
        `${this.baseURL}/inscriptions/${parentId}/children`,
        { timeout: 10000 }
      );
      
      // Cache for 30 seconds
      this.cache.set(cacheKey, response.data);
      setTimeout(() => this.cache.delete(cacheKey), 30000);
      
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch children for ${parentId}:`, error);
      return [];
    }
  }
  
  // Calculate balance from receipts
  public async calculateBalance(inscriptionId: string): Promise<number> {
    const children = await this.getChildren(inscriptionId);
    const currentBlock = await this.getCurrentBlockHeight();
    
    let balance = 0;
    
    for (const child of children) {
      try {
        const receipt = JSON.parse(child.content);
        
        // Verify receipt format
        if (receipt.schema !== 'satspray.topup.v1') continue;
        if (receipt.parent !== inscriptionId) continue;
        
        // Calculate age and apply decay
        const age = currentBlock - receipt.block;
        const remainingValue = Math.max(receipt.amount - (age * 35), 0);
        
        balance += remainingValue;
      } catch (error) {
        console.error('Invalid receipt format:', child.id);
      }
    }
    
    return balance;
  }
  
  private async getCurrentBlockHeight(): Promise<number> {
    try {
      const response = await axios.get(`${this.baseURL}/blocks/tip/height`);
      return response.data;
    } catch (error) {
      console.error('Failed to get current block height:', error);
      return 0;
    }
  }
}
```

#### Conventions
- **Caching Strategy**: Cache frequently accessed data
- **Error Handling**: Gracefully handle API failures
- **Rate Limiting**: Respect API rate limits
- **Timeout Configuration**: Set reasonable timeouts

#### Common Pitfalls
1. **API Limits**: Exceeding rate limits can cause service disruption
2. **Cache Invalidation**: Stale cache data can cause incorrect calculations
3. **Network Errors**: API downtime can break functionality
4. **Data Validation**: Always validate API response data

#### Important Considerations
- **Backup APIs**: Consider multiple ordinals API providers
- **Monitoring**: Monitor API response times and error rates
- **Fallback Strategy**: Implement fallback for API failures
- **Cost Management**: Monitor API usage and costs

#### Limitations
- **Dependency**: Relies on external API availability
- **Performance**: API calls can add latency
- **Cost**: Commercial APIs may have usage costs

---

### Sats-Connect (Wallet Integration)

#### Best Practices
```typescript
// services/walletService.ts
import { getAddress, signMessage, request } from 'sats-connect';

export class WalletService {
  // Connect to wallet
  public async connectWallet(): Promise<string> {
    try {
      const response = await getAddress({
        payload: {
          purposes: ['ordinals', 'payment'],
          message: 'Connect to SatSpray Membership',
          network: {
            type: 'Testnet', // or 'Mainnet'
          },
        },
      });
      
      if (response.status === 'success') {
        return response.result.addresses[0].address;
      } else {
        throw new Error('Failed to connect wallet');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }
  
  // Sign message for authentication
  public async signMessage(message: string, address: string): Promise<string> {
    try {
      const response = await signMessage({
        payload: {
          message,
          address,
        },
      });
      
      if (response.status === 'success') {
        return response.result.signature;
      } else {
        throw new Error('Failed to sign message');
      }
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  }
  
  // Send PSBT for signing
  public async signPSBT(psbt: string): Promise<string> {
    try {
      const response = await request('signPsbt', {
        psbt,
        signInputs: {
          0: [0], // Sign first input
        },
        broadcast: true,
      });
      
      if (response.status === 'success') {
        return response.result.txid;
      } else {
        throw new Error('Failed to sign PSBT');
      }
    } catch (error) {
      console.error('PSBT signing error:', error);
      throw error;
    }
  }
}
```

#### Conventions
- **Error Handling**: Always check response status
- **User Feedback**: Provide clear feedback for wallet interactions
- **Network Configuration**: Match wallet network with application network
- **Permission Management**: Request minimal necessary permissions

#### Common Pitfalls
1. **Network Mismatch**: Wallet and application network must match
2. **User Rejection**: Handle user rejection of wallet requests
3. **Timeout Issues**: Wallet requests can timeout
4. **Extension Detection**: Not all users have wallets installed

#### Important Considerations
- **Fallback Support**: Support individual wallet APIs as fallback
- **User Experience**: Provide clear instructions for wallet setup
- **Security**: Validate all data from wallet extensions
- **Compatibility**: Test with all supported wallet types

#### Limitations
- **Browser Support**: Limited to browser environments
- **Wallet Availability**: Not all wallets support sats-connect
- **Feature Parity**: Different wallets may have different capabilities

---

## Testing Strategy

### Jest + React Testing Library

#### Best Practices
```typescript
// __tests__/components/MembershipCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MembershipCard } from '../MembershipCard';
import { useWalletStore } from '../../stores/walletStore';

// Mock the wallet store
jest.mock('../../stores/walletStore');

// Mock Bitcoin service
jest.mock('../../services/bitcoinService');

describe('MembershipCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should display card status correctly', async () => {
    const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
    mockUseWalletStore.mockReturnValue({
      address: 'tb1qtest...',
      isConnected: true,
      wallet: 'xverse',
    });
    
    render(<MembershipCard inscriptionId="test123" />);
    
    // Check if loading state is shown
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for status to load
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
  
  it('should handle top-up flow', async () => {
    render(<MembershipCard inscriptionId="test123" />);
    
    const topUpButton = screen.getByText('Top Up');
    fireEvent.click(topUpButton);
    
    // Check if top-up modal opens
    await waitFor(() => {
      expect(screen.getByText('Top Up Amount')).toBeInTheDocument();
    });
  });
  
  it('should handle wallet connection errors', async () => {
    const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
    mockUseWalletStore.mockReturnValue({
      address: null,
      isConnected: false,
      wallet: null,
    });
    
    render(<MembershipCard inscriptionId="test123" />);
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
});

// __tests__/services/bitcoinService.test.ts
import { BitcoinService } from '../bitcoinService';

describe('BitcoinService', () => {
  let bitcoinService: BitcoinService;
  
  beforeEach(() => {
    bitcoinService = new BitcoinService(false); // testnet
  });
  
  it('should create valid PSBT for top-up', () => {
    const mockUtxos = [
      {
        txid: 'abc123',
        vout: 0,
        value: 100000,
        scriptPubKey: '76a914...',
      },
    ];
    
    const psbt = bitcoinService.createTopUpPSBT(
      'inscription123',
      50000,
      'tb1qtesttreasury...',
      mockUtxos
    );
    
    expect(psbt.inputCount).toBe(1);
    expect(psbt.outputCount).toBe(2);
  });
  
  it('should verify valid signatures', () => {
    const message = 'test message';
    const signature = 'valid_signature_base64';
    const address = 'tb1qtest...';
    
    const isValid = bitcoinService.verifySignature(message, signature, address);
    expect(isValid).toBe(true);
  });
});
```

#### Conventions
- **Test Organization**: Group tests by component/service
- **Mock Strategy**: Mock external dependencies
- **Assertion Style**: Use descriptive assertions
- **Test Data**: Use realistic test data

#### Common Pitfalls
1. **Over-mocking**: Don't mock everything, test real behavior when possible
2. **Test Implementation**: Test behavior, not implementation details
3. **Async Testing**: Properly handle async operations with waitFor
4. **Cleanup**: Clean up after tests to prevent interference

#### Important Considerations
- **Bitcoin Testing**: Use testnet data for Bitcoin-related tests
- **Wallet Mocking**: Mock wallet interactions for consistent testing
- **Error Scenarios**: Test error conditions and edge cases
- **Performance**: Test performance-critical paths

#### Limitations
- **Integration Testing**: Limited integration testing capabilities
- **E2E Testing**: Requires additional tools for full end-to-end testing
- **Wallet Testing**: Cannot test real wallet interactions

---

## Development Workflow

### Code Quality Tools

#### ESLint + Prettier Configuration
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": "warn"
  }
}

// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### Git Hooks with Husky
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}

// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
npm run lint-staged
npm run test:staged
```

### Environment Configuration

#### Development Environment
```env
# .env.development
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-here
TREASURY_ADDRESS=tb1qtest...
ORDINALS_API_URL=https://api.testnet.ordinals.com
BITCOIN_NETWORK=testnet
```

#### Production Environment
```env
# .env.production
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-domain.com
JWT_SECRET=your-secure-jwt-secret
TREASURY_ADDRESS=bc1qreal...
ORDINALS_API_URL=https://api.ordinals.com
BITCOIN_NETWORK=mainnet
```

### Build and Deployment

#### Build Scripts
```json
// package.json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Security Considerations

### General Security Best Practices

1. **Input Validation**: Validate all user inputs
2. **Authentication**: Implement proper authentication
3. **Authorization**: Verify user permissions
4. **HTTPS**: Use HTTPS in production
5. **Rate Limiting**: Implement rate limiting
6. **Error Handling**: Don't expose sensitive information
7. **Logging**: Log security events
8. **Dependencies**: Keep dependencies updated

### Bitcoin-Specific Security

1. **Key Management**: Never store private keys
2. **Signature Verification**: Properly verify signatures
3. **Transaction Validation**: Validate all transactions
4. **Network Configuration**: Use correct network
5. **PSBT Handling**: Validate PSBT contents
6. **Address Validation**: Verify address formats

### Wallet Integration Security

1. **Origin Verification**: Verify wallet extension origins
2. **Permission Scope**: Request minimal permissions
3. **Data Validation**: Validate all wallet data
4. **User Consent**: Ensure user consent for actions
5. **Error Handling**: Handle wallet errors gracefully

---

## Performance Optimization

### Frontend Performance

1. **Code Splitting**: Split code by routes
2. **Lazy Loading**: Load components on demand
3. **Memoization**: Use React.memo and useMemo
4. **Bundle Analysis**: Monitor bundle size
5. **Image Optimization**: Optimize images
6. **Caching**: Implement proper caching

### Backend Performance

1. **Database Optimization**: Use indexes and prepared statements
2. **Caching**: Cache frequently accessed data
3. **Connection Pooling**: Use connection pooling
4. **Async Operations**: Use async/await properly
5. **Error Handling**: Implement proper error handling
6. **Monitoring**: Monitor performance metrics

### Bitcoin Integration Performance

1. **API Caching**: Cache API responses
2. **Batch Requests**: Batch multiple requests
3. **Timeout Configuration**: Set appropriate timeouts
4. **Retry Logic**: Implement retry logic
5. **Rate Limiting**: Respect API rate limits

---

## Monitoring and Observability

### Application Monitoring

1. **Error Tracking**: Track application errors
2. **Performance Monitoring**: Monitor response times
3. **User Analytics**: Track user behavior
4. **Health Checks**: Implement health checks
5. **Logging**: Structured logging
6. **Alerting**: Set up alerts for issues

### Bitcoin Integration Monitoring

1. **Transaction Monitoring**: Track transaction status
2. **API Monitoring**: Monitor API response times
3. **Balance Tracking**: Monitor balance calculations
4. **Error Tracking**: Track Bitcoin-related errors
5. **Performance Metrics**: Monitor Bitcoin operation performance

---

*This technology stack guide provides comprehensive coverage of all selected technologies with best practices, conventions, and common pitfalls. Use this as a reference throughout development to ensure consistent, secure, and performant implementation.* 