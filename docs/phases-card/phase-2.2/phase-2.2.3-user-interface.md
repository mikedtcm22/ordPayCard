# Phase 2.2.3: User Interface for Card Creation

**Feature:** Membership Card Creation  
**Sub-Phase:** 2.2.3 - User Interface  
**Duration:** 2-3 days  
**Document Type:** Implementation Plan  
**Date:** August 1, 2025  

---

## Overview

### Goal
Build a comprehensive user interface for membership card creation that guides users through the inscription process, calculates costs transparently, provides card previews, and handles transaction signing with the connected wallet.

### User Experience Focus
The card creation process involves complex Bitcoin transactions and costs. The UI must make this process intuitive, provide clear feedback at each step, and handle errors gracefully to prevent user frustration and potential fund loss.

### Success Criteria
- Clear step-by-step card creation flow
- Accurate real-time cost calculations
- Visual card preview showing both states
- Seamless wallet integration for signing
- Comprehensive error handling with recovery options
- Mobile-responsive design
- Loading states for all async operations

---

## Prerequisites

### Dependencies
- Completed wallet connection (RealWalletButton component)
- Working PSBT generation endpoints
- Inscription template completed and tested
- Zustand store setup for state management

### Required Knowledge
- React hooks and state management
- Tailwind CSS for styling
- Bitcoin transaction concepts
- PSBT signing flow
- Error boundary implementation

---

## Implementation Steps

### Step 1: Create Wallet Store

**File:** `client/src/stores/walletStore.ts`

```typescript
/**
 * @fileoverview Wallet state management store
 * @module stores/walletStore
 * 
 * Manages wallet connection state, transaction signing,
 * and wallet-related operations across the application.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

interface WalletState {
  // Connection state
  isConnected: boolean;
  walletType: 'unisat' | 'xverse' | 'leather' | null;
  address: string | null;
  publicKey: string | null;
  network: 'testnet' | 'signet' | 'mainnet';
  
  // Balance state
  balance: number;
  utxos: UtxoInput[];
  isLoadingBalance: boolean;
  
  // Transaction state
  isSigningTransaction: boolean;
  lastTransactionId: string | null;
  
  // Actions
  connect: (walletType: string) => Promise<void>;
  disconnect: () => void;
  updateBalance: () => Promise<void>;
  signPsbt: (psbtBase64: string) => Promise<string>;
  signAndBroadcastPsbt: (psbtBase64: string) => Promise<string>;
}

export const useWalletStore = create<WalletState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        isConnected: false,
        walletType: null,
        address: null,
        publicKey: null,
        network: 'testnet',
        balance: 0,
        utxos: [],
        isLoadingBalance: false,
        isSigningTransaction: false,
        lastTransactionId: null,
        
        // Connect wallet
        connect: async (walletType: string) => {
          try {
            // Implementation depends on wallet type
            let address: string;
            let publicKey: string | undefined;
            
            switch (walletType) {
              case 'unisat':
                const accounts = await window.unisat.requestAccounts();
                address = accounts[0];
                publicKey = await window.unisat.getPublicKey();
                break;
              default:
                throw new Error(`Unsupported wallet: ${walletType}`);
            }
            
            set({
              isConnected: true,
              walletType: walletType as any,
              address,
              publicKey: publicKey || null
            });
            
            // Update balance after connection
            await get().updateBalance();
            
          } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
          }
        },
        
        // Disconnect wallet
        disconnect: () => {
          set({
            isConnected: false,
            walletType: null,
            address: null,
            publicKey: null,
            balance: 0,
            utxos: []
          });
        },
        
        // Update balance and UTXOs
        updateBalance: async () => {
          const { address, walletType } = get();
          if (!address || !walletType) return;
          
          set({ isLoadingBalance: true });
          
          try {
            // For Unisat, use their API
            if (walletType === 'unisat' && window.unisat) {
              const balance = await window.unisat.getBalance();
              const utxos = await window.unisat.getInscriptions();
              
              set({
                balance: balance.confirmed,
                utxos: utxos.list || [],
                isLoadingBalance: false
              });
            }
          } catch (error) {
            console.error('Balance update error:', error);
            set({ isLoadingBalance: false });
          }
        },
        
        // Sign PSBT
        signPsbt: async (psbtBase64: string) => {
          const { walletType } = get();
          if (!walletType) throw new Error('No wallet connected');
          
          set({ isSigningTransaction: true });
          
          try {
            let signedPsbt: string;
            
            switch (walletType) {
              case 'unisat':
                signedPsbt = await window.unisat.signPsbt(psbtBase64);
                break;
              default:
                throw new Error(`Signing not implemented for ${walletType}`);
            }
            
            set({ isSigningTransaction: false });
            return signedPsbt;
            
          } catch (error) {
            set({ isSigningTransaction: false });
            throw error;
          }
        },
        
        // Sign and broadcast PSBT
        signAndBroadcastPsbt: async (psbtBase64: string) => {
          const { walletType } = get();
          if (!walletType) throw new Error('No wallet connected');
          
          set({ isSigningTransaction: true });
          
          try {
            let txid: string;
            
            switch (walletType) {
              case 'unisat':
                txid = await window.unisat.pushPsbt(psbtBase64);
                break;
              default:
                throw new Error(`Broadcasting not implemented for ${walletType}`);
            }
            
            set({ 
              isSigningTransaction: false,
              lastTransactionId: txid
            });
            
            // Update balance after transaction
            setTimeout(() => get().updateBalance(), 2000);
            
            return txid;
            
          } catch (error) {
            set({ isSigningTransaction: false });
            throw error;
          }
        }
      }),
      {
        name: 'wallet-storage',
        partialize: (state) => ({
          walletType: state.walletType,
          network: state.network
        })
      }
    )
  )
);

// Selectors
export const selectWalletConnection = (state: WalletState) => ({
  isConnected: state.isConnected,
  address: state.address,
  walletType: state.walletType
});

export const selectWalletBalance = (state: WalletState) => ({
  balance: state.balance,
  utxos: state.utxos,
  isLoadingBalance: state.isLoadingBalance
});
```

