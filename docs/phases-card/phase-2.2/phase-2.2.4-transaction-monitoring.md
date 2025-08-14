# Phase 2.2.4: Transaction Monitoring and Result Handling

**Feature:** Membership Card Creation  
**Sub-Phase:** 2.2.4 - Transaction Monitoring and Result Handling  
**Duration:** 2-3 days  
**Document Type:** Implementation Plan  
**Date:** August 1, 2025  

---

## Overview

### Goal
Implement comprehensive transaction monitoring for membership card inscriptions, including real-time status updates, confirmation tracking, and result handling. This system must monitor both commit and reveal transactions, handle edge cases like stuck transactions, and provide clear feedback to users throughout the inscription process.

### Critical Importance
Since inscriptions are permanent and involve real Bitcoin transactions, proper monitoring is essential to:
- Provide user confidence during the wait time
- Handle network congestion gracefully
- Detect and respond to failed transactions
- Ensure users know when their card is ready

### Success Criteria
- Real-time transaction status updates
- Accurate confirmation counting
- Proper error detection and recovery
- Clear user feedback at every stage
- Automatic navigation upon success
- Comprehensive error logging for debugging

---

## Prerequisites

### Technical Knowledge
- Bitcoin transaction lifecycle
- Mempool behavior and fee dynamics
- Ordinals indexing delays
- WebSocket/polling strategies
- Error recovery patterns

### Code Dependencies
```typescript
// Services we'll build upon
import { getOrdinalsClient } from '@/services/ordinals';
import { broadcastTransaction } from '@/services/bitcoin';
import { useTransactionStore } from '@/stores/transaction';
```

### Environment Setup
```bash
# Ensure monitoring services are available
cd /Users/michaelchristopher/repos/ordPayCard

# Create monitoring directory structure
mkdir -p server/src/services/monitoring
mkdir -p client/src/components/monitoring
mkdir -p client/src/pages/creation
```

---

## Implementation Steps

### Step 1: Create Transaction Monitoring Service

**File:** `server/src/services/monitoring/transactionMonitor.ts`

