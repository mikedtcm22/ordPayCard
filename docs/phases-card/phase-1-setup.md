# Phase 1: Setup Phase - Basic Project Foundation

**Project Name:** SatSpray Membership Card  
**Phase:** 1 - Setup Phase  
**Duration:** 1-2 weeks  
**Document Type:** Development Plan  
**Date:** 11 July 2025  

---

## Phase Overview

### Goal
Create a barebones but functional project structure that can be built upon. This phase establishes the foundation for all subsequent development while ensuring the basic architecture is sound and ready for feature implementation.

### Success Criteria
- ✅ Complete monorepo structure with client/ and server/ directories
- ✅ Both frontend and backend servers running locally
- ✅ Basic API endpoints responding correctly
- ✅ Database connected and basic models created
- ✅ Bitcoin integration foundation working on testnet/signet
- ✅ Development environment configured with linting and testing
- ✅ Basic CI/CD pipeline operational

### Phase Dependencies
- **Prerequisites**: Project requirements and technology stack finalized
- **Inputs**: Project documentation, technology stack guide, design system specifications
- **Outputs**: Functional development environment, basic project structure, foundation services

---

## Feature Breakdown

### Feature 1.1: Project Infrastructure Setup
**Goal**: Establish the basic project structure and dependency management

#### Step 1.1.1: Initialize Monorepo Structure
- Create root directory structure with client/ and server/ folders
- Initialize git repository with proper .gitignore for Node.js and React
- Set up root package.json with workspace configuration
- Create basic README.md with project overview and setup instructions
- Set up .env.example files for both client and server

**Success Criteria:**
- Directory structure matches project rules specifications
- Git repository initialized with clean history
- Workspace configuration allows running commands from root

#### Step 1.1.2: Frontend Package Configuration
- Initialize React application in client/ directory using Vite
- Install core dependencies: React 18+, TypeScript, Tailwind CSS
- Configure package.json with proper scripts for development and build
- Set up basic tsconfig.json for React TypeScript configuration
- Create basic index.html template with proper meta tags

**Success Criteria:**
- `npm run dev` starts development server on localhost:3000
- TypeScript compilation works without errors
- Basic React app renders successfully

#### Step 1.1.3: Backend Package Configuration
- Initialize Node.js server in server/ directory
- Install core dependencies: Express, TypeScript, cors, helmet
- Configure package.json with scripts for development and build
- Set up tsconfig.json for Node.js TypeScript configuration
- Create basic Express server with health check endpoint

**Success Criteria:**
- `npm run dev` starts server on localhost:3001
- Health check endpoint responds with 200 status
- TypeScript compilation works without errors

#### Step 1.1.4: Root Development Scripts
- Create npm scripts in root package.json for running both servers
- Set up concurrently for parallel development server execution
- Configure build scripts for both client and server
- Add scripts for testing and linting across both packages
- Create development startup script with proper environment setup

**Success Criteria:**
- `npm run dev` starts both client and server simultaneously
- `npm run build` builds both packages successfully
- All scripts execute without errors

#### Step 1.1.5: Environment Configuration
- Create .env.example files with all required environment variables
- Set up environment variable validation for both client and server
- Configure different environments (development, staging, production)
- Document environment setup process in README
- Set up environment-specific configuration files

**Success Criteria:**
- Environment variables load correctly in both applications
- Missing environment variables are caught and reported
- Documentation is clear and complete

### Feature 1.2: Basic Frontend Shell
**Goal**: Create a minimal but functional React application structure

#### Step 1.2.1: React Application Structure
- Set up React Router for client-side navigation
- Create basic component directory structure following project rules
- Implement App.tsx with router configuration
- Create basic 404 Not Found page
- Set up proper TypeScript types for routing

**Success Criteria:**
- Navigation between routes works correctly
- 404 page displays for invalid routes
- TypeScript types are properly configured

