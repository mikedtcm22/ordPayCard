import React, { useState, useEffect } from 'react';

export const XverseRaceConditionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const addResult = (message: string) => {
    const timestamp = new Date().toISOString().slice(11, 23);
    const result = `[${timestamp}] ${message}`;
    setTestResults(prev => [...prev, result]);
    console.log(result);
  };

  // Monitor for page reloads
  useEffect(() => {
    if (isMonitoring) {
      // Add beforeunload listener
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        addResult('WARNING: Page is about to reload/unload!');
        // For debugging, we might want to prevent reload
        e.preventDefault();
        e.returnValue = '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Monitor for navigation events
      const handlePopState = () => {
        addResult('WARNING: Navigation event detected (popstate)');
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    addResult('=== STARTED MONITORING FOR RACE CONDITIONS ===');
    
    // Check initial state
    addResult(`window.XverseProviders exists: ${!!window.XverseProviders}`);
    addResult(`window.btc_providers exists: ${!!window.btc_providers}`);
    
    // Set up interval to check for changes
    const interval = setInterval(() => {
      const xverseInBtc = window.btc_providers && Array.isArray(window.btc_providers) && 
        window.btc_providers.some(p => p.id.toLowerCase().includes('xverse'));
      addResult(`Periodic check - Xverse in btc_providers: ${xverseInBtc}`);
    }, 2000);
    
    // Clean up after 20 seconds
    setTimeout(() => {
      clearInterval(interval);
      addResult('=== STOPPED PERIODIC CHECKS ===');
    }, 20000);
  };

  const testWithDelays = async () => {
    addResult('=== TESTING CONNECTION WITH DELAYS ===');
    
    // Try connection immediately
    await tryConnection('immediate');
    
    // Try after 100ms
    setTimeout(async () => {
      await tryConnection('100ms delay');
    }, 100);
    
    // Try after 500ms
    setTimeout(async () => {
      await tryConnection('500ms delay');
    }, 500);
    
    // Try after 1000ms
    setTimeout(async () => {
      await tryConnection('1000ms delay');
    }, 1000);
  };

  const tryConnection = async (context: string) => {
    addResult(`--- Attempting connection (${context}) ---`);
    
    if (!window.btc_providers || !Array.isArray(window.btc_providers)) {
      addResult(`${context}: No btc_providers found`);
      return;
    }
    
    const xverseProvider = window.btc_providers.find(p => 
      p.id.toLowerCase().includes('xverse')
    );
    
    if (!xverseProvider) {
      addResult(`${context}: Xverse not found in btc_providers`);
      return;
    }
    
    addResult(`${context}: Found Xverse provider`);
    
    // Try the connection that causes the error
    try {
      if (typeof xverseProvider.request === 'function') {
        addResult(`${context}: Attempting request("getAccounts", { purposes: ["ordinals", "payment"] })`);
        const result = await xverseProvider.request('getAccounts', { purposes: ['ordinals', 'payment'] });
        addResult(`${context}: SUCCESS! Result: ${JSON.stringify(result)}`);
      }
    } catch (e: any) {
      addResult(`${context}: ERROR: ${e.message}`);
      
      // Check if error might cause page issues
      if (e.message.includes('purposes is not iterable')) {
        addResult(`${context}: >>> PURPOSES ERROR DETECTED`);
        // Check if page is still responsive
        setTimeout(() => {
          addResult(`${context}: Page still responsive after error`);
        }, 100);
      }
    }
  };

  const testErrorHandling = async () => {
    addResult('=== TESTING ERROR HANDLING ===');
    
    try {
      // Wrap in try-catch to see if error escapes
      await new Promise((resolve, reject) => {
        if (window.btc_providers && Array.isArray(window.btc_providers)) {
          const xverseProvider = window.btc_providers.find(p => 
            p.id.toLowerCase().includes('xverse')
          );
          
          if (xverseProvider && typeof xverseProvider.request === 'function') {
            xverseProvider.request('getAccounts', { purposes: ['ordinals', 'payment'] })
              .then((result: any) => {
                addResult(`Promise resolved: ${JSON.stringify(result)}`);
                resolve(result);
              })
              .catch((error: any) => {
                addResult(`Promise rejected: ${error.message}`);
                // Don't reject, just resolve with error info
                resolve({ error: error.message });
              });
          } else {
            resolve({ error: 'Provider not found' });
          }
        }
      });
      
      addResult('Error was properly caught and handled');
    } catch (uncaughtError: any) {
      addResult(`UNCAUGHT ERROR: ${uncaughtError.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setIsMonitoring(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Xverse Race Condition Test</h1>
      
      <div className="mb-6 space-y-4">
        <div className="space-x-4">
          <button
            onClick={startMonitoring}
            disabled={isMonitoring}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            Start Monitoring
          </button>
          
          <button
            onClick={testWithDelays}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Test with Delays
          </button>
          
          <button
            onClick={testErrorHandling}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Test Error Handling
          </button>
          
          <button
            onClick={clearResults}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>
      
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto h-96 overflow-y-auto">
        <pre>
          {testResults.length === 0 ? 'Click a button to start testing...' : testResults.join('\n')}
        </pre>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">Monitoring Test</h3>
          <p className="text-sm">Monitors for page reloads, navigation events, and periodic checks of wallet availability.</p>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold mb-2">Delay Test</h3>
          <p className="text-sm">Tests connection at different time intervals to check if timing affects the error.</p>
        </div>
        
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold mb-2">Error Handling Test</h3>
          <p className="text-sm">Tests if errors are properly caught or if they escape and cause page issues.</p>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold mb-2">What to Look For</h3>
          <p className="text-sm">Check if console logs disappear when errors occur, indicating possible page reload or JS execution stop.</p>
        </div>
      </div>
    </div>
  );
};