```typescript
/**
 * @fileoverview Transaction monitoring service for inscription tracking
 * @module services/monitoring/transactionMonitor
 * 
 * Monitors Bitcoin transactions through their lifecycle:
 * - Mempool acceptance
 * - Block confirmations
 * - Inscription indexing
 * - Final verification
 */

import { EventEmitter } from 'events';
import { getOrdinalsClient } from '../ordinals';
import { getMempoolClient } from '../mempool';
import { logger } from '../../utils/logger';

/**
 * Transaction status states
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  IN_MEMPOOL = 'IN_MEMPOOL',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  INSCRIPTION_INDEXED = 'INSCRIPTION_INDEXED',
  FAILED = 'FAILED',
  STUCK = 'STUCK'
}

/**
 * Transaction monitoring result
 */
export interface MonitoringResult {
  txid: string;
  status: TransactionStatus;
  confirmations: number;
  blockHeight?: number;
  inscriptionId?: string;
  error?: string;
  timestamp: number;
  feeRate?: number;
  replaceable?: boolean;
}

/**
 * Transaction monitor class
 */
export class TransactionMonitor extends EventEmitter {
  private monitors: Map<string, NodeJS.Timer> = new Map();
  private results: Map<string, MonitoringResult> = new Map();
  
  /**
   * Start monitoring a transaction
   */
  public async monitor(
    txid: string,
    options: {
      type: 'commit' | 'reveal';
      expectedInscriptionId?: string;
      timeout?: number;
      checkInterval?: number;
    } = { type: 'reveal' }
  ): Promise<void> {
    const { 
      type, 
      expectedInscriptionId,
      timeout = 3600000, // 1 hour default
      checkInterval = 10000 // 10 seconds default
    } = options;
    
    logger.info('Starting transaction monitoring', { txid, type });
    
    // Initialize result
    this.results.set(txid, {
      txid,
      status: TransactionStatus.PENDING,
      confirmations: 0,
      timestamp: Date.now()
    });
    
    // Set up monitoring interval
    const monitor = setInterval(async () => {
      try {
        const result = await this.checkTransaction(txid, type, expectedInscriptionId);
        this.results.set(txid, result);
        
        // Emit status update
        this.emit('status', result);
        
        // Check completion conditions
        if (this.isComplete(result, type)) {
          this.stopMonitoring(txid);
          this.emit('complete', result);
        }
        
        // Check timeout
        if (Date.now() - result.timestamp > timeout) {
          this.stopMonitoring(txid);
          result.status = TransactionStatus.STUCK;
          result.error = 'Transaction monitoring timeout';
          this.emit('timeout', result);
        }
      } catch (error) {
        logger.error('Monitoring error', { txid, error });
        this.emit('error', { txid, error });
      }
    }, checkInterval);
    
    this.monitors.set(txid, monitor);
    
    // Initial check
    setImmediate(() => this.checkTransaction(txid, type, expectedInscriptionId));
  }
  
  /**
   * Check transaction status
   */
  private async checkTransaction(
    txid: string,
    type: 'commit' | 'reveal',
    expectedInscriptionId?: string
  ): Promise<MonitoringResult> {
    const mempoolClient = getMempoolClient();
    const ordinalsClient = getOrdinalsClient();
    
    // Get current result
    const currentResult = this.results.get(txid) || {
      txid,
      status: TransactionStatus.PENDING,
      confirmations: 0,
      timestamp: Date.now()
    };
    
    try {
      // Check mempool/blockchain status
      const txInfo = await mempoolClient.getTransaction(txid);
      
      if (!txInfo) {
        // Transaction not found
        return currentResult;
      }
      
      // Update basic info
      currentResult.feeRate = txInfo.fee / txInfo.vsize;
      currentResult.replaceable = txInfo.rbf;
      
      if (!txInfo.status.confirmed) {
        // Still in mempool
        currentResult.status = TransactionStatus.IN_MEMPOOL;
      } else {
        // Confirmed
        currentResult.confirmations = txInfo.status.confirmations;
        currentResult.blockHeight = txInfo.status.block_height;
        
        if (currentResult.confirmations >= 1) {
          currentResult.status = TransactionStatus.CONFIRMING;
        }
        
        if (currentResult.confirmations >= 6) {
          currentResult.status = TransactionStatus.CONFIRMED;
        }
        
        // For reveal transactions, check inscription
        if (type === 'reveal' && currentResult.confirmations >= 1) {
          const inscriptionId = expectedInscriptionId || `${txid}i0`;
          
          try {
            const inscription = await ordinalsClient.getInscription(inscriptionId);
            
            if (inscription.success) {
              currentResult.status = TransactionStatus.INSCRIPTION_INDEXED;
              currentResult.inscriptionId = inscriptionId;
            }
          } catch (error) {
            // Inscription not indexed yet
            logger.debug('Inscription not indexed yet', { inscriptionId });
          }
        }
      }
      
      return currentResult;
      
    } catch (error: any) {
      logger.error('Transaction check failed', { txid, error: error.message });
      currentResult.error = error.message;
      
      // Check if transaction was rejected
      if (error.message.includes('not found')) {
        const timeSinceBroadcast = Date.now() - currentResult.timestamp;
        
        // If not found after 5 minutes, likely rejected
        if (timeSinceBroadcast > 300000) {
          currentResult.status = TransactionStatus.FAILED;
          currentResult.error = 'Transaction rejected by network';
        }
      }
      
      return currentResult;
    }
  }
  
  /**
   * Check if monitoring is complete
   */
  private isComplete(result: MonitoringResult, type: 'commit' | 'reveal'): boolean {
    if (result.status === TransactionStatus.FAILED) {
      return true;
    }
    
    if (type === 'commit') {
      // Commit is complete when confirmed
      return result.confirmations >= 1;
    } else {
      // Reveal is complete when inscription is indexed
      return result.status === TransactionStatus.INSCRIPTION_INDEXED;
    }
  }
  
  /**
   * Stop monitoring a transaction
   */
  public stopMonitoring(txid: string): void {
    const monitor = this.monitors.get(txid);
    if (monitor) {
      clearInterval(monitor);
      this.monitors.delete(txid);
      logger.info('Stopped monitoring', { txid });
    }
  }
  
  /**
   * Get monitoring result
   */
  public getResult(txid: string): MonitoringResult | undefined {
    return this.results.get(txid);
  }
  
  /**
   * Stop all monitoring
   */
  public stopAll(): void {
    for (const [txid, monitor] of this.monitors) {
      clearInterval(monitor);
    }
    this.monitors.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const transactionMonitor = new TransactionMonitor();
```

### Step 2: Create WebSocket Service for Real-time Updates

