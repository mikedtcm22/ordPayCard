# SatSpray Membership Card

A Bitcoin ordinals-based membership card system with wallet integration, built with React, TypeScript, and Express.

## Project Overview

SatSpray Membership Card is a decentralized membership system that uses Bitcoin ordinals as membership tokens. Users can create membership cards, top up their balance, and access services based on their card status.

### Key Features

- **Wallet Integration**: Support for Xverse, Leather, and Unisat wallets
- **Ordinals-Based**: Membership cards stored as Bitcoin ordinals
- **Privacy-Focused**: Manual flows for privacy-conscious users
- **Real-time Updates**: Live balance polling and status updates
- **Decentralized**: Minimal server-side state, ordinal inscriptions as source of truth

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- Sats-Connect for wallet integration

### Backend
- Node.js with TypeScript
- Express.js framework
- SQLite database
- JWT authentication
- Bitcoin/ordinals integration

## Project Structure

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

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd satspray-membership-card
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Run the setup script (recommended)
   ./scripts/setup-env.sh
   
   # Or manually copy environment files
   cp client/.env.example client/.env.local
   cp server/.env.example server/.env
   
   # Edit the files with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Development Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run tests for both frontend and backend
- `npm run lint` - Run linting for both frontend and backend
- `npm run type-check` - Run TypeScript type checking

## Environment Configuration

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3001
VITE_BITCOIN_NETWORK=testnet
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
BITCOIN_NETWORK=testnet
TREASURY_ADDRESS=tb1q...
ORDINALS_API_URL=https://api.testnet.ordinals.com
JWT_SECRET=your-secret-here
```

## Development Phases

1. **Phase 1: Setup** - Basic project foundation and infrastructure
2. **Phase 2: MVP** - Core functionality and wallet integration
3. **Phase 3: Enhanced** - Advanced features and polish
4. **Phase 4: Production** - Testing, optimization, and deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support, please open an issue in the GitHub repository.