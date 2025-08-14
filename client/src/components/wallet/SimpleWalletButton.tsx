import React, { useState } from 'react';

interface WalletState {
  isConnected: boolean;
  walletType: string | null;
  address: string | null;
  network: string;
}

export const SimpleWalletButton: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    walletType: null,
    address: null,
    network: 'signet'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = async (walletType: string) => {
    try {
      // Simulate wallet connection
      setWalletState({
        isConnected: true,
        walletType,
        address: `tb1${walletType}${Math.random().toString(36).substring(2, 15)}`,
        network: 'signet'
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    setWalletState({
      isConnected: false,
      walletType: null,
      address: null,
      network: 'signet'
    });
  };

  if (walletState.isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {walletState.walletType} ({walletState.address?.slice(0, 10)}...)
        </span>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Connect Wallet
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Connect Wallet</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleConnect('Xverse')}
                className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">Xverse</div>
                <div className="text-sm text-gray-600">Bitcoin wallet with ordinals support</div>
              </button>
              <button
                onClick={() => handleConnect('Unisat')}
                className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">Unisat</div>
                <div className="text-sm text-gray-600">Bitcoin wallet for Web3</div>
              </button>
              <button
                onClick={() => handleConnect('Leather')}
                className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">Leather</div>
                <div className="text-sm text-gray-600">Bitcoin wallet for everyone</div>
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full p-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}; 