**File:** `server/src/services/monitoring/websocketService.ts`

```typescript
/**
 * @fileoverview WebSocket service for real-time transaction updates
 * @module services/monitoring/websocketService
 */

import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { transactionMonitor, MonitoringResult } from './transactionMonitor';
import { authenticateSocket } from '../../middleware/socketAuth';
import { logger } from '../../utils/logger';

/**
 * WebSocket events
 */
export enum SocketEvents {
  MONITOR_TX = 'monitor:transaction',
  TX_STATUS = 'transaction:status',
  TX_COMPLETE = 'transaction:complete',
  TX_ERROR = 'transaction:error',
  STOP_MONITOR = 'monitor:stop'
}

/**
 * Initialize WebSocket service
 */
export function initializeWebSocket(server: Server): SocketServer {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });
  
  // Authentication middleware
  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', { socketId: socket.id });
    
    // Handle transaction monitoring request
    socket.on(SocketEvents.MONITOR_TX, async (data: {
      commitTxid: string;
      revealTxid: string;
      expectedInscriptionId: string;
    }) => {
      try {
        const { commitTxid, revealTxid, expectedInscriptionId } = data;
        
        // Set up listeners for commit transaction
        const commitStatusHandler = (result: MonitoringResult) => {
          if (result.txid === commitTxid) {
            socket.emit(SocketEvents.TX_STATUS, {
              type: 'commit',
              ...result
            });
          }
        };
        
        const commitCompleteHandler = (result: MonitoringResult) => {
          if (result.txid === commitTxid) {
            socket.emit(SocketEvents.TX_COMPLETE, {
              type: 'commit',
              ...result
            });
            
            // Start monitoring reveal transaction
            transactionMonitor.monitor(revealTxid, {
              type: 'reveal',
              expectedInscriptionId
            });
          }
        };
        
        // Set up listeners for reveal transaction
        const revealStatusHandler = (result: MonitoringResult) => {
          if (result.txid === revealTxid) {
            socket.emit(SocketEvents.TX_STATUS, {
              type: 'reveal',
              ...result
            });
          }
        };
        
        const revealCompleteHandler = (result: MonitoringResult) => {
          if (result.txid === revealTxid) {
            socket.emit(SocketEvents.TX_COMPLETE, {
              type: 'reveal',
              ...result
            });
            
            // Clean up listeners
            transactionMonitor.removeListener('status', commitStatusHandler);
            transactionMonitor.removeListener('status', revealStatusHandler);
          }
        };
        
        // Register listeners
        transactionMonitor.on('status', commitStatusHandler);
        transactionMonitor.on('complete', commitCompleteHandler);
        transactionMonitor.on('status', revealStatusHandler);
        transactionMonitor.on('complete', revealCompleteHandler);
        
        // Handle errors
        transactionMonitor.on('error', (error) => {
          socket.emit(SocketEvents.TX_ERROR, error);
        });
        
        // Start monitoring commit transaction
        await transactionMonitor.monitor(commitTxid, { type: 'commit' });
        
        // Clean up on disconnect
        socket.on('disconnect', () => {
          transactionMonitor.removeListener('status', commitStatusHandler);
          transactionMonitor.removeListener('complete', commitCompleteHandler);
          transactionMonitor.removeListener('status', revealStatusHandler);
          transactionMonitor.removeListener('complete', revealCompleteHandler);
        });
        
      } catch (error: any) {
        logger.error('Failed to start monitoring', error);
        socket.emit(SocketEvents.TX_ERROR, {
          error: error.message
        });
      }
    });
    
    // Handle stop monitoring request
    socket.on(SocketEvents.STOP_MONITOR, (data: { txid: string }) => {
      transactionMonitor.stopMonitoring(data.txid);
    });
    
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { socketId: socket.id });
    });
  });
  
  return io;
}
```

### Step 3: Create Transaction Progress Component