#### Step 1.2.2: Layout Components
- Create Header component with navigation links
- Build Footer component with basic information
- Implement MainLayout component for consistent page structure
- Add responsive design considerations for mobile devices
- Create basic loading and error boundary components

**Success Criteria:**
- Header and footer display correctly on all pages
- Layout is responsive and works on mobile devices
- Error boundaries catch and display errors gracefully

#### Step 1.2.3: Tailwind CSS Configuration
- Install and configure Tailwind CSS with Vite
- Set up custom color palette from theme rules
- Configure responsive breakpoints and spacing scale
- Create basic utility classes for common patterns
- Add CSS reset and base styles

**Success Criteria:**
- Tailwind classes work correctly in components
- Custom colors and spacing are available
- Responsive design utilities function properly

#### Step 1.2.4: Placeholder Pages
- Create Home page with basic project information
- Build Authentication page placeholder
- Create Top-up page placeholder
- Implement Manual flows page placeholder
- Add basic navigation between all pages

**Success Criteria:**
- All placeholder pages render without errors
- Navigation works correctly between all pages
- Pages follow consistent layout and styling

#### Step 1.2.5: Basic State Management
- Install and configure Zustand for state management
- Create basic wallet store with connection state
- Implement UI store for global UI state
- Set up store persistence for wallet connection
- Create proper TypeScript types for all stores

**Success Criteria:**
- State management works correctly across components
- Store persistence maintains state across page refreshes
- TypeScript types are properly configured

### Feature 1.3: Basic Backend API
**Goal**: Establish a functional Express.js API with proper middleware and routing

#### Step 1.3.1: Express Server Setup
- Create Express application with TypeScript configuration
- Configure middleware for CORS, JSON parsing, and security
- Set up request logging with structured format
- Implement basic error handling middleware
- Configure server to start on specified port

**Success Criteria:**
- Server starts successfully and listens on configured port
- CORS headers are properly configured
- Request logging works correctly

#### Step 1.3.2: Middleware Configuration
- Install and configure helmet for security headers
- Set up rate limiting for API endpoints
- Configure request body parsing with size limits
- Implement request ID generation for tracing
- Add compression middleware for response optimization

**Success Criteria:**
- Security headers are properly set
- Rate limiting prevents abuse
- Request parsing works correctly

#### Step 1.3.3: Route Structure
- Create routes directory with modular route files
- Implement auth routes with placeholder endpoints
- Create membership routes for card-related operations
- Set up manual routes for privacy-conscious flows
- Configure route middleware for validation

**Success Criteria:**
- All route modules load and respond correctly
- Route structure follows project conventions
- Middleware applies correctly to routes

#### Step 1.3.4: Error Handling and Logging
- Implement centralized error handling middleware
- Set up structured logging with appropriate log levels
- Create error response formatting for consistent API responses
- Configure error logging with context information
- Set up development vs production error handling

**Success Criteria:**
- Errors are caught and handled gracefully
- Log output is structured and informative
- Error responses follow consistent format

#### Step 1.3.5: Health Check Endpoint
- Create /health endpoint for monitoring
- Implement system health checks (database, external APIs)
- Add version information to health response
- Configure health check to verify all dependencies
- Set up proper HTTP status codes for different health states

**Success Criteria:**
- Health endpoint returns 200 when all systems are healthy
- Health checks verify all critical dependencies
- Response includes useful system information

### Feature 1.4: Bitcoin Integration Foundation
**Goal**: Set up basic Bitcoin and ordinals integration for testnet/signet

#### Step 1.4.1: Bitcoin Library Setup
- Install bitcoinjs-lib and configure for testnet/signet
- Set up Bitcoin network configuration with environment variables
- Create basic Bitcoin service class with network detection
- Configure proper error handling for Bitcoin operations
- Set up Bitcoin RPC connection for block height queries

**Success Criteria:**
- Bitcoin library loads and initializes correctly
- Network configuration switches properly between testnet/signet
- Basic Bitcoin operations work without errors