### Step 2: Create Card Creation Page

**File:** `client/src/pages/CardCreation.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@/stores/walletStore';
import { PricingCalculator } from '@/components/membership/PricingCalculator';
import { CardPreview } from '@/components/membership/CardPreview';
import { TransactionReview } from '@/components/membership/TransactionReview';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface CreationStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

const CREATION_STEPS: CreationStep[] = [
  {
    id: 'pricing',
    title: 'Configure Your Card',
    description: 'Choose your initial balance and review costs',
    component: PricingCalculator
  },
  {
    id: 'preview',
    title: 'Preview Your Card',
    description: 'See how your membership card will look',
    component: CardPreview
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review transaction details before signing',
    component: TransactionReview
  }
];

export const CardCreation: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useWalletStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [creationData, setCreationData] = useState({
    initialTopUp: 0,
    feeRate: 10,
    recipientAddress: '',
    estimatedCost: 0,
    commitPsbt: '',
    revealPsbt: '',
    estimatedInscriptionId: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  // Set recipient address to connected wallet
  useEffect(() => {
    if (address && !creationData.recipientAddress) {
      setCreationData(prev => ({ ...prev, recipientAddress: address }));
    }
  }, [address]);

  const handleStepComplete = (stepData: any) => {
    setCreationData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < CREATION_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCard = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      // This will be handled by TransactionReview component
      // which will call the wallet store to sign and broadcast
      console.log('Creating card with data:', creationData);
    } catch (err: any) {
      setError(err.message || 'Failed to create card');
    } finally {
      setIsCreating(false);
    }
  };

  const CurrentStepComponent = CREATION_STEPS[currentStep].component;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Create Membership Card
            </h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {CREATION_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex-1 ${index < CREATION_STEPS.length - 1 ? 'pr-8' : ''}`}
                  >
                    <div className="relative">
                      {/* Step indicator */}
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${index <= currentStep 
                            ? 'bg-bitcoin-600 text-white' 
                            : 'bg-gray-200 text-gray-600'}
                        `}
                      >
                        {index < currentStep ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      
                      {/* Progress line */}
                      {index < CREATION_STEPS.length - 1 && (
                        <div
                          className={`
                            absolute top-5 left-10 w-full h-0.5
                            ${index < currentStep ? 'bg-bitcoin-600' : 'bg-gray-200'}
                          `}
                        />
                      )}
                    </div>
                    
                    {/* Step info */}
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-md p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <CurrentStepComponent
                data={creationData}
                onComplete={handleStepComplete}
                onBack={handleBack}
                isCreating={isCreating}
              />
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Cancel
              </button>
              
              <div className="space-x-4">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    disabled={isCreating}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                )}
                
                {currentStep === CREATION_STEPS.length - 1 ? (
                  <button
                    onClick={handleCreateCard}
                    disabled={isCreating}
                    className="btn-primary"
                  >
                    {isCreating ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Create Card'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStepComplete({})}
                    className="btn-primary"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
```

