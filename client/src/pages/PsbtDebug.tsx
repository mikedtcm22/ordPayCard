import React, { useState } from 'react';
import * as bitcoin from 'bitcoinjs-lib';
import { useAuthStore } from '../stores/authStore';

interface DecodedPsbt {
  inputs: any[];
  outputs: any[];
  fee?: number;
  valid: boolean;
  error?: string;
  network?: string;
}

interface PsbtGenerationParams {
  utxos: any[];
  recipientAddress: string;
  changeAddress: string;
  initialTopUp: number;
  feeRate: number;
}

export const PsbtDebug: React.FC = () => {
  const { token } = useAuthStore();
  const [psbtInput, setPsbtInput] = useState('');
  const [decodedPsbt, setDecodedPsbt] = useState<DecodedPsbt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPsbts, setGeneratedPsbts] = useState<{
    commit?: string;
    reveal?: string;
  }>({});
  
  // Test parameters for PSBT generation
  const [testParams, setTestParams] = useState<PsbtGenerationParams>({
    utxos: [{
      txid: '0'.repeat(64),
      vout: 0,
      value: 100000,
      scriptPubKey: '0014' + '0'.repeat(40), // P2WPKH
    }],
    recipientAddress: 'tb1qtest' + '0'.repeat(34),
    changeAddress: 'tb1qchange' + '0'.repeat(32),
    initialTopUp: 50000,
    feeRate: 10
  });

  // Fee estimation
  const [feeEstimate, setFeeEstimate] = useState<any>(null);

  const getNetwork = () => {
    // Use testnet for Signet
    return bitcoin.networks.testnet;
  };

  const decodePsbt = () => {
    try {
      setError(null);
      const network = getNetwork();
      const psbt = bitcoin.Psbt.fromBase64(psbtInput, { network });
      
      const decoded: DecodedPsbt = {
        inputs: [],
        outputs: [],
        valid: true,
        network: 'testnet/signet'
      };
      
      // Decode inputs
      for (let i = 0; i < psbt.inputCount; i++) {
        const input = psbt.data.inputs[i];
        decoded.inputs.push({
          index: i,
          hash: input.hash?.toString('hex') || 'Unknown',
          witnessUtxo: input.witnessUtxo ? {
            value: input.witnessUtxo.value,
            script: input.witnessUtxo.script.toString('hex')
          } : undefined,
          tapInternalKey: input.tapInternalKey?.toString('hex'),
          tapLeafScript: input.tapLeafScript
        });
      }
      
      // Decode outputs
      psbt.txOutputs.forEach((output, i) => {
        decoded.outputs.push({
          index: i,
          value: output.value,
          address: output.address || 'Script output',
          script: output.script.toString('hex')
        });
      });
      
      // Calculate fee if possible
      const totalIn = decoded.inputs.reduce((sum, inp) => 
        sum + (inp.witnessUtxo?.value || 0), 0
      );
      const totalOut = decoded.outputs.reduce((sum, out) => sum + out.value, 0);
      if (totalIn > 0) {
        decoded.fee = totalIn - totalOut;
      }
      
      setDecodedPsbt(decoded);
    } catch (error: any) {
      setDecodedPsbt({
        inputs: [],
        outputs: [],
        valid: false,
        error: error.message
      });
    }
  };

  const fetchFeeEstimate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/inscriptions/estimate?feeRate=${testParams.feeRate}&initialTopUp=${testParams.initialTopUp}`
      );
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch estimate');
      }
      
      setFeeEstimate(data.estimate);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestPsbt = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/inscriptions/create-psbt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testParams)
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.errors?.[0]?.msg || 'Failed to create PSBT');
      }
      
      setGeneratedPsbts({
        commit: result.commitPsbt,
        reveal: result.revealPsbt
      });
      
      // Auto-decode the commit PSBT
      setPsbtInput(result.commitPsbt);
      decodePsbt();
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUtxo = (index: number, field: string, value: any) => {
    const newUtxos = [...testParams.utxos];
    newUtxos[index] = { ...newUtxos[index], [field]: value };
    setTestParams({ ...testParams, utxos: newUtxos });
  };

  const addUtxo = () => {
    setTestParams({
      ...testParams,
      utxos: [...testParams.utxos, {
        txid: '0'.repeat(64),
        vout: 0,
        value: 50000,
        scriptPubKey: '0014' + '0'.repeat(40)
      }]
    });
  };

  const removeUtxo = (index: number) => {
    const newUtxos = testParams.utxos.filter((_, i) => i !== index);
    setTestParams({ ...testParams, utxos: newUtxos });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">PSBT Debug Tool</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Parameters */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Fee Estimation</h2>
            
            <button
              onClick={fetchFeeEstimate}
              disabled={loading}
              className="btn-secondary w-full mb-4"
            >
              {loading ? 'Fetching...' : 'Get Fee Estimate'}
            </button>
            
            {feeEstimate && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg text-sm">
                <div><strong>Template Size:</strong> {feeEstimate.templateSize} bytes</div>
                <div><strong>Inscription Size:</strong> {feeEstimate.inscriptionSize} vbytes</div>
                <div><strong>Commit Fee:</strong> {feeEstimate.commitFee} sats</div>
                <div><strong>Reveal Fee:</strong> {feeEstimate.revealFee} sats</div>
                <div><strong>Total Cost:</strong> {feeEstimate.totalCost} sats</div>
                <div className="mt-3 pt-3 border-t">
                  <strong>Breakdown:</strong>
                  {feeEstimate.breakdown.map((item: string, i: number) => (
                    <div key={i} className="text-xs mt-1">• {item}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  UTXOs
                </label>
                {testParams.utxos.map((utxo, index) => (
                  <div key={index} className="mb-4 p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">UTXO {index + 1}</span>
                      <button
                        onClick={() => removeUtxo(index)}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="number"
                      value={utxo.value}
                      onChange={(e) => updateUtxo(index, 'value', parseInt(e.target.value))}
                      className="input-field mb-2"
                      placeholder="Value (sats)"
                    />
                    <input
                      type="text"
                      value={utxo.txid}
                      onChange={(e) => updateUtxo(index, 'txid', e.target.value)}
                      className="input-field text-xs font-mono"
                      placeholder="Transaction ID"
                    />
                  </div>
                ))}
                <button
                  onClick={addUtxo}
                  className="btn-secondary text-sm"
                >
                  Add UTXO
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={testParams.recipientAddress}
                  onChange={(e) => setTestParams({
                    ...testParams,
                    recipientAddress: e.target.value
                  })}
                  className="input-field font-mono text-xs"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Change Address
                </label>
                <input
                  type="text"
                  value={testParams.changeAddress}
                  onChange={(e) => setTestParams({
                    ...testParams,
                    changeAddress: e.target.value
                  })}
                  className="input-field font-mono text-xs"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Initial Top-up (sats)
                </label>
                <input
                  type="number"
                  value={testParams.initialTopUp}
                  onChange={(e) => setTestParams({
                    ...testParams,
                    initialTopUp: parseInt(e.target.value)
                  })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fee Rate (sats/vByte)
                </label>
                <input
                  type="number"
                  value={testParams.feeRate}
                  onChange={(e) => setTestParams({
                    ...testParams,
                    feeRate: parseInt(e.target.value)
                  })}
                  className="input-field"
                />
              </div>
              
              <button
                onClick={createTestPsbt}
                disabled={loading || !token}
                className="btn-primary w-full"
              >
                {loading ? 'Creating...' : 'Create Test PSBT'}
              </button>
              
              {!token && (
                <div className="text-sm text-amber-600">
                  Please log in to create PSBTs
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* PSBT Decoder */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">PSBT Decoder</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  PSBT (Base64)
                </label>
                <textarea
                  value={psbtInput}
                  onChange={(e) => setPsbtInput(e.target.value)}
                  className="input-field font-mono text-xs"
                  rows={6}
                  placeholder="Paste PSBT here..."
                />
              </div>
              
              <button
                onClick={decodePsbt}
                className="btn-secondary w-full"
                disabled={!psbtInput}
              >
                Decode PSBT
              </button>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-sm">
                  {error}
                </div>
              )}
              
              {decodedPsbt && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Decoded Result</h3>
                  
                  {decodedPsbt.valid ? (
                    <div className="space-y-2 text-sm">
                      <div><strong>Network:</strong> {decodedPsbt.network}</div>
                      <div><strong>Inputs:</strong> {decodedPsbt.inputs.length}</div>
                      <div><strong>Outputs:</strong> {decodedPsbt.outputs.length}</div>
                      {decodedPsbt.fee !== undefined && (
                        <div><strong>Fee:</strong> {decodedPsbt.fee} sats</div>
                      )}
                      
                      <details className="mt-4">
                        <summary className="cursor-pointer font-semibold">
                          Full Details
                        </summary>
                        <pre className="mt-2 text-xs overflow-x-auto">
                          {JSON.stringify(decodedPsbt, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Error: {decodedPsbt.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Generated PSBTs */}
          {(generatedPsbts.commit || generatedPsbts.reveal) && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Generated PSBTs</h2>
              
              <div className="space-y-4">
                {generatedPsbts.commit && (
                  <div>
                    <h3 className="font-medium mb-2">Commit PSBT</h3>
                    <textarea
                      value={generatedPsbts.commit}
                      readOnly
                      className="input-field font-mono text-xs"
                      rows={4}
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                      onClick={() => {
                        setPsbtInput(generatedPsbts.commit!);
                        decodePsbt();
                      }}
                      className="btn-secondary text-sm mt-2"
                    >
                      Decode Commit
                    </button>
                  </div>
                )}
                
                {generatedPsbts.reveal && (
                  <div>
                    <h3 className="font-medium mb-2">Reveal PSBT (Placeholder)</h3>
                    <textarea
                      value={generatedPsbts.reveal}
                      readOnly
                      className="input-field font-mono text-xs"
                      rows={4}
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <div className="text-xs text-amber-600 mt-2">
                      Note: Reveal PSBT contains placeholder commit txid.
                      Use /api/inscriptions/update-reveal after broadcasting commit.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};