#### Step 1.4.2: Address Validation
- Implement Bitcoin address validation functions
- Create address format verification for different address types
- Set up network-specific address validation
- Add proper error handling for invalid addresses
- Create utility functions for address manipulation

**Success Criteria:**
- Address validation correctly identifies valid/invalid addresses
- Network-specific validation works properly
- Error messages are clear and helpful

#### Step 1.4.3: PSBT Creation Utilities
- Create basic PSBT creation functionality
- Implement UTXO management and selection
- Set up fee calculation utilities
- Create transaction signing preparation
- Add PSBT validation and verification

**Success Criteria:**
- PSBT creation works without errors
- Fee calculation produces reasonable estimates
- PSBT validation catches common errors

#### Step 1.4.4: Ordinals API Client
- Set up HTTP client for ordinals API integration
- Create basic inscription fetching functionality
- Implement error handling for API failures
- Set up caching for frequently accessed data
- Configure API timeouts and retry logic

**Success Criteria:**
- API client successfully fetches inscription data
- Error handling works for various failure scenarios
- Caching improves performance for repeated requests

#### Step 1.4.5: Environment Configuration
- Configure Bitcoin network settings for different environments
- Set up treasury address configuration
- Create ordinals API URL configuration
- Configure API keys and authentication if required
- Set up proper environment variable validation

**Success Criteria:**
- Environment switching works correctly
- Configuration is properly validated
- All required settings are documented

### Feature 1.5: Development Environment
**Goal**: Configure development tools and quality assurance systems

#### Step 1.5.1: Code Quality Configuration
- Install and configure ESLint for both client and server
- Set up Prettier for consistent code formatting
- Configure TypeScript strict mode for better type safety
- Create pre-commit hooks with lint-staged
- Set up editor configuration files

**Success Criteria:**
- ESLint catches common code quality issues
- Prettier formats code consistently
- Pre-commit hooks prevent bad code from being committed

#### Step 1.5.2: Testing Framework Setup
- Install Jest for both client and server testing
- Configure React Testing Library for component testing
- Set up Supertest for API endpoint testing
- Create basic test utilities and helpers
- Configure test coverage reporting

**Success Criteria:**
- Test framework runs successfully
- Basic tests can be written and executed
- Coverage reporting works correctly

#### Step 1.5.3: Development Documentation
- Create comprehensive README with setup instructions
- Document API endpoints and their usage
- Create development workflow documentation
- Set up code contribution guidelines
- Document troubleshooting common issues

**Success Criteria:**
- Documentation is clear and complete
- Setup instructions work for new developers
- API documentation is accurate and helpful

#### Step 1.5.4: Environment Variable Management
- Set up dotenv for environment variable loading
- Create validation for required environment variables
- Configure different environments (dev, staging, prod)
- Document all environment variables and their purposes
- Set up secure handling of sensitive variables

**Success Criteria:**
- Environment variables load correctly
- Missing variables are caught and reported
- Documentation is complete and accurate

#### Step 1.5.5: Docker Configuration
- Create Dockerfile for both client and server
- Set up docker-compose for local development
- Configure proper environment variable passing
- Set up volume mounts for development workflow
- Create production-ready Docker configuration

**Success Criteria:**
- Docker containers build successfully
- Development workflow works with Docker
- Production configuration is secure and optimized

---

## Technical Specifications

### Directory Structure
```
satspray-membership-card/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── stores/            # State management
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   └── styles/            # CSS and styling
│   ├── public/                # Static assets
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── models/            # Database models
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript types
│   └── package.json
├── docs/                      # Documentation
├── .github/                   # GitHub workflows
└── package.json              # Root package.json
```

### Technology Stack
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript, SQLite
- **Bitcoin**: bitcoinjs-lib, ordinals API integration
- **Development**: ESLint, Prettier, Jest, Docker

### API Endpoints (Basic)
- `GET /health` - Health check endpoint
- `GET /api/auth/challenge` - Authentication challenge
- `POST /api/auth/verify` - Signature verification
- `GET /api/inscriptions/:id` - Inscription data
- `POST /api/inscriptions/validate` - Inscription validation

