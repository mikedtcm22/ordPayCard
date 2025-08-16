import { Router, Request, Response, NextFunction } from 'express';
import { getLastTransferHeight } from '../services/registration/parser/lastTransfer';
import { getLatestChildHeight } from '../services/registration/parser/latestChildHeight';
import { verifyPayment } from '../services/registration/parser/verifyPayment';
import { dedupeTxids } from '../services/registration/parser/dedupe';
import { normalizeRegistration } from '../types/registration';
import { SimpleCache } from '../utils/cache';
import { ApiError, ErrorCodes, asyncHandler } from '../middleware/errorHandler';
import * as defaultMetrics from '../utils/metrics';
import { getConfig } from '../config';
import { OrdinalsService } from '../services/ordinals.service';

// Metrics functions interface for dependency injection
export interface MetricsFunctions {
  recordRequest: (endpoint: string, duration: number) => void;
  recordCacheOperation: (hit: boolean, key: string) => void;
  triggerHook: (event: string, data: any) => void;
}

// Optional service injection for testing
export interface ServiceDependencies {
  ordinalsService?: OrdinalsService;
}

/**
 * Create registration router with optional metrics and service injection
 */
export function createRegistrationRouter(
  metrics?: MetricsFunctions,
  services?: ServiceDependencies
): Router {
  const router = Router();
  
  // Use injected metrics or default singleton
  const { recordRequest, recordCacheOperation, triggerHook } = metrics || defaultMetrics;

  // Get configuration
  const config = getConfig();
  
  // Initialize services
  const ordinalsService = services?.ordinalsService || new OrdinalsService(config);

  // Phase 2 enhanced validation cache for status endpoint
  const statusCache = new SimpleCache<unknown>({ ttlMs: config.cache.status.ttl });

  // GET /api/registration/:nftId (Phase 2 Enhanced Validation)
  // Implements provenance gating, OP_RETURN validation, and debug info
  router.get('/:nftId', asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const startTime = Date.now();
  const endpoint = '/api/registration/:nftId';
  
  // Trigger before request hook
  triggerHook('beforeRequest', {
    endpoint,
    method: req.method,
    params: req.params
  });
  
  const { nftId } = req.params;
  
  // Validate inscription ID format
  if (!nftId || !/^[a-f0-9]{64}i\d+$/i.test(nftId)) {
    const duration = Math.max(1, Date.now() - startTime);
    recordRequest(endpoint, duration);
    triggerHook('afterRequest', {
      endpoint,
      method: req.method,
      statusCode: 400,
      duration
    });
    throw new ApiError(400, ErrorCodes.INVALID_INSCRIPTION_FORMAT, 'Invalid inscription ID format');
  }

  try {
    // Check cache first
    const cached = statusCache.get(nftId);
    if (cached) {
      recordCacheOperation(true, nftId);
      const duration = Math.max(1, Date.now() - startTime);
      recordRequest(endpoint, duration);
      triggerHook('afterRequest', {
        endpoint,
        method: req.method,
        statusCode: 200,
        duration
      });
      res.json(cached);
      return;
    }
    
    // Cache miss
    recordCacheOperation(false, nftId);

    // Dependencies for parser utilities
    const fetchMeta = async (id: string) => ordinalsService.fetchMetadata(id);
    const fetchTx = async (txid: string) => ordinalsService.fetchTransaction(txid);
    const fetchChildren = async (id: string) => ordinalsService.fetchChildren(id);

    // Derive heights for provenance gating
    const H_parent = await getLastTransferHeight(nftId, { fetchMeta, fetchTx });
    const H_child = await getLatestChildHeight(nftId, { fetchChildren });
    
    // Configuration
    const creatorAddr = config.registration.fees.creatorWallet;
    const fixedFeeSats = BigInt(config.registration.fees.registrationSats);
    const K = config.registration.provenance.windowK;
    const currentBlock = config.registration.provenance.currentBlockHeight;

    // Fetch children and validate registrations
    const children = await fetchChildren(nftId);
    let lastRegistration: unknown = null;
    let isRegistered = false;
    
    // Only proceed if provenance gating passes (H_child == H_parent)
    if (H_child !== null && H_parent !== null && H_child === H_parent) {
      const feeTxids: string[] = [];
      
      for (const child of children) {
        if (!child || typeof child !== 'object') continue;
        const childObj = child as Record<string, unknown>;
        if (!childObj['id']) continue;
        
        const reg = await ordinalsService.fetchContent(childObj['id'] as string);
        if (!reg || typeof reg !== 'object') continue;
        const regObj = reg as Record<string, unknown>;
        if (regObj['schema'] !== 'buyer_registration.v1') continue;
        if (regObj['parent'] !== nftId) continue;
        if (!regObj['feeTxid']) continue;
        
        feeTxids.push(regObj['feeTxid'] as string);
      }

      // Deduplicate fee transactions
      const uniqueTxids = dedupeTxids(feeTxids);
      
      // Validate each unique fee transaction
      for (const feeTxid of uniqueTxids) {
        try {
          const verifiedAmount = await verifyPayment(
            feeTxid, 
            creatorAddr, 
            fixedFeeSats, 
            nftId,
            {
              currentBlock,
              network: 'regtest',
              fetchTx: async (txid: string) => {
                const tx = await fetchTx(txid);
                const hex = tx && typeof tx === 'object' ? (tx as Record<string, unknown>)['hex'] as string : null;
                return hex || ''; // Return empty string instead of null to match expected type
              },
              minBlock: H_child,
              txBlockHeight: await (async () => {
                const tx = await fetchTx(feeTxid);
                const blockHeight = tx && typeof tx === 'object' ? (tx as Record<string, unknown>)['block_height'] as number : null;
                return blockHeight || 0; // Return 0 instead of null to match expected type
              })(),
            }
          );
          
          if (verifiedAmount >= fixedFeeSats) {
            isRegistered = true;
            // Find the registration data for this txid
            for (const child of children) {
              if (!child || typeof child !== 'object') continue;
              const childObj = child as Record<string, unknown>;
              if (!childObj['id']) continue;
              const reg = await ordinalsService.fetchContent(childObj['id'] as string);
              if (reg && typeof reg === 'object' && (reg as Record<string, unknown>)['feeTxid'] === feeTxid) {
                const rawReg = { ...reg, childId: childObj['id'], verifiedAmount: verifiedAmount.toString() };
                lastRegistration = normalizeRegistration(rawReg);
                break;
              }
            }
            break; // Use first valid registration
          }
        } catch {
          // Continue to next transaction on error
          continue;
        }
      }
    }

    // Determine fee height for debug
    let feeHeight: number | null = null;
    if (lastRegistration && typeof lastRegistration === 'object' && (lastRegistration as Record<string, unknown>)['feeTxid']) {
      try {
        const tx = await fetchTx((lastRegistration as Record<string, unknown>)['feeTxid'] as string);
        feeHeight = tx && typeof tx === 'object' ? (tx as Record<string, unknown>)['block_height'] as number || null : null;
      } catch {
        // Ignore errors
      }
    }

    const response = {
      isRegistered,
      lastRegistration,
      integrity: { 
        source: 'phase2-enhanced', 
        checks: ['schema', 'parent', 'creator', 'verifyPayment', 'provenance-gating'] 
      },
      debug: { 
        H_parent, 
        H_child, 
        feeHeight, 
        K,
        nftId,
        childCount: children.length
      },
    };

    // Cache the response
    statusCache.set(nftId, response);
    
    // Record metrics
    const duration = Math.max(1, Date.now() - startTime);
    recordRequest(endpoint, duration);
    triggerHook('afterRequest', {
      endpoint,
      method: req.method,
      statusCode: 200,
      duration
    });
    
    res.json(response);
  } catch (err) {
    // Handle specific error types
    if (err instanceof Error) {
      if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
        throw new ApiError(
          503, 
          ErrorCodes.SERVICE_UNAVAILABLE, 
          'Unable to fetch registration data',
          { reason: 'Network timeout or service unavailable' }
        );
      }
      if (err.message.includes('JSON')) {
        throw new ApiError(
          502,
          ErrorCodes.DATA_PARSING_ERROR,
          'Failed to parse upstream response'
        );
      }
    }
    throw err;
  }
}));

  // GET /api/registration/status/:inscriptionId
  // MVP: trust child receipts; validate schema, parent, creator, and fixed fee
  router.get('/status/:inscriptionId', asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { inscriptionId } = req.params;
  if (!inscriptionId || !/^[a-f0-9]{64}i\d+$/i.test(inscriptionId)) {
    throw new ApiError(400, ErrorCodes.INVALID_INSCRIPTION_FORMAT, 'Invalid inscription ID format');
  }

  try {
    const creatorAddr = config.registration.fees.creatorWallet;
    const fixedFeeSats = config.registration.fees.registrationSats;

    // Fetch children using service layer
    const children = await ordinalsService.fetchChildren(inscriptionId);
    const childIds = children.map(c => c.id);

    let lastRegistration: unknown = null;
    for (const cid of childIds) {
      const reg = await ordinalsService.fetchContent(cid);
      if (!reg || typeof reg !== 'object') continue;
      const regObj = reg as Record<string, unknown>;
      if (regObj['schema'] !== 'buyer_registration.v1') continue;
      if (regObj['parent'] !== inscriptionId) continue;
      if (creatorAddr && regObj['paid_to'] && regObj['paid_to'] !== creatorAddr) continue;
      if (typeof regObj['fee_sats'] === 'number' && regObj['fee_sats'] < fixedFeeSats) continue;
      const rawReg = { ...regObj, childId: cid };
      lastRegistration = normalizeRegistration(rawReg);
    }

    const isRegistered = !!lastRegistration;
    res.json({
      isRegistered,
      lastRegistration,
      integrity: { source: 'mvp-trusted', checks: ['schema', 'parent', 'creator', 'minFee'] },
      debug: { inscriptionId, childCount: childIds.length },
    });
  } catch (err) {
    // Handle specific error types
    if (err instanceof Error) {
      if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
        throw new ApiError(
          503, 
          ErrorCodes.SERVICE_UNAVAILABLE, 
          'Unable to fetch registration data',
          { reason: 'Network timeout or service unavailable' }
        );
      }
      if (err.message.includes('JSON')) {
        throw new ApiError(
          502,
          ErrorCodes.DATA_PARSING_ERROR,
          'Failed to parse upstream response'
        );
      }
    }
    throw err;
  }
}));

  // POST /api/registration/create
  // Phase 0 placeholder: returns fee + creator address + instructions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  router.post('/create', async (_req: Request, res: Response, _next: NextFunction) => {
  const creatorAddr = config.registration.fees.creatorWallet || 'tb1q-example-creator-address';
  const fixedFeeSats = config.registration.fees.registrationSats;

  res.json({
    fee: { amountSats: fixedFeeSats, currency: 'sats' },
    creatorAddr,
    opReturn: null,
    instructions: {
      summary: 'Send exact fee to creator address, then inscribe registration JSON as a child of the NFT.',
      steps: [
        'Create a Bitcoin tx paying the fee to the creator address',
        'Record the txid',
        'Create a registration JSON that references the NFT and fee txid',
        'Inscribe the registration JSON as a child of the NFT inscription',
      ],
    },
  });
});

  return router;
}

// Create default instance with singleton metrics
const defaultRouter = createRegistrationRouter();

export default defaultRouter;
export const v1RegistrationRouter = defaultRouter;

