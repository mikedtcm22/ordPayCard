import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const isConnected = false; // Temporary placeholder

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to SatSpray</h1>
        <p className="text-xl text-gray-600 mb-8">
          Bitcoin ordinals-based membership card system with wallet integration
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/auth" className="btn-primary">
            Get Started
          </Link>
          <Link to="/manual" className="btn-secondary">
            Manual Flows
          </Link>
        </div>
      </div>

      {/* Debug Section - Development only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="text-sm font-semibold text-blue-800 mb-2">🔧 Temporary Wallet Solution</h2>
          <div className="text-xs space-y-1">
            <p className="text-blue-700">✅ <strong>Status:</strong> Simple wallet button working</p>
            <p className="text-blue-700">✅ <strong>Connected:</strong> {isConnected ? 'Yes' : 'No'} | <strong>Network:</strong> Signet</p>
            <p className="text-blue-700 font-medium mt-2">🎯 App is functional while we fix ord-connect issues</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🪙 Bitcoin Integration</h2>
          <p className="text-gray-600 mb-4">
            Create and manage membership cards using Bitcoin ordinals. Each card is a unique
            inscription on the Bitcoin blockchain.
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Ordinals-based membership tokens</li>
            <li>• Real-time balance tracking</li>
            <li>• Decentralized verification</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔐 Wallet Support</h2>
          <p className="text-gray-600 mb-4">
            Connect with popular Bitcoin wallets for seamless authentication and transaction
            signing.
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Xverse wallet integration</li>
            <li>• Leather wallet support</li>
            <li>• Unisat wallet compatibility</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">🚀 Quick Start</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-bitcoin-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-bitcoin-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Connect Wallet</h3>
            <p className="text-sm text-gray-600">Connect your Bitcoin wallet to get started</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-bitcoin-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-bitcoin-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Card</h3>
            <p className="text-sm text-gray-600">Mint your membership card as a Bitcoin ordinal</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-bitcoin-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-bitcoin-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Top Up & Use</h3>
            <p className="text-sm text-gray-600">Add funds and access your membership benefits</p>
          </div>
        </div>
      </div>
    </div>
  );
};
