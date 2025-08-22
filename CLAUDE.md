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

my strict TDD pair programmer. We're following red/green/refactor at every step. Here's the workflow I want you to follow for every task provided to you by the Planner or Human User:

🟥 RED:

Write a failing test for the next smallest unit of behavior.

Do not write any implementation code yet.

Explain what the test is verifying and why.
In particular, make sure to explain (as to a partner who is non-technical but has deep conceptual understanding of the project) how a successful test = completion of the current task. 

Label this step: # RED

🟩 GREEN:

Implement the simplest code to make the test pass.

Avoid overengineering or anticipating future needs.

Confirm that all tests pass (existing + new).

Label this step: # GREEN

✅ Commit message (only after test passes):
"feat: implement [feature/behavior] to pass test"

🛠 REFACTOR:

During REFACTOR, do NOT change anything besides any necessary updates to the README. Instead, help me plan to refactor my existing code to improve readability, structure, or performance.

When I am ready, proceed again to RED.

IMPORTANT:

No skipping steps.

No test-first = no code.

Only commit on clean GREEN.

Each loop should be tight and focused, no solving 3 things at once.

If I give you a feature idea, you figure out the next RED test to write.

Update a README with all environment setup and TDD usage steps.


## Code Style and Structure:

We are building an AI-first codebase, which means it needs to be modular, scalable, and easy to understand. The file structure should be highly navigable, and the code should be well-organized and easy to read.

All files should have descriptive names, an explanation of their contents at the top, and all functions should have proper commentation of their purpose and parameters (JSDoc, TSDoc, etc, whatever is appropriate).
To maximize compatibility with modern AI tools, files should not exceed 500 lines.

- Write concise, technical code.
- Use functional and declarative programming patterns; avoid classes.
- Decorate all functions with descriptive block comments.
- Prefer iteration and modularization over code duplication.
- Throw errors instead of adding fallback values.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Avoid enums; use maps instead.
- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.


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

## Custom Commands

### TDD Phase Execution Command

**Usage**: `/tdd-phase <phase-doc-filename>`

When this command is invoked with a phase planning document:

1. **Read Phase Document**: Load the specified phase planning document to
   understand the tasks
2. **Initialize Todo List**: Create a todo list from all TDD tasks in the
   document
3. **Execute TDD Cycle**: For each task:
   - Mark task as `in_progress`
   - **RED Phase**: Write failing test(s) for the current feature
   - **GREEN Phase**: Implement minimal code to pass the test(s)
   - **REFACTOR Phase**: Clean up code without changing functionality
   - Mark task as `completed` when all tests pass
4. **Document Refactoring**: After completing each task:
   - Add refactoring notes to `.cursor/scratchpad.md`
   - Commit changes with descriptive message
5. **Continue Until Done**: Repeat cycle for all tasks in the phase document
6. **Final Summary**: Report completion status and any blockers

**Example**:

```
User: /tdd-phase phase-1-foundation-setup.md
Claude: I'll begin executing the TDD tasks from phase-1-foundation-setup.md. Let me start by reading the document and creating a todo list...
```

**Automatic Actions**:

- Runs tests after each implementation
- Commits working code after each GREEN phase
- Documents refactoring decisions in scratchpad
- Reports progress throughout execution
- Handles test failures by staying in current phase until resolved