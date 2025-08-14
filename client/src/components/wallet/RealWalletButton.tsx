import React, { useState, useEffect } from 'react';

interface WalletInfo {
  name: string;
  address: string;
  publicKey?: string;
  network: string;
}

interface BitcoinProvider {
  id: string;
  name: string;
  icon?: string;
  methods: string[];
  request?: (method: string, params?: any) => Promise<any>;
  connect?: () => Promise<any>;
  getAccounts?: () => Promise<any>;
  getAddress?: () => Promise<any>;
}

interface WalletAPI {
  unisat?: any;
  XverseProviders?: any;
  LeatherProvider?: any;
  btc?: any;
  btc_providers?: BitcoinProvider[];
  BitcoinProvider?: any;
}

declare global {
  interface Window extends WalletAPI {}
}

export const RealWalletButton: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for available wallets on mount
  useEffect(() => {
    const checkWallets = () => {
      const wallets: string[] = [];
      
      if (window.unisat) {
        wallets.push('unisat');
      }
      
      // Check for Xverse in multiple ways
      if (window.XverseProviders || window.BitcoinProvider) {
        wallets.push('xverse');
      } else if (window.btc_providers && Array.isArray(window.btc_providers)) {
        // Check if Xverse is in the btc_providers array
        const hasXverse = window.btc_providers.some(provider => 
          provider.id.toLowerCase().includes('xverse') || 
          provider.name.toLowerCase().includes('xverse')
        );
        if (hasXverse) {
          wallets.push('xverse');
        }
      }
      
      if (window.LeatherProvider) {
        wallets.push('leather');
      }
      
      setAvailableWallets(wallets);
    };

    checkWallets();
    // Check again after a delay in case wallets load asynchronously
    setTimeout(checkWallets, 1000);
    setTimeout(checkWallets, 2000);
  }, []);

  const connectUnisat = async () => {
    try {
      if (!window.unisat) {
        throw new Error('Unisat wallet not installed');
      }

      const accounts = await window.unisat.requestAccounts();
      if (accounts.length > 0) {
        const network = await window.unisat.getNetwork();
        
        setWalletInfo({
          name: 'Unisat',
          address: accounts[0],
          network: network === 'testnet' ? 'testnet' : network === 'signet' ? 'signet' : 'mainnet'
        });
        setIsConnected(true);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Unisat');
      console.error('Unisat connection error:', err);
    }
  };

  const connectXverse = async () => {
    console.log('=== XVERSE CONNECTION START ===');
    console.log('window.XverseProviders exists:', !!window.XverseProviders);
    console.log('window.btc_providers exists:', !!window.btc_providers);
    console.log('btc_providers is array:', Array.isArray(window.btc_providers));
    
    try {
      let connected = false;

      // Method 1: Check btc_providers first (since debug showed it works)
      if (window.btc_providers && Array.isArray(window.btc_providers)) {
        console.log('Checking btc_providers array...');
        const xverseProvider = window.btc_providers.find(provider => {
          const isXverse = provider.id.toLowerCase().includes('xverse') || 
                          provider.name.toLowerCase().includes('xverse');
          console.log(`Provider ${provider.id}: isXverse = ${isXverse}`);
          return isXverse;
        });

        if (xverseProvider) {
          console.log('Found Xverse in btc_providers:', {
            id: xverseProvider.id,
            name: xverseProvider.name,
            methods: xverseProvider.methods,
            hasRequest: typeof xverseProvider.request === 'function',
            hasConnect: typeof xverseProvider.connect === 'function',
            hasGetAccounts: typeof xverseProvider.getAccounts === 'function'
          });

          // Try to use the btc_providers version
          connected = await connectViaProvider(xverseProvider, 'btc_providers');
          if (connected) return;
        }
      }

      // Method 2: Try window.XverseProviders
      if (window.XverseProviders && !connected) {
        console.log('Trying window.XverseProviders...');
        connected = await connectViaXverseProviders();
        if (connected) return;
      }

      if (!connected) {
        throw new Error('Unable to connect to Xverse wallet. Please make sure Xverse is installed and try refreshing the page.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to Xverse';
      setError(errorMessage);
      console.error('=== XVERSE CONNECTION ERROR ===');
      console.error('Error message:', errorMessage);
      console.error('Error type:', err.constructor.name);
      console.error('Full error:', err);
      
      // If it's the purposes error, provide specific guidance
      if (errorMessage.includes('purposes is not iterable')) {
        setError('Xverse wallet connection error. This may be a compatibility issue. Please check the browser console for details.');
        console.error('Xverse purposes parameter error detected. The wallet may need a different parameter format.');
      }
    }
  };

  // Helper function to connect via a provider object from btc_providers
  const connectViaProvider = async (provider: any, source: string): Promise<boolean> => {
    console.log(`Attempting connection via ${source} provider...`);
    
    try {
      // First, check what methods are available
      console.log('Provider methods:', Object.keys(provider).filter(k => typeof provider[k] === 'function'));
      
      // Try request method with wallet_connect first
      if (typeof provider.request === 'function') {
        try {
          console.log('Trying wallet_connect...');
          const connectResponse = await provider.request('wallet_connect', null);
          if (connectResponse && connectResponse.result) {
            console.log('wallet_connect response:', connectResponse);
            if (connectResponse.result.addresses) {
              handleXverseAccounts(connectResponse.result.addresses);
              return true;
            }
          }
        } catch (e: any) {
          console.log('wallet_connect failed:', e.message);
        }

        // Try different parameter formats for getAccounts
        const parameterFormats = [
          { purposes: ['ordinals', 'payment'] },
          { addresses: ['ordinals', 'payment'] },
          {},
          null
        ];

        for (const params of parameterFormats) {
          try {
            console.log('Trying request("getAccounts") with params:', params);
            const response = await provider.request('getAccounts', params);
            if (response && response.result) {
              console.log('request("getAccounts") succeeded with params:', params);
              handleXverseAccounts(response.result);
              return true;
            }
          } catch (e: any) {
            console.log('request("getAccounts") failed with params:', params, 'Error:', e.message);
            if (e.message && e.message.includes('purposes is not iterable')) {
              console.error('>>> PURPOSES ERROR DETECTED with params:', params);
            }
          }
        }

        // Try wallet_getAccount
        try {
          console.log('Trying wallet_getAccount...');
          const response = await provider.request('wallet_getAccount', null);
          if (response && response.result) {
            console.log('wallet_getAccount succeeded');
            if (response.result.addresses) {
              handleXverseAccounts(response.result.addresses);
              return true;
            }
          }
        } catch (e: any) {
          console.log('wallet_getAccount failed:', e.message);
        }
      }

      // Try direct methods
      if (typeof provider.connect === 'function') {
        try {
          console.log('Trying direct connect...');
          const result = await provider.connect();
          if (result) {
            handleXverseResult(result);
            return true;
          }
        } catch (e: any) {
          console.log('Direct connect failed:', e.message);
        }
      }

      if (typeof provider.getAccounts === 'function') {
        try {
          console.log('Trying direct getAccounts...');
          const accounts = await provider.getAccounts();
          if (accounts) {
            handleXverseAccounts(Array.isArray(accounts) ? accounts : [accounts]);
            return true;
          }
        } catch (e: any) {
          console.log('Direct getAccounts failed:', e.message);
        }
      }

      return false;
    } catch (err: any) {
      console.error('Provider connection error:', err);
      return false;
    }
  };

  // Helper function to connect via window.XverseProviders
  const connectViaXverseProviders = async (): Promise<boolean> => {
    try {
      // Try different methods on XverseProviders
      if (typeof window.XverseProviders.connect === 'function') {
        try {
          const result = await window.XverseProviders.connect();
          if (result) {
            handleXverseResult(result);
            return true;
          }
        } catch (e: any) {
          console.log('XverseProviders.connect failed:', e);
        }
      }

      if (typeof window.XverseProviders.getAccounts === 'function') {
        const paramFormats = [
          { purposes: ['ordinals', 'payment'] },
          ['ordinals', 'payment'],
          undefined
        ];
        
        for (const params of paramFormats) {
          try {
            console.log('Trying XverseProviders.getAccounts with params:', params);
            const accounts = params === undefined 
              ? await window.XverseProviders.getAccounts()
              : await window.XverseProviders.getAccounts(params);
            if (accounts) {
              console.log('XverseProviders.getAccounts succeeded with params:', params);
              handleXverseAccounts(Array.isArray(accounts) ? accounts : accounts.result || [accounts]);
              return true;
            }
          } catch (e: any) {
            console.log('XverseProviders.getAccounts failed with params:', params, 'Error:', e.message);
          }
        }
      }

      return false;
    } catch (err: any) {
      console.error('XverseProviders connection error:', err);
      return false;
    }
  };

  // Helper function to handle Xverse accounts array
  const handleXverseAccounts = (accounts: any[]) => {
    if (accounts && accounts.length > 0) {
      const account = accounts.find((acc: any) => 
        acc.purpose === 'ordinals' || 
        acc.addressType === 'p2tr'
      ) || accounts[0];
      
      setWalletInfo({
        name: 'Xverse',
        address: account.address,
        publicKey: account.publicKey,
        network: 'signet'
      });
      setIsConnected(true);
      setIsModalOpen(false);
    }
  };

  // Helper function to handle various Xverse result formats
  const handleXverseResult = (result: any) => {
    if (result.addresses && Array.isArray(result.addresses)) {
      handleXverseAccounts(result.addresses);
    } else if (result.address) {
      setWalletInfo({
        name: 'Xverse',
        address: result.address,
        publicKey: result.publicKey,
        network: 'signet'
      });
      setIsConnected(true);
      setIsModalOpen(false);
    } else if (Array.isArray(result)) {
      handleXverseAccounts(result);
    }
  };

  const connectLeather = async () => {
    try {
      if (!window.LeatherProvider) {
        throw new Error('Leather wallet not installed');
      }

      const response = await window.LeatherProvider.request('getAddresses');
      
      if (response.result && response.result.addresses && response.result.addresses.length > 0) {
        const btcAddress = response.result.addresses.find((addr: any) => addr.type === 'p2wpkh') || response.result.addresses[0];
        
        setWalletInfo({
          name: 'Leather',
          address: btcAddress.address,
          network: 'testnet' // Leather supports testnet
        });
        setIsConnected(true);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Leather');
      console.error('Leather connection error:', err);
    }
  };

  const handleConnect = async (walletType: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      switch (walletType) {
        case 'unisat':
          await connectUnisat();
          break;
        case 'xverse':
          await connectXverse();
          break;
        case 'leather':
          await connectLeather();
          break;
        default:
          throw new Error('Unknown wallet type');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletInfo(null);
    setError(null);
  };

  const getWalletDisplayName = (walletType: string) => {
    switch (walletType) {
      case 'unisat':
        return 'Unisat';
      case 'xverse':
        return 'Xverse';
      case 'leather':
        return 'Leather';
      default:
        return walletType;
    }
  };

  const getWalletDescription = (walletType: string) => {
    switch (walletType) {
      case 'unisat':
        return 'Bitcoin wallet for Web3';
      case 'xverse':
        return 'Bitcoin wallet with ordinals support';
      case 'leather':
        return 'Bitcoin wallet for everyone';
      default:
        return 'Bitcoin wallet';
    }
  };

  if (isConnected && walletInfo) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          {walletInfo.name} ({walletInfo.address.slice(0, 10)}...) - {walletInfo.network}
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
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {availableWallets.length === 0 ? (
              <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                <p className="font-semibold mb-2">No Bitcoin wallets detected</p>
                <p className="text-sm">Please install one of the following wallets:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <a href="https://unisat.io" target="_blank" rel="noopener noreferrer" className="underline">Unisat Wallet</a></li>
                  <li>• <a href="https://www.xverse.app" target="_blank" rel="noopener noreferrer" className="underline">Xverse Wallet</a></li>
                  <li>• <a href="https://leather.io" target="_blank" rel="noopener noreferrer" className="underline">Leather Wallet</a></li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                {availableWallets.map(wallet => (
                  <button
                    key={wallet}
                    onClick={() => handleConnect(wallet)}
                    disabled={isConnecting}
                    className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium">{getWalletDisplayName(wallet)}</div>
                    <div className="text-sm text-gray-600">{getWalletDescription(wallet)}</div>
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => {
                setIsModalOpen(false);
                setError(null);
              }}
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