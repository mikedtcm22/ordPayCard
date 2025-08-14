import React from 'react';

export const TopUpPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Top Up Membership</h1>
        <p className="text-gray-600">Add funds to your membership card to extend its validity</p>
      </div>

      <div className="card">
        <div className="text-center">
          <div className="w-16 h-16 bg-bitcoin-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-bitcoin-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top-up Functionality</h2>

          <p className="text-gray-600 mb-6">
            This feature requires wallet integration and Bitcoin transaction handling which will be
            implemented in Phase 2.
          </p>

          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">Inscription ID</label>
              <input
                type="text"
                placeholder="Enter your membership card inscription ID"
                className="input-field"
                disabled
              />
            </div>

            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top-up Amount (sats)
              </label>
              <input type="number" placeholder="1000" className="input-field" disabled />
            </div>

            <button className="btn-primary w-full" disabled>
              Create Top-up Transaction
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Top-up functionality coming in Phase 2 - MVP Phase
          </p>
        </div>
      </div>
    </div>
  );
};