### Step 3: Create Pricing Calculator Component

**File:** `client/src/components/membership/PricingCalculator.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/stores/walletStore';

interface PricingCalculatorProps {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  isCreating: boolean;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  data,
  onComplete,
  onBack,
  isCreating
}) => {
  const { balance } = useWalletStore();
  const [initialTopUp, setInitialTopUp] = useState(data.initialTopUp || 0);
  const [feeRate, setFeeRate] = useState(data.feeRate || 10);
  const [costs, setCosts] = useState({
    inscriptionCost: 0,
    networkFee: 0,
    totalCost: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate costs whenever inputs change
  useEffect(() => {
    calculateCosts();
  }, [initialTopUp, feeRate]);

  const calculateCosts = async () => {
    try {
      // Mock calculation - replace with actual API call
      const inscriptionSize = 5000; // bytes
      const baseFee = Math.ceil((inscriptionSize / 4) * feeRate);
      const networkFee = Math.ceil(baseFee * 1.5); // Commit + reveal
      
      setCosts({
        inscriptionCost: 546, // Dust limit for inscription
        networkFee: networkFee,
        totalCost: 546 + networkFee + initialTopUp
      });
    } catch (error) {
      console.error('Cost calculation error:', error);
    }
  };

  const calculateDays = (sats: number): number => {
    const DECAY_RATE = 35; // sats per block
    const BLOCKS_PER_DAY = 144;
    return Math.floor(sats / (DECAY_RATE * BLOCKS_PER_DAY));
  };

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (initialTopUp < 0) {
      newErrors.initialTopUp = 'Initial top-up cannot be negative';
    }
    
    if (initialTopUp > balance) {
      newErrors.initialTopUp = 'Insufficient balance';
    }
    
    if (feeRate < 1 || feeRate > 1000) {
      newErrors.feeRate = 'Fee rate must be between 1 and 1000 sats/vByte';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateInputs()) {
      onComplete({
        initialTopUp,
        feeRate,
        estimatedCost: costs.totalCost
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Configure Your Card</h2>
        <p className="text-gray-600">
          Set your initial balance and review the costs for creating your membership card.
        </p>
      </div>

      {/* Initial Top-up */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Initial Top-up Amount (Optional)
        </label>
        <div className="space-y-2">
          <input
            type="number"
            value={initialTopUp}
            onChange={(e) => setInitialTopUp(parseInt(e.target.value) || 0)}
            className={`input-field ${errors.initialTopUp ? 'border-red-500' : ''}`}
            placeholder="0"
            min="0"
          />
          {errors.initialTopUp && (
            <p className="text-sm text-red-600">{errors.initialTopUp}</p>
          )}
          <p className="text-sm text-gray-600">
            {initialTopUp > 0 && (
              <>≈ {calculateDays(initialTopUp)} days of membership</>
            )}
          </p>
        </div>

        {/* Quick select buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[7, 30, 90, 365].map(days => {
            const sats = days * 144 * 35;
            return (
              <button
                key={days}
                onClick={() => setInitialTopUp(sats)}
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              >
                {days} days ({sats.toLocaleString()} sats)
              </button>
            );
          })}
        </div>
      </div>

      {/* Fee Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Network Fee Rate
        </label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="50"
              value={feeRate}
              onChange={(e) => setFeeRate(parseInt(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              value={feeRate}
              onChange={(e) => setFeeRate(parseInt(e.target.value) || 1)}
              className="w-20 input-field"
              min="1"
              max="1000"
            />
            <span className="text-sm text-gray-600">sats/vB</span>
          </div>
          {errors.feeRate && (
            <p className="text-sm text-red-600">{errors.feeRate}</p>
          )}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Slow (1 sat/vB)</span>
            <span>Normal (10 sat/vB)</span>
            <span>Fast (50 sat/vB)</span>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Cost Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Inscription (dust limit)</span>
            <span className="font-mono">{costs.inscriptionCost} sats</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Network fees (estimated)</span>
            <span className="font-mono">{costs.networkFee} sats</span>
          </div>
          {initialTopUp > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Initial top-up</span>
              <span className="font-mono">{initialTopUp} sats</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total Cost</span>
              <span className="font-mono text-lg">
                {costs.totalCost.toLocaleString()} sats
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ≈ ${((costs.totalCost * 0.0004).toFixed(2))} USD at current rates
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Your Wallet Balance</span>
          <span className="font-mono text-lg">{balance.toLocaleString()} sats</span>
        </div>
        {balance < costs.totalCost && (
          <p className="text-sm text-red-600 mt-2">
            Insufficient balance. You need {(costs.totalCost - balance).toLocaleString()} more sats.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleContinue}
          disabled={isCreating || balance < costs.totalCost}
          className="btn-primary"
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
};
```