### Environment Variables
```bash
# Client
VITE_API_URL=http://localhost:3001
VITE_BITCOIN_NETWORK=testnet

# Server
PORT=3001
NODE_ENV=development
BITCOIN_NETWORK=testnet
TREASURY_ADDRESS=tb1q...
ORDINALS_API_URL=https://api.testnet.ordinals.com
JWT_SECRET=your-secret-here
```

---

## Testing Requirements

### Unit Tests
- [ ] Component rendering tests
- [ ] Service function tests
- [ ] Utility function tests
- [ ] Store/state management tests

### Integration Tests
- [ ] API endpoint tests
- [ ] Database integration tests
- [ ] Bitcoin service integration tests
- [ ] External API integration tests

### End-to-End Tests
- [ ] Basic navigation flow
- [ ] Error handling scenarios
- [ ] Environment configuration tests

---

## Deployment Requirements

### Development
- Local development servers running on ports 3000 (client) and 3001 (server)
- Docker containers for consistent development environment
- Environment variable configuration for local development

### CI/CD Pipeline
- GitHub Actions workflow for automated testing
- Automated linting and type checking
- Build verification for both client and server
- Basic deployment to staging environment

---

## Success Metrics

### Performance Targets
- Client development server start time: < 10 seconds
- Server startup time: < 5 seconds
- API response time: < 200ms for basic endpoints
- Build time: < 2 minutes for both client and server

### Quality Metrics
- ESLint errors: 0
- TypeScript errors: 0
- Test coverage: > 80% for utility functions
- Documentation coverage: 100% of public APIs

---

## Risk Assessment

### Technical Risks
- **Bitcoin library compatibility**: Mitigation through thorough testing
- **Environment configuration**: Mitigation through comprehensive documentation
- **Development setup complexity**: Mitigation through Docker containerization

### Timeline Risks
- **Learning curve for new technologies**: Mitigation through focused documentation
- **Configuration complexity**: Mitigation through step-by-step setup guide

---

## Phase 1 Implementation Progress

As of this checkpoint, the following features and infrastructure have been fully implemented and tested:

### Feature 1.1: Project Infrastructure Setup
- Monorepo structure with `client/` (frontend) and `server/` (backend) directories
- Root package.json with workspace configuration and scripts
- Comprehensive README and .gitignore
- Environment variable management and validation utilities
- Setup scripts for easy onboarding

### Feature 1.2: Basic Frontend Shell
- React app with Vite, TypeScript, Tailwind CSS, Zustand
- Responsive layout with Header, Footer, and MainLayout
- React Router navigation and 404 page
- Placeholder pages for Home, Auth, Top-up, Manual Flows
- State management for wallet and UI, notification system
- Error boundaries and loading states

### Feature 1.3: Basic Backend API
- Express server with modular route structure (`/api/auth`, `/api/membership`, `/api/manual`)
- Controllers and placeholder endpoints for all routes
- Centralized error handling and request logging
- Request ID middleware for traceability
- Compression and security middleware (helmet, CORS, rate limiting)
- Structured logging with pino
- **Request timeout middleware**: Any request exceeding 10 seconds is logged and returns a 503 error, improving monitoring and debugging of long-running or stuck requests

**All success criteria for these features have been met, and the codebase is ready for Feature 1.4: Bitcoin Integration Foundation.**

## Next Steps

Upon completion of Phase 1, the following should be ready:
1. **Development Environment**: Fully functional local development setup
2. **Basic Architecture**: Solid foundation for feature development
3. **Testing Framework**: Ready for test-driven development
4. **Documentation**: Complete setup and development guides
5. **CI/CD Pipeline**: Automated quality checks and deployment

**Transition to Phase 2**: Core functionality development can begin with wallet integration, authentication, and membership card features.

---

*This document serves as the complete specification for Phase 1 development. All features must be completed and tested before proceeding to Phase 2.* 