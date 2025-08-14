import React from 'react';
import { SimpleWalletButton } from '@/components/wallet/SimpleWalletButton';
import { RealWalletButton } from '@/components/wallet/RealWalletButton';

export const WalletTestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Wallet Connection Test Page</h1>
      
      <div className="space-y-8">
        {/* Simple Wallet Button Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Simple Wallet Button (Mock)</h2>
          <p className="text-gray-600 mb-4">
            This is the temporary solution that simulates wallet connections without requiring actual wallet extensions.
          </p>
          <SimpleWalletButton />
        </div>

        {/* Real Wallet Button Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Real Wallet Button (Actual Wallets)</h2>
          <p className="text-gray-600 mb-4">
            This connects to real Bitcoin wallet extensions if they are installed in your browser.
          </p>
          <RealWalletButton />
        </div>

        {/* Wallet Detection Info */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Wallet Detection Information</h3>
          <p className="text-gray-700 mb-4">
            The Real Wallet Button automatically detects installed Bitcoin wallet extensions and only shows available options.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="font-medium mr-2">Unisat:</span>
              <span>Checks for <code className="bg-gray-100 px-1">window.unisat</code></span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">Xverse:</span>
              <span>Checks for <code className="bg-gray-100 px-1">window.XverseProviders</code></span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">Leather:</span>
              <span>Checks for <code className="bg-gray-100 px-1">window.LeatherProvider</code></span>
            </div>
          </div>
        </div>

        {/* Network Support */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Network Support</h3>
          <p className="text-gray-700 mb-4">
            For testing recursive ordinals inscriptions, we need Signet network support:
          </p>
          <ul className="space-y-1 text-sm">
            <li>✅ <strong>Unisat:</strong> Supports testnet/signet switching</li>
            <li>✅ <strong>Xverse:</strong> Has testnet/signet support</li>
            <li>⚠️ <strong>Leather:</strong> Primarily testnet focused</li>
          </ul>
        </div>

        {/* Testing Instructions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Install one of the supported Bitcoin wallet extensions</li>
            <li>Switch the wallet to Signet network (if supported)</li>
            <li>Click "Connect Wallet" on the Real Wallet Button</li>
            <li>The button should detect your installed wallet and show it as an option</li>
            <li>Select your wallet to initiate the connection</li>
            <li>Approve the connection request in your wallet extension</li>
          </ol>
        </div>
      </div>
    </div>
  );
};