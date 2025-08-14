import React, { useState, useEffect } from 'react';

export const InscriptionPreview: React.FC = () => {
  const [templateContent, setTemplateContent] = useState<string>('');
  const [mockData, setMockData] = useState({
    currentBlock: 850000,
    receipts: [
      {
        schema: 'satspray.topup.v1',
        parent: 'test_inscription_id',
        amount: 50000,
        block: 849900,
        paid_to: 'tb1q...',
        txid: 'test_txid'
      }
    ]
  });

  useEffect(() => {
    // Load template file
    fetch('/templates/inscription/membershipCard.html')
      .then(res => res.text())
      .then(content => {
        // Inject mock data for testing
        const modifiedContent = content
          .replace('window.CURRENT_BLOCK || 0', `${mockData.currentBlock}`)
          .replace('window.RECEIPTS || []', JSON.stringify(mockData.receipts))
          .replace('window.TREASURY_ADDR = "tb1q..."', 'window.TREASURY_ADDR = "tb1q..."');
        
        setTemplateContent(modifiedContent);
      })
      .catch(error => {
        console.error('Failed to load template:', error);
      });
  }, [mockData]);

  const updateMockData = (key: string, value: any) => {
    setMockData(prev => ({ ...prev, [key]: value }));
  };

  const addReceipt = () => {
    const newReceipt = {
      schema: 'satspray.topup.v1',
      parent: 'test_inscription_id',
      amount: 10000,
      block: mockData.currentBlock - 100,
      paid_to: 'tb1q...',
      txid: `test_txid_${Date.now()}`
    };
    
    setMockData(prev => ({
      ...prev,
      receipts: [...prev.receipts, newReceipt]
    }));
  };

  const clearReceipts = () => {
    setMockData(prev => ({
      ...prev,
      receipts: []
    }));
  };

  const calculateExpectedBalance = () => {
    // Sort receipts by block height (oldest first)
    const sortedReceipts = [...mockData.receipts].sort((a, b) => a.block - b.block);
    
    let totalBalance = 0;
    let lastActivityBlock = mockData.currentBlock;
    
    // Start from current block and work backwards through receipts
    for (let j = sortedReceipts.length - 1; j >= 0; j--) {
      const receipt = sortedReceipts[j];
      
      // Calculate decay from this receipt to the last activity
      const blocksSinceReceipt = lastActivityBlock - receipt.block;
      const decayAmount = blocksSinceReceipt * 100; // 100 sats per block for Signet testing
      
      // Add the receipt amount and subtract decay
      totalBalance += receipt.amount;
      totalBalance -= decayAmount;
      
      // Update last activity block
      lastActivityBlock = receipt.block;
    }
    
    // Ensure balance doesn't go negative
    return Math.max(0, totalBalance);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Inscription Template Preview</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Mock Data Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Block Height
                </label>
                <input
                  type="number"
                  value={mockData.currentBlock}
                  onChange={(e) => updateMockData('currentBlock', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
              
              {mockData.receipts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Test Receipt Amount (sats)
                  </label>
                  <input
                    type="number"
                    value={mockData.receipts[0]?.amount || 0}
                    onChange={(e) => {
                      const receipts = [...mockData.receipts];
                      receipts[0] = { ...receipts[0], amount: parseInt(e.target.value) };
                      updateMockData('receipts', receipts);
                    }}
                    className="input-field"
                  />
                </div>
              )}
              
              {mockData.receipts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Receipt Block Height
                  </label>
                  <input
                    type="number"
                    value={mockData.receipts[0]?.block || 0}
                    onChange={(e) => {
                      const receipts = [...mockData.receipts];
                      receipts[0] = { ...receipts[0], block: parseInt(e.target.value) };
                      updateMockData('receipts', receipts);
                    }}
                    className="input-field"
                  />
                </div>
              )}
              
              <div className="flex space-x-2">
                <button 
                  onClick={addReceipt}
                  className="btn-secondary flex-1"
                >
                  Add Receipt
                </button>
                <button 
                  onClick={clearReceipts}
                  className="btn-secondary flex-1"
                >
                  Clear Receipts
                </button>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Template Info</h2>
            <div className="space-y-2 text-sm">
              <div>Size: {new Blob([templateContent]).size} bytes</div>
              <div>Estimated inscription cost: ~{Math.ceil(new Blob([templateContent]).size * 0.01)} sats</div>
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <div className="font-semibold">Expected Balance:</div>
                <div>{calculateExpectedBalance().toLocaleString()} sats</div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Current Receipts</h2>
            <div className="space-y-2 text-sm">
              {mockData.receipts.length === 0 ? (
                <p className="text-gray-500">No receipts</p>
              ) : (
                mockData.receipts.map((receipt, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <div>Amount: {receipt.amount} sats</div>
                    <div>Block: {receipt.block}</div>
                    <div>Age: {mockData.currentBlock - receipt.block} blocks</div>
                    <div>Decay: {(mockData.currentBlock - receipt.block) * 35} sats</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Preview */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={templateContent}
              style={{ width: '100%', height: '600px', border: 'none' }}
              title="Inscription Preview"
            />
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Testing Notes:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This preview simulates the inscription with mock data</li>
              <li>• In production, RECEIPTS will be child inscriptions</li>
              <li>• CURRENT_BLOCK will be the actual Bitcoin block height</li>
              <li>• The template must work without external resources</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};