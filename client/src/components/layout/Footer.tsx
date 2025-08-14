import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SatSpray</h3>
            <p className="text-gray-600 text-sm">
              Bitcoin ordinals-based membership card system with wallet integration.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Wallet Integration</li>
              <li>Ordinals-Based Cards</li>
              <li>Privacy-Focused Flows</li>
              <li>Real-time Updates</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Development</h4>
            <p className="text-gray-600 text-sm">
              Built with React, TypeScript, and Bitcoin technologies.
            </p>
            <p className="text-gray-500 text-xs mt-2">Version 0.1.0 - Development Phase</p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 SatSpray Team. Built for the Bitcoin ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
};
