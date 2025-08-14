import React from 'react';

export const AuthPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Authentication</h1>
        <p className="text-gray-600">
          Connect your Bitcoin wallet to authenticate and access your membership card
        </p>
      </div>

      <div className="card">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Connection Required</h2>

          <p className="text-gray-600 mb-6">
            This feature requires wallet integration which will be implemented in Phase 2.
          </p>

          <div className="space-y-3">
            <button className="btn-primary w-full" disabled>
              Connect Xverse Wallet
            </button>
            <button className="btn-secondary w-full" disabled>
              Connect Leather Wallet
            </button>
            <button className="btn-secondary w-full" disabled>
              Connect Unisat Wallet
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Wallet integration coming in Phase 2 - MVP Phase
          </p>
        </div>
      </div>
    </div>
  );
};
