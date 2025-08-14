# Contributing to SatSpray Membership Card

Thank you for your interest in contributing to the SatSpray Membership Card project! This guide will help you get started with development.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Git

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ordPayCard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   
   # Edit the files with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start both the client (port 3000) and server (port 3001) in development mode.

## Project Structure

```
ordPayCard/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand state management
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS and styling
│   └── package.json
├── server/                # Node.js backend (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## Development Scripts

### Root Level Commands
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run test` - Run tests for both client and server
- `npm run lint` - Run linting for both packages
- `npm run format` - Format code with Prettier

### Client-Specific Commands
```bash
cd client
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run test         # Run Vitest tests
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Server-Specific Commands
```bash
cd server
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
npm run start        # Start production server
npm run test         # Run Jest tests
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

## Code Quality Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper types for all functions and variables
- Avoid `any` type unless absolutely necessary

### Code Style
- Use Prettier for consistent formatting
- Follow ESLint rules (see `.eslintrc.js` files)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Git Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting: `npm run test && npm run lint`
4. Format code: `npm run format`
5. Commit with descriptive messages
6. Push and create a pull request

### Commit Messages
Follow conventional commit format:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code restructuring`
- `test: add or update tests`

## Testing

### Client Testing (Vitest + Testing Library)
- Write tests for all components
- Use Testing Library best practices
- Test user interactions, not implementation details
- Place tests in `__tests__` directories

### Server Testing (Jest)
- Write unit tests for all services and utilities
- Write integration tests for API endpoints
- Mock external dependencies
- Aim for high test coverage

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Environment Configuration

### Client Environment Variables
```bash
VITE_API_URL=http://localhost:3001
VITE_BITCOIN_NETWORK=testnet
```

### Server Environment Variables
```bash
NODE_ENV=development
PORT=3001
BITCOIN_NETWORK=testnet
TREASURY_ADDRESS=tb1q...
ORDINALS_API_URL=https://api.hiro.so
JWT_SECRET=your-secret-here
```

## Bitcoin Integration

### Networks
- **Development**: testnet or signet
- **Production**: mainnet

### Key Libraries
- `bitcoinjs-lib` - Bitcoin operations
- Custom address validation utilities
- PSBT creation and validation
- Ordinals API integration

## API Development

### REST API Structure
- `/api/auth` - Authentication endpoints
- `/api/membership` - Membership card operations
- `/api/manual` - Manual/privacy flows

### Response Format
```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "uuid"
}
```

## Debugging

### Development Tools
- React DevTools for frontend debugging
- VS Code debugger configuration available
- Structured logging with request IDs
- Error boundaries for React error handling

### Common Issues
1. **CORS errors**: Check server CORS configuration
2. **Build failures**: Ensure all dependencies are installed
3. **Test failures**: Check environment variables and mocks

## Performance Guidelines

- Use React.memo for expensive components
- Implement proper loading states
- Optimize API calls with caching
- Use code splitting for large bundles

## Security Considerations

- Never commit sensitive data (private keys, secrets)
- Use environment variables for configuration
- Validate all inputs on both client and server
- Follow OWASP security guidelines

## Getting Help

- Check existing issues before creating new ones
- Provide clear reproduction steps for bugs
- Include environment details in issue reports
- Use discussion threads for questions

## License

This project is licensed under the MIT License. See the LICENSE file for details. 