**File:** `client/src/components/monitoring/TransactionProgress.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { TransactionStatus } from '@/types/monitoring';
import { useNavigate } from 'react-router-dom';

interface TransactionProgressProps {
  commitTxid: string;
  revealTxid: string;
  expectedInscriptionId: string;
  onComplete?: (inscriptionId: string) => void;
  onError?: (error: string) => void;
}

interface ProgressStep {
  label: string;
  description: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export const TransactionProgress: React.FC<TransactionProgressProps> = ({
  commitTxid,
  revealTxid,
  expectedInscriptionId,
  onComplete,
  onError
}) => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      label: 'Broadcasting Commit',
      description: 'Sending commit transaction to network',
      status: 'active'
    },
    {
      label: 'Commit Confirmation',
      description: 'Waiting for commit to be mined',
      status: 'pending'
    },
    {
      label: 'Broadcasting Reveal',
      description: 'Sending reveal transaction with inscription',
      status: 'pending'
    },
    {
      label: 'Reveal Confirmation',
      description: 'Waiting for inscription to be mined',
      status: 'pending'
    },
    {
      label: 'Inscription Indexing',
      description: 'Waiting for ordinals indexer',
      status: 'pending'
    }
  ]);
  
  const [commitStatus, setCommitStatus] = useState<any>(null);
  const [revealStatus, setRevealStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(process.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true
    });
    
    setSocket(newSocket);
    
    // Set up event listeners
    newSocket.on('transaction:status', (data) => {
      if (data.type === 'commit') {
        setCommitStatus(data);
        updateSteps(data, null);
      } else if (data.type === 'reveal') {
        setRevealStatus(data);
        updateSteps(commitStatus, data);
      }
    });
    
    newSocket.on('transaction:complete', (data) => {
      if (data.type === 'reveal' && data.inscriptionId) {
        // All done!
        updateSteps(commitStatus, data, true);
        setTimeout(() => {
          onComplete?.(data.inscriptionId);
          navigate(`/membership/success/${data.inscriptionId}`);
        }, 2000);
      }
    });
    
    newSocket.on('transaction:error', (data) => {
      setError(data.error);
      onError?.(data.error);
    });
    
    // Start monitoring
    newSocket.emit('monitor:transaction', {
      commitTxid,
      revealTxid,
      expectedInscriptionId
    });
    
    // Cleanup
    return () => {
      newSocket.emit('monitor:stop', { txid: commitTxid });
      newSocket.emit('monitor:stop', { txid: revealTxid });
      newSocket.disconnect();
    };
  }, [commitTxid, revealTxid, expectedInscriptionId]);
  
  const updateSteps = (commit: any, reveal: any, complete: boolean = false) => {
    const newSteps = [...steps];
    
    // Update based on commit status
    if (commit) {
      if (commit.status === TransactionStatus.IN_MEMPOOL) {
        newSteps[0].status = 'complete';
        newSteps[1].status = 'active';
      } else if (commit.confirmations >= 1) {
        newSteps[0].status = 'complete';
        newSteps[1].status = 'complete';
        newSteps[2].status = reveal ? 'complete' : 'active';
      }
    }
    
    // Update based on reveal status
    if (reveal) {
      if (reveal.status === TransactionStatus.IN_MEMPOOL) {
        newSteps[3].status = 'active';
      } else if (reveal.confirmations >= 1) {
        newSteps[3].status = 'complete';
        newSteps[4].status = reveal.inscriptionId ? 'complete' : 'active';
      }
    }
    
    // Mark all complete if done
    if (complete) {
      newSteps.forEach(step => step.status = 'complete');
    }
    
    setSteps(newSteps);
  };
  
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'active':
        return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">
              Transaction Failed
            </h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Creating Your Membership Card</h2>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 pt-0.5">
              {getStepIcon(step.status)}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${
                step.status === 'active' ? 'text-blue-900' :
                step.status === 'complete' ? 'text-green-900' :
                'text-gray-600'
              }`}>
                {step.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {step.description}
              </p>
              
              {/* Show confirmations for active steps */}
              {step.status === 'active' && (
                <div className="mt-2">
                  {index === 1 && commitStatus && (
                    <span className="text-sm text-blue-600">
                      {commitStatus.confirmations} / 1 confirmations
                    </span>
                  )}
                  {index === 3 && revealStatus && (
                    <span className="text-sm text-blue-600">
                      {revealStatus.confirmations} / 6 confirmations
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Transaction Links */}
      <div className="mt-8 space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Commit TX: </span>
          <a
            href={`https://mempool.space/testnet/tx/${commitTxid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono"
          >
            {commitTxid.slice(0, 8)}...{commitTxid.slice(-8)}
          </a>
        </div>
        <div>
          <span className="text-gray-600">Reveal TX: </span>
          <a
            href={`https://mempool.space/testnet/tx/${revealTxid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono"
          >
            {revealTxid.slice(0, 8)}...{revealTxid.slice(-8)}
          </a>
        </div>
      </div>
      
      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Do not close this window. The inscription
          process can take 10-30 minutes depending on network conditions.
        </p>
      </div>
    </div>
  );
};
```

### Step 4: Create Success and Error Pages

**File:** `client/src/pages/creation/CardCreationSuccess.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink, Copy, Share2 } from 'lucide-react';
import { getOrdinalsClient } from '@/services/ordinals';
import { Button } from '@/components/common/Button';

interface InscriptionDetails {
  id: string;
  address: string;
  content: string;
  contentType: string;
  timestamp: number;
  genesisHeight: number;
  genesisFee: number;
}

export const CardCreationSuccess: React.FC = () => {
  const { inscriptionId } = useParams<{ inscriptionId: string }>();
  const navigate = useNavigate();
  const [inscription, setInscription] = useState<InscriptionDetails | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    loadInscriptionDetails();
  }, [inscriptionId]);
  
  const loadInscriptionDetails = async () => {
    if (!inscriptionId) return;
    
    try {
      const client = getOrdinalsClient();
      const result = await client.getInscription(inscriptionId);
      
      if (result.success) {
        setInscription(result.data);
      }
    } catch (error) {
      console.error('Failed to load inscription:', error);
    }
  };
  
  const copyInscriptionId = () => {
    if (!inscriptionId) return;
    
    navigator.clipboard.writeText(inscriptionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareCard = async () => {
    if (!inscriptionId) return;
    
    const shareData = {
      title: 'My SatSpray Membership Card',
      text: `Check out my new SatSpray membership card!`,
      url: `https://ordinals.com/inscription/${inscriptionId}`
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        copyInscriptionId();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Membership Card Created!
            </h1>
            <p className="text-lg text-gray-600">
              Your membership card has been successfully inscribed on the Bitcoin blockchain
            </p>
          </div>
          
          {/* Card Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Membership Card</h2>
            
            {inscription && (
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <iframe
                  src={`/api/inscriptions/preview/${inscriptionId}`}
                  className="w-full h-full"
                  title="Membership Card Preview"
                />
              </div>
            )}
            
            {/* Inscription Details */}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Inscription ID</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                    {inscriptionId}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyInscriptionId}
                  >
                    {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {inscription && (
                <>
                  <div>
                    <label className="text-sm text-gray-600">Owner Address</label>
                    <code className="block px-3 py-2 bg-gray-100 rounded text-sm font-mono mt-1">
                      {inscription.address}
                    </code>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Inscription Block</label>
                      <p className="font-semibold">{inscription.genesisHeight.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Inscription Fee</label>
                      <p className="font-semibold">{inscription.genesisFee.toLocaleString()} sats</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
            
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate(`/membership/${inscriptionId}`)}
              >
                View Membership Card
              </Button>
              
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate(`/membership/${inscriptionId}/topup`)}
              >
                Add Initial Balance
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://ordinals.com/inscription/${inscriptionId}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
                
                <Button
                  variant="outline"
                  onClick={shareCard}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Card
                </Button>
              </div>
            </div>
          </div>
          
          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              About Your Membership Card
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your card is permanently stored on the Bitcoin blockchain</li>
              <li>• The balance decays at 35 sats per block (~5 sats/minute)</li>
              <li>• Top up anytime to keep your membership active</li>
              <li>• You can transfer ownership by sending the inscription</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**File:** `client/src/pages/creation/CardCreationError.tsx`

```typescript
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, Home, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface LocationState {
  error: string;
  txid?: string;
  stage?: string;
}

export const CardCreationError: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const getErrorMessage = () => {
    if (!state?.error) return 'An unknown error occurred';
    
    // Parse common error types
    if (state.error.includes('insufficient funds')) {
      return 'Insufficient funds to create the membership card. Please add more Bitcoin to your wallet.';
    }
    
    if (state.error.includes('fee too low')) {
      return 'Transaction fee was too low. The network is congested, please try again with a higher fee rate.';
    }
    
    if (state.error.includes('timeout')) {
      return 'The transaction timed out. This can happen during network congestion. Your funds are safe.';
    }
    
    if (state.error.includes('rejected')) {
      return 'The transaction was rejected by the network. Please check your wallet and try again.';
    }
    
    return state.error;
  };
  
  const getRecoverySteps = () => {
    const steps = [];
    
    if (state?.error.includes('insufficient funds')) {
      steps.push('Add more Bitcoin to your wallet');
      steps.push('Ensure you have at least 0.001 BTC available');
      steps.push('Try creating the card again');
    } else if (state?.error.includes('fee too low')) {
      steps.push('Wait for network congestion to clear');
      steps.push('Try again with a higher fee rate');
      steps.push('Consider using RBF to bump the fee');
    } else if (state?.txid) {
      steps.push('Check the transaction status on a block explorer');
      steps.push('Wait for the transaction to confirm or be dropped');
      steps.push('Contact support if the issue persists');
    } else {
      steps.push('Check your internet connection');
      steps.push('Ensure your wallet is connected');
      steps.push('Try again in a few minutes');
    }
    
    return steps;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Error Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Card Creation Failed
            </h1>
            <p className="text-lg text-gray-600">
              We encountered an error while creating your membership card
            </p>
          </div>
          
          {/* Error Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">What Happened?</h2>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-red-800">{getErrorMessage()}</p>
            </div>
            
            {state?.stage && (
              <div className="mb-4">
                <label className="text-sm text-gray-600">Failed at stage:</label>
                <p className="font-semibold">{state.stage}</p>
              </div>
            )}
            
            {state?.txid && (
              <div>
                <label className="text-sm text-gray-600">Transaction ID:</label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                    {state.txid}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`https://mempool.space/testnet/tx/${state.txid}`, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Recovery Steps */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Recovery Steps</h2>
            
            <ol className="space-y-2">
              {getRecoverySteps().map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">What Would You Like to Do?</h3>
            
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/membership/create')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  // Create error report
                  const report = {
                    error: state?.error,
                    txid: state?.txid,
                    stage: state?.stage,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                  };
                  
                  const blob = new Blob([JSON.stringify(report, null, 2)], {
                    type: 'application/json'
                  });
                  
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `error-report-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Error Report
              </Button>
            </div>
          </div>
          
          {/* Support Info */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact support at{' '}
              <a href="mailto:support@satspray.com" className="text-blue-600 hover:underline">
                support@satspray.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Step 5: Create Transaction Store

**File:** `client/src/stores/transaction.store.ts`

```typescript
/**
 * @fileoverview Transaction monitoring state management
 * @module stores/transaction
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export enum TransactionStatus {
  PENDING = 'PENDING',
  IN_MEMPOOL = 'IN_MEMPOOL',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  INSCRIPTION_INDEXED = 'INSCRIPTION_INDEXED',
  FAILED = 'FAILED',
  STUCK = 'STUCK'
}

interface TransactionState {
  // Current transactions being monitored
  transactions: Map<string, {
    txid: string;
    type: 'commit' | 'reveal';
    status: TransactionStatus;
    confirmations: number;
    timestamp: number;
    error?: string;
  }>;
  
  // Actions
  updateTransaction: (txid: string, update: Partial<TransactionState['transactions'][0]>) => void;
  removeTransaction: (txid: string) => void;
  clearTransactions: () => void;
  
  // Helpers
  getTransaction: (txid: string) => TransactionState['transactions'][0] | undefined;
  isMonitoring: (txid: string) => boolean;
}

export const useTransactionStore = create<TransactionState>()(
  subscribeWithSelector((set, get) => ({
    transactions: new Map(),
    
    updateTransaction: (txid, update) => {
      set((state) => {
        const transactions = new Map(state.transactions);
        const existing = transactions.get(txid);
        
        transactions.set(txid, {
          ...existing,
          ...update,
          txid
        } as any);
        
        return { transactions };
      });
    },
    
    removeTransaction: (txid) => {
      set((state) => {
        const transactions = new Map(state.transactions);
        transactions.delete(txid);
        return { transactions };
      });
    },
    
    clearTransactions: () => {
      set({ transactions: new Map() });
    },
    
    getTransaction: (txid) => {
      return get().transactions.get(txid);
    },
    
    isMonitoring: (txid) => {
      return get().transactions.has(txid);
    }
  }))
);
```

---

## Technical Specifications

### Transaction Monitoring Flow
1. **Commit Transaction Broadcast**
   - Send to network
   - Monitor mempool acceptance
   - Track confirmations

2. **Reveal Transaction Trigger**
   - Wait for 1 commit confirmation
   - Broadcast reveal transaction
   - Monitor reveal confirmations

3. **Inscription Indexing**
   - Poll ordinals API
   - Verify inscription creation
   - Confirm final status

### WebSocket Protocol
```typescript
// Client -> Server
{
  event: 'monitor:transaction',
  data: {
    commitTxid: string,
    revealTxid: string,
    expectedInscriptionId: string
  }
}

// Server -> Client
{
  event: 'transaction:status',
  data: {
    type: 'commit' | 'reveal',
    txid: string,
    status: TransactionStatus,
    confirmations: number,
    blockHeight?: number,
    inscriptionId?: string
  }
}
```

### Error Recovery Strategies
1. **Stuck Transactions**
   - Detect after timeout period
   - Suggest RBF if available
   - Provide CPFP instructions

2. **Failed Transactions**
   - Identify rejection reason
   - Suggest corrective action
   - Enable retry with new parameters

3. **Network Issues**
   - Implement exponential backoff
   - Fallback to polling
   - Cache progress locally

---

## Testing Approach

### Unit Tests
```typescript
describe('TransactionMonitor', () => {
  it('should detect mempool acceptance', async () => {
    const monitor = new TransactionMonitor();
    const mockTxid = 'abc123...';
    
    // Mock mempool API
    jest.spyOn(mempoolClient, 'getTransaction').mockResolvedValue({
      status: { confirmed: false },
      fee: 1000,
      vsize: 200
    });
    
    const result = await monitor.checkTransaction(mockTxid, 'commit');
    expect(result.status).toBe(TransactionStatus.IN_MEMPOOL);
  });
  
  it('should handle inscription indexing', async () => {
    // Test inscription detection logic
  });
});
```

### Integration Tests
1. Create test inscription on testnet
2. Monitor through complete lifecycle
3. Verify all status transitions
4. Test error scenarios

### Manual Testing Checklist
- [ ] Monitor successful inscription creation
- [ ] Test with network congestion
- [ ] Verify timeout handling
- [ ] Test WebSocket reconnection
- [ ] Validate error messages
- [ ] Check mobile responsiveness

---

## Common Pitfalls to Avoid

### Critical Mistakes
1. **Polling Too Frequently**
   - ❌ Polling every second
   - ✅ Use appropriate intervals (10-30s)
   - ✅ Implement exponential backoff

2. **Missing Edge Cases**
   - ❌ Not handling RBF transactions
   - ❌ Ignoring mempool eviction
   - ✅ Handle all transaction states
   - ✅ Provide clear user guidance

3. **Poor Error Messages**
   - ❌ "Transaction failed"
   - ✅ "Transaction fee too low for current network conditions"
   - ✅ Include actionable recovery steps

4. **Resource Leaks**
   - ❌ Not cleaning up intervals/listeners
   - ❌ Keeping WebSocket connections open
   - ✅ Proper cleanup on unmount
   - ✅ Connection lifecycle management

### Performance Considerations
1. **Efficient Polling**
   - Use smart intervals based on status
   - Batch API requests when possible
   - Cache results appropriately

2. **WebSocket Management**
   - Implement reconnection logic
   - Handle connection drops gracefully
   - Clean up on component unmount

---

## Deliverables

### Required Files
1. `transactionMonitor.ts` - Core monitoring service
2. `websocketService.ts` - Real-time update service
3. `TransactionProgress.tsx` - Progress UI component
4. `CardCreationSuccess.tsx` - Success page
5. `CardCreationError.tsx` - Error handling page
6. `transaction.store.ts` - State management

### API Endpoints
1. `/api/monitor/status/:txid` - Get transaction status
2. `/api/monitor/inscription/:id` - Check inscription status
3. WebSocket endpoint for real-time updates

### Documentation
1. WebSocket protocol documentation
2. Error code reference
3. Recovery procedure guide
4. Testing results

### Validation Checklist
- [ ] Accurate status tracking
- [ ] Real-time updates working
- [ ] All error cases handled
- [ ] User-friendly progress display
- [ ] Proper cleanup on completion
- [ ] Mobile responsive design
- [ ] Comprehensive error logging
- [ ] Recovery procedures documented

---

## Next Steps

After completing transaction monitoring:
1. Integration testing with real inscriptions
2. Performance optimization
3. Analytics and monitoring setup
4. Production deployment preparation

---

*This document provides a comprehensive plan for implementing transaction monitoring and result handling. Proper monitoring is crucial for user confidence and successful inscription creation.*