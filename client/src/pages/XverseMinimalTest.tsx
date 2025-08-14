import React, { useState } from 'react';

export const XverseMinimalTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testMinimalConnection = async () => {
    addLog('=== STARTING MINIMAL XVERSE TEST ===');
    
    // Check if btc_providers exists
    if (!window.btc_providers || !Array.isArray(window.btc_providers)) {
      addLog('ERROR: window.btc_providers not found or not an array');
      return;
    }
    
    addLog(`Found ${window.btc_providers.length} providers in btc_providers`);
    
    // Find Xverse provider
    const xverseProvider = window.btc_providers.find(p => 
      p.id.toLowerCase().includes('xverse') || 
      p.name.toLowerCase().includes('xverse')
    );
    
    if (!xverseProvider) {
      addLog('ERROR: Xverse not found in btc_providers');
      return;
    }
    
    addLog(`Found Xverse provider: ${xverseProvider.id}`);
    addLog(`Available methods: ${Object.keys(xverseProvider).filter(k => typeof xverseProvider[k] === 'function').join(', ')}`);
    
    // Test 1: Try wallet_connect
    if (typeof xverseProvider.request === 'function') {
      try {
        addLog('TEST 1: Calling request("wallet_connect", null)...');
        const result = await xverseProvider.request('wallet_connect', null);
        addLog(`SUCCESS: wallet_connect returned: ${JSON.stringify(result)}`);
      } catch (e: any) {
        addLog(`FAILED: wallet_connect error: ${e.message}`);
      }
    }
    
    // Test 2: Try getAccounts with null
    if (typeof xverseProvider.request === 'function') {
      try {
        addLog('TEST 2: Calling request("getAccounts", null)...');
        const result = await xverseProvider.request('getAccounts', null);
        addLog(`SUCCESS: getAccounts(null) returned: ${JSON.stringify(result)}`);
      } catch (e: any) {
        addLog(`FAILED: getAccounts(null) error: ${e.message}`);
      }
    }
    
    // Test 3: Try getAccounts with empty object
    if (typeof xverseProvider.request === 'function') {
      try {
        addLog('TEST 3: Calling request("getAccounts", {})...');
        const result = await xverseProvider.request('getAccounts', {});
        addLog(`SUCCESS: getAccounts({}) returned: ${JSON.stringify(result)}`);
      } catch (e: any) {
        addLog(`FAILED: getAccounts({}) error: ${e.message}`);
      }
    }
    
    // Test 4: Try getAccounts with purposes array
    if (typeof xverseProvider.request === 'function') {
      try {
        addLog('TEST 4: Calling request("getAccounts", { purposes: ["ordinals", "payment"] })...');
        const result = await xverseProvider.request('getAccounts', { purposes: ['ordinals', 'payment'] });
        addLog(`SUCCESS: getAccounts with purposes returned: ${JSON.stringify(result)}`);
      } catch (e: any) {
        addLog(`FAILED: getAccounts with purposes error: ${e.message}`);
        if (e.message.includes('purposes is not iterable')) {
          addLog('>>> This is the "purposes is not iterable" error!');
        }
      }
    }
    
    addLog('=== TEST COMPLETE ===');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Xverse Minimal Connection Test</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={testMinimalConnection}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Run Minimal Test
        </button>
        
        <button
          onClick={clearLogs}
          className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Clear Logs
        </button>
      </div>
      
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <pre>
          {logs.length === 0 ? 'Click "Run Minimal Test" to start...' : logs.join('\n')}
        </pre>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">What this test does:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Checks if btc_providers exists</li>
          <li>Finds the Xverse provider</li>
          <li>Tries wallet_connect first</li>
          <li>Tests getAccounts with different parameter formats</li>
          <li>Captures exactly which format causes the "purposes is not iterable" error</li>
        </ol>
      </div>
    </div>
  );
};