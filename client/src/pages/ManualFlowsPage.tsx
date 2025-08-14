import React from 'react';

export const ManualFlowsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Manual Privacy Flows</h1>
        <p className="text-gray-600">
          Privacy-conscious flows that don't require wallet connection
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Inscription Entry</h2>

            <p className="text-gray-600 mb-6">
              Enter your inscription ID manually to check membership status without connecting a
              wallet.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter inscription ID"
                className="input-field"
                disabled
              />
              <button className="btn-primary w-full" disabled>
                Check Status
              </button>
            </div>
          </div>
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Top-up Instructions</h2>

            <p className="text-gray-600 mb-6">
              Generate instructions for manual top-up transactions without wallet integration.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter inscription ID"
                className="input-field"
                disabled
              />
              <input
                type="number"
                placeholder="Top-up amount (sats)"
                className="input-field"
                disabled
              />
              <button className="btn-secondary w-full" disabled>
                Generate Instructions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Features Coming Soon</h2>
        <p className="text-gray-600 mb-4">
          Manual flows will be implemented in Phase 3 to provide privacy-conscious alternatives to
          wallet integration.
        </p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Manual inscription ID entry and validation</li>
          <li>• Offline transaction instruction generation</li>
          <li>• Privacy-focused authentication flows</li>
          <li>• Manual balance checking without wallet connection</li>
        </ul>
      </div>
    </div>
  );
};