### Step 4: Create Card Preview Component

**File:** `client/src/components/membership/CardPreview.tsx`

```typescript
import React, { useState, useEffect } from 'react';

interface CardPreviewProps {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  isCreating: boolean;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  data,
  onComplete,
  onBack,
  isCreating
}) => {
  const [previewState, setPreviewState] = useState<'active' | 'expired'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    loadPreview();
  }, [data]);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      // Load the inscription template and inject test data
      const response = await fetch('/src/templates/inscription/membershipCard.html');
      const template = await response.text();
      
      // Create a data URL for the preview
      const previewHtml = template
        .replace('window.TREASURY_ADDR = "tb1q..."', `window.TREASURY_ADDR = "${process.env.REACT_APP_TREASURY_ADDRESS}"`)
        .replace('window.CURRENT_BLOCK || 0', '850000')
        .replace('window.RECEIPTS || []', JSON.stringify([
          {
            schema: 'satspray.topup.v1',
            amount: data.initialTopUp || 50000,
            block: 849900,
            paid_to: process.env.REACT_APP_TREASURY_ADDRESS
          }
        ]));
      
      const blob = new Blob([previewHtml], { type: 'text/html' });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreviewState = () => {
    setPreviewState(prev => prev === 'active' ? 'expired' : 'active');
    // Update the preview with different data
    if (previewState === 'active') {
      // Show expired state by setting old block height
      loadPreview();
    } else {
      // Show active state
      loadPreview();
    }
  };

  const handleContinue = async () => {
    // Generate PSBTs before proceeding
    setIsLoading(true);
    try {
      const response = await fetch('/api/inscriptions/create-psbt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientAddress: data.recipientAddress,
          changeAddress: data.recipientAddress, // Same as recipient for simplicity
          initialTopUp: data.initialTopUp,
          feeRate: data.feeRate,
          utxos: [] // Will be fetched from wallet
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create PSBT');
      }

      const result = await response.json();
      
      onComplete({
        commitPsbt: result.commitPsbt,
        revealPsbt: result.revealPsbt,
        estimatedInscriptionId: result.estimatedInscriptionId,
        fees: result.fees
      });
    } catch (error: any) {
      console.error('PSBT creation error:', error);
      alert('Failed to prepare transaction: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Preview Your Card</h2>
        <p className="text-gray-600">
          This is how your membership card will appear once inscribed on the blockchain.
        </p>
      </div>

      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Preview State</span>
        <button
          onClick={togglePreviewState}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-bitcoin-500 focus:ring-offset-2"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              previewState === 'active' ? 'translate-x-1' : 'translate-x-6'
            }`}
          />
          <span className="sr-only">Toggle preview state</span>
        </button>
        <span className={`text-sm font-medium ${
          previewState === 'active' ? 'text-green-600' : 'text-red-600'
        }`}>
          {previewState === 'active' ? 'Active' : 'Expired'}
        </span>
      </div>

      {/* Card Preview */}
      <div className="relative">
        {isLoading ? (
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading preview...</p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              className="w-full h-[600px]"
              title="Card Preview"
              sandbox="allow-scripts"
            />
          </div>
        )}

        {/* Preview overlay for state indicator */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            previewState === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            Preview Mode
          </div>
        </div>
      </div>

      {/* Card Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Card Details</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Type:</dt>
              <dd className="font-mono">text/html;charset=utf-8</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Size:</dt>
              <dd className="font-mono">~5KB</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Decay Rate:</dt>
              <dd className="font-mono">35 sats/block</dd>
            </div>
          </dl>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Initial Balance</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Amount:</dt>
              <dd className="font-mono">{data.initialTopUp || 0} sats</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Duration:</dt>
              <dd className="font-mono">
                ~{Math.floor((data.initialTopUp || 0) / (35 * 144))} days
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Expires at:</dt>
              <dd className="font-mono">
                Block ~{850000 + Math.floor((data.initialTopUp || 0) / 35)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Important</h3>
        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
          <li>Once inscribed, your card cannot be modified</li>
          <li>The card will be permanently stored on the Bitcoin blockchain</li>
          <li>You can top up your card anytime to extend its validity</li>
          <li>The inscription ID will be your unique membership identifier</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={isCreating || isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Preparing...' : 'Continue to Review'}
        </button>
      </div>
    </div>
  );
};
```

### Step 5: Create Transaction Review Component

**File:** `client/src/components/membership/TransactionReview.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@/stores/walletStore';

interface TransactionReviewProps {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  isCreating: boolean;
}

export const TransactionReview: React.FC<TransactionReviewProps> = ({
  data,
  onComplete,
  onBack,
  isCreating
}) => {
  const navigate = useNavigate();
  const { signPsbt, signAndBroadcastPsbt } = useWalletStore();
  const [isSigning, setIsSigning] = useState(false);
  const [currentStep, setCurrentStep] = useState<'review' | 'signing' | 'broadcasting'>('review');
  const [error, setError] = useState<string | null>(null);

  const handleCreateCard = async () => {
    setIsSigning(true);
    setError(null);
    
    try {
      // Step 1: Sign commit transaction
      setCurrentStep('signing');
      const signedCommitPsbt = await signPsbt(data.commitPsbt);
      
      // Step 2: Broadcast commit transaction
      setCurrentStep('broadcasting');
      const commitBroadcastResponse = await fetch('/api/inscriptions/broadcast-commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ signedPsbt: signedCommitPsbt })
      });
      
      if (!commitBroadcastResponse.ok) {
        throw new Error('Failed to broadcast commit transaction');
      }
      
      const { commitTxid } = await commitBroadcastResponse.json();
      
      // Step 3: Sign reveal transaction
      setCurrentStep('signing');
      const signedRevealPsbt = await signPsbt(data.revealPsbt);
      
      // Step 4: Broadcast reveal transaction
      setCurrentStep('broadcasting');
      const revealBroadcastResponse = await fetch('/api/inscriptions/broadcast-reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          signedPsbt: signedRevealPsbt,
          commitTxid 
        })
      });
      
      if (!revealBroadcastResponse.ok) {
        throw new Error('Failed to broadcast reveal transaction');
      }
      
      const { inscriptionId, revealTxid } = await revealBroadcastResponse.json();
      
      // Success! Navigate to success page
      navigate(`/card-creation/success?id=${inscriptionId}&txid=${revealTxid}`);
      
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message || 'Failed to create card');
      setCurrentStep('review');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Review & Confirm</h2>
        <p className="text-gray-600">
          Please review the transaction details carefully before signing.
        </p>
      </div>

      {/* Transaction Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Transaction Summary</h3>
        
        <div className="space-y-4">
          {/* Inscription Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Inscription</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Recipient:</dt>
                <dd className="font-mono text-xs">{data.recipientAddress}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Estimated ID:</dt>
                <dd className="font-mono text-xs">{data.estimatedInscriptionId}</dd>
              </div>
            </dl>
          </div>

          {/* Cost Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Costs</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Inscription:</dt>
                <dd className="font-mono">546 sats</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Network Fees:</dt>
                <dd className="font-mono">{data.fees?.total || 0} sats</dd>
              </div>
              {data.initialTopUp > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Initial Top-up:</dt>
                  <dd className="font-mono">{data.initialTopUp} sats</dd>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <dt>Total:</dt>
                <dd className="font-mono">
                  {(546 + (data.fees?.total || 0) + data.initialTopUp).toLocaleString()} sats
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Two-Step Transaction Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Two-Step Process</h3>
        <p className="text-sm text-blue-700 mb-3">
          Creating an inscription requires two transactions:
        </p>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li><strong>Commit Transaction:</strong> Prepares the inscription</li>
          <li><strong>Reveal Transaction:</strong> Inscribes the content</li>
        </ol>
        <p className="text-sm text-blue-700 mt-3">
          You will need to sign both transactions in your wallet.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Signing Progress */}
      {isSigning && (
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bitcoin-600"></div>
            <div>
              <p className="font-semibold">
                {currentStep === 'signing' && 'Please sign in your wallet...'}
                {currentStep === 'broadcasting' && 'Broadcasting transaction...'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {currentStep === 'signing' && 'Check your wallet for the signing request'}
                {currentStep === 'broadcasting' && 'This may take a few moments'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={isSigning}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={handleCreateCard}
          disabled={isSigning}
          className="btn-primary"
        >
          {isSigning ? 'Processing...' : 'Create Card'}
        </button>
      </div>

      {/* Security Notice */}
      <div className="text-center text-sm text-gray-600">
        <p>🔒 Your private keys never leave your wallet</p>
      </div>
    </div>
  );
};
```

---

## Technical Specifications

### State Management
- Uses Zustand for global wallet state
- Local component state for form data
- Persisted state for wallet preferences

### API Integration
- RESTful endpoints for PSBT creation
- WebSocket for transaction monitoring
- Proper error handling and retries

### UI/UX Requirements
- Mobile-first responsive design
- Loading states for all async operations
- Clear error messages with recovery options
- Progress indicators for multi-step processes

---

## Testing Approach

### Component Testing
```typescript
describe('CardCreation', () => {
  it('should show wallet connection prompt if not connected', () => {
    // Test redirect to home
  });
  
  it('should calculate costs correctly', () => {
    // Test pricing calculator
  });
  
  it('should generate valid PSBT', () => {
    // Test PSBT creation
  });
  
  it('should handle signing errors gracefully', () => {
    // Test error states
  });
});
```

### Integration Testing
1. Complete flow from start to inscription
2. Test with different initial top-up amounts
3. Test error recovery flows
4. Test on mobile devices

### Manual Testing Checklist
- [ ] Connect wallet successfully
- [ ] Calculate pricing with various inputs
- [ ] Preview shows correctly
- [ ] State toggle works in preview
- [ ] PSBT generation succeeds
- [ ] Wallet signing works
- [ ] Error messages are clear
- [ ] Mobile layout is correct

---

## Common Pitfalls to Avoid

### UX Mistakes
1. **Unclear Costs**
   - ❌ Hidden fees
   - ❌ Confusing calculations
   - ✅ Transparent breakdown
   - ✅ Real-time updates

2. **Poor Error Handling**
   - ❌ Generic error messages
   - ❌ No recovery options
   - ✅ Specific error details
   - ✅ Clear next steps

3. **Wallet Integration**
   - ❌ Assuming wallet is connected
   - ❌ Not handling rejection
   - ✅ Check connection status
   - ✅ Handle all wallet states

### Technical Mistakes
1. **State Management**
   - ❌ Props drilling
   - ❌ Duplicate state
   - ✅ Use Zustand store
   - ✅ Single source of truth

2. **API Calls**
   - ❌ No loading states
   - ❌ No error handling
   - ✅ Proper async handling
   - ✅ User feedback

---

## Deliverables

### Required Components
1. `walletStore.ts` - Wallet state management
2. `CardCreation.tsx` - Main creation flow
3. `PricingCalculator.tsx` - Cost calculation
4. `CardPreview.tsx` - Visual preview
5. `TransactionReview.tsx` - Final review

### Supporting Files
1. Loading/error components
2. Common UI utilities
3. Type definitions
4. Unit tests

### Documentation
1. Component API documentation
2. User flow diagrams
3. State management guide
4. Testing documentation

---

## Next Phase

After UI implementation:
1. Add transaction monitoring
2. Create success/error pages
3. Implement retry mechanisms
4. Add analytics tracking

---

*This document provides a comprehensive plan for implementing the user interface for membership card creation. The UI is critical for user experience and must handle the complexity of Bitcoin transactions while remaining intuitive.*