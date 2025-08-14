import React, { useEffect, useState } from 'react';

export const XverseDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkXverseAPIs = () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        windowObjects: {},
        btcProviders: null,
        xverseAPIs: {}
      };

      // Check window objects
      info.windowObjects = {
        'window.XverseProviders': !!window.XverseProviders,
        'window.BitcoinProvider': !!window.BitcoinProvider,
        'window.btc_providers': !!window.btc_providers,
        'window.btc': !!window.btc,
      };

      // Check XverseProviders methods if it exists
      if (window.XverseProviders) {
        info.xverseAPIs.XverseProviders = {
          type: typeof window.XverseProviders,
          isObject: typeof window.XverseProviders === 'object',
          methods: Object.keys(window.XverseProviders || {}).filter(key => 
            typeof (window.XverseProviders as any)[key] === 'function'
          ),
          properties: Object.keys(window.XverseProviders || {}).filter(key => 
            typeof (window.XverseProviders as any)[key] !== 'function'
          )
        };
      }

      // Check BitcoinProvider if it exists
      if (window.BitcoinProvider) {
        info.xverseAPIs.BitcoinProvider = {
          type: typeof window.BitcoinProvider,
          isObject: typeof window.BitcoinProvider === 'object',
          methods: Object.keys(window.BitcoinProvider || {}).filter(key => 
            typeof (window.BitcoinProvider as any)[key] === 'function'
          ),
          properties: Object.keys(window.BitcoinProvider || {}).filter(key => 
            typeof (window.BitcoinProvider as any)[key] !== 'function'
          )
        };
      }

      // Check btc_providers array
      if (window.btc_providers && Array.isArray(window.btc_providers)) {
        info.btcProviders = window.btc_providers.map((provider: any) => ({
          id: provider.id,
          name: provider.name,
          methods: provider.methods || [],
          hasRequest: typeof provider.request === 'function',
          hasConnect: typeof provider.connect === 'function',
          hasGetAccounts: typeof provider.getAccounts === 'function',
          hasGetAddress: typeof provider.getAddress === 'function',
          allFunctions: Object.keys(provider).filter(key => 
            typeof provider[key] === 'function'
          )
        }));
      }

      setDebugInfo(info);
    };

    // Check immediately
    checkXverseAPIs();

    // Check again after delays
    const timeouts = [500, 1000, 2000, 3000].map(delay => 
      setTimeout(checkXverseAPIs, delay)
    );

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const testXverseConnection = async () => {
    const results: any[] = [];

    // Test 1: XverseProviders methods
    if (window.XverseProviders) {
      results.push({ test: 'XverseProviders exists', success: true });

      // Test getAccounts with different parameter formats
      if (typeof (window.XverseProviders as any).getAccounts === 'function') {
        const parameterFormats = [
          { name: 'purposes array', params: { purposes: ['ordinals', 'payment'] } },
          { name: 'addresses array', params: { addresses: ['ordinals', 'payment'] } },
          { name: 'single purpose', params: { purposes: ['ordinals'] } },
          { name: 'purposes string', params: { purposes: 'ordinals,payment' } },
          { name: 'empty object', params: {} },
          { name: 'null', params: null },
          { name: 'undefined', params: undefined },
          { name: 'no params', params: 'NONE' } // Special marker for no params
        ];

        for (const format of parameterFormats) {
          try {
            const result = format.params === 'NONE' 
              ? await (window.XverseProviders as any).getAccounts()
              : await (window.XverseProviders as any).getAccounts(format.params);
            results.push({ 
              test: `XverseProviders.getAccounts(${format.name})`, 
              success: true, 
              params: format.params,
              result: result 
            });
            break; // Stop on first success
          } catch (err: any) {
            results.push({ 
              test: `XverseProviders.getAccounts(${format.name})`, 
              success: false, 
              params: format.params,
              error: err.message,
              errorType: err.constructor.name,
              fullError: err.toString()
            });
          }
        }
      }

      // Try other methods
      const otherMethods = ['connect', 'getAddress', 'request', 'enable'];
      
      for (const method of otherMethods) {
        if (typeof (window.XverseProviders as any)[method] === 'function') {
          try {
            const result = await (window.XverseProviders as any)[method]();
            results.push({ 
              test: `XverseProviders.${method}()`, 
              success: true, 
              result: result 
            });
          } catch (err: any) {
            results.push({ 
              test: `XverseProviders.${method}()`, 
              success: false, 
              error: err.message 
            });
          }
        }
      }
    }

    // Test 2: btc_providers array
    if (window.btc_providers && Array.isArray(window.btc_providers)) {
      const xverseProvider = window.btc_providers.find((p: any) => 
        p.id.toLowerCase().includes('xverse') || 
        p.name.toLowerCase().includes('xverse')
      );

      if (xverseProvider) {
        results.push({ 
          test: 'Found Xverse in btc_providers', 
          success: true,
          provider: {
            id: xverseProvider.id,
            name: xverseProvider.name,
            methods: xverseProvider.methods
          }
        });

        // Try request method
        if (typeof xverseProvider.request === 'function') {
          try {
            const result = await xverseProvider.request('getAccounts', null);
            results.push({ 
              test: 'btc_providers.request("getAccounts")', 
              success: true, 
              result 
            });
          } catch (err: any) {
            results.push({ 
              test: 'btc_providers.request("getAccounts")', 
              success: false, 
              error: err.message 
            });
          }
        }
      }
    }

    console.log('Connection test results:', results);
    alert('Test complete! Check console for results.');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Xverse Wallet Debug Page</h1>

      <div className="space-y-6">
        {/* Window Objects Check */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Window Objects</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(debugInfo.windowObjects, null, 2)}
          </pre>
        </div>

        {/* XverseProviders API Details */}
        {debugInfo.xverseAPIs?.XverseProviders && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">XverseProviders API</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(debugInfo.xverseAPIs.XverseProviders, null, 2)}
            </pre>
          </div>
        )}

        {/* BitcoinProvider API Details */}
        {debugInfo.xverseAPIs?.BitcoinProvider && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">BitcoinProvider API</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(debugInfo.xverseAPIs.BitcoinProvider, null, 2)}
            </pre>
          </div>
        )}

        {/* btc_providers Details */}
        {debugInfo.btcProviders && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">btc_providers Array</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(debugInfo.btcProviders, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Connection Button */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Test Xverse Connection</h3>
          <p className="text-gray-700 mb-4">
            Click the button below to test various connection methods with Xverse wallet.
            Results will be logged to the console.
          </p>
          <button
            onClick={testXverseConnection}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Test Connection Methods
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Debug Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Install Xverse wallet extension if not already installed</li>
            <li>Refresh this page after installation</li>
            <li>Check the displayed information to see what APIs are available</li>
            <li>Click "Test Connection Methods" to try various connection approaches</li>
            <li>Open browser console (F12) to see detailed test results</li>
          </ol>
        </div>
      </div>
    </div>
  );
};