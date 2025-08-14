# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SatSpray Membership Card is a Bitcoin ordinals-based membership system that uses Bitcoin inscriptions as membership tokens. The project emphasizes privacy, decentralization, and uses ordinals inscriptions as the source of truth for membership status.

## Key Commands

### Development
```bash
# Install all dependencies (run from root)
npm run install:all

# Start both frontend and backend in development mode
npm run dev

# Run all tests
npm run test

# Lint and fix code issues
npm run lint:fix

# Type check all TypeScript code
npm run type-check

# Format code with Prettier
npm run format
```

### Testing
```bash
# Run all tests
npm run test

# Run frontend tests only (from client directory)
cd client && npm run test

# Run backend tests only (from server directory)
cd server && npm run test

# Run frontend tests with UI
cd client && npm run test:ui
```

### Building and Deployment
```bash
# Build for production
npm run build

# Run with Docker (development)
npm run docker:dev

# Run with Docker (production)
npm run docker:prod
```

## Architecture Overview

### Monorepo Structure
- Uses npm workspaces with `client/` and `server/` packages
- Frontend: React + TypeScript + Vite + Tailwind CSS + Zustand
- Backend: Express + TypeScript + SQLite + JWT authentication

### Key Architectural Patterns

1. **Bitcoin Integration**
   - Client-side wallet integration via Sats-Connect (@ordzaar/ord-connect)
   - Server creates PSBTs for membership operations
   - Ordinals API integration for inscription verification

2. **State Management**
   - Client uses Zustand stores in `client/src/stores/`
   - Server maintains minimal state in SQLite database

3. **API Structure**
   - RESTful endpoints under `/api/v1/`
   - Organized by feature: auth, membership, manual flows
   - JWT authentication with httpOnly cookies

4. **Security Architecture**
   - Rate limiting on all endpoints
   - CORS protection
   - Input validation middleware
   - Bitcoin-specific signature verification

## Development Guidelines

### AI-First Development Principles
This codebase follows strict AI-readability standards:
- Maximum 500 lines per file
- Maximum 50 lines per function
- Comprehensive JSDoc documentation required
- Feature-based directory organization
- Explicit naming over clever abstractions

### File Naming Conventions
- Components: PascalCase (e.g., `MembershipCard.tsx`)
- Services/Utils: camelCase (e.g., `bitcoinService.ts`)
- Types: PascalCase with `.types.ts` extension

### Testing Approach
- Frontend: Vitest + React Testing Library for component testing
- Backend: Jest for unit and integration tests
- Focus on user interactions and API contract testing

### Commit Convention
Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for test additions/changes
- `refactor:` for code refactoring

## Important Implementation Details

### Bitcoin Network Configuration
- Development uses testnet/signet
- Network configuration in environment variables
- Ordinals API endpoints vary by network

### Manual Flow Support
Privacy-conscious users can use manual flows:
- Server provides unsigned PSBTs
- Users sign offline and submit signatures
- Located in `server/src/routes/manual/`

### Database Schema
SQLite database stores:
- Valid inscription IDs
- User sessions (optional)
- Minimal membership metadata

### Environment Variables
Key variables to configure:
- `VITE_BITCOIN_NETWORK`: Bitcoin network (testnet/mainnet)
- `JWT_SECRET`: For authentication
- `ORDINALS_API_URL`: Ordinals API endpoint
- `DATABASE_URL`: SQLite database path