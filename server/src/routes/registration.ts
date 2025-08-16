import { Router, Request, Response, NextFunction } from 'express';
import { getLastTransferHeight } from '../services/registration/parser/lastTransfer';
import { getLatestChildHeight } from '../services/registration/parser/latestChildHeight';
import { verifyPayment } from '../services/registration/parser/verifyPayment';
import { dedupeTxids } from '../services/registration/parser/dedupe';

const router = Router();

// Phase 2 enhanced validation cache for status endpoint
const STATUS_CACHE_MS = 30_000; // 30 seconds
type StatusCacheEntry = { data: unknown; expiresAtMs: number };
const statusCache: Map<string, StatusCacheEntry> = new Map();

// GET /api/registration/:nftId (Phase 2 Enhanced Validation)
// Implements provenance gating, OP_RETURN validation, and debug info
router.get('/:nftId', async (req: Request, res: Response, next: NextFunction) => {
  const { nftId } = req.params;
  
  // Validate inscription ID format
  if (!nftId || !/^[a-f0-9]{64}i\d+$/i.test(nftId)) {
    res.status(400).json({ error: 'Invalid inscription ID format' });
    return;
  }

  try {
    // Check cache first
    const now = Date.now();
    const cached = statusCache.get(nftId);
    if (cached && now < cached.expiresAtMs) {
      res.json(cached.data);
      return;
    }

    // Dependencies for parser utilities
    async function fetchJson(url: string): Promise<unknown | null> {
      try {
        const r = await fetch(url, { redirect: 'follow' });
        if (!r.ok) return null;
        const txt = await r.text();
        try { return JSON.parse(txt); } catch { return null; }
      } catch { return null; }
    }

    const fetchMeta = async (id: string) => fetchJson(`http://localhost:8080/r/metadata/${id}`);
    const fetchTx = async (txid: string) => fetchJson(`http://localhost:8080/r/tx/${txid}`);
    const fetchChildren = async (id: string) => {
      const variants = [
        `http://localhost:8080/r/children/${id}/inscriptions`,
        `http://localhost:8080/r/children/${id}`,
      ];
      for (const url of variants) {
        const data = await fetchJson(url);
        if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['children'])) {
          const children = (data as Record<string, unknown>)['children'] as unknown[];
          return children.map((c: unknown) => (c && typeof c === 'object' ? c : { id: c }));
        }
        if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['ids'])) {
          const ids = (data as Record<string, unknown>)['ids'] as string[];
          return ids.map((id: string) => ({ id }));
        }
      }
      return [];
    };

    // Derive heights for provenance gating
    const H_parent = await getLastTransferHeight(nftId, { fetchMeta, fetchTx });
    const H_child = await getLatestChildHeight(nftId, { fetchChildren });
    
    // Configuration
    const creatorAddr = process.env['CREATOR_WALLET'] || '';
    const fixedFeeSats = BigInt(parseInt(process.env['REGISTRATION_FEE_SATS'] || '50000', 10));
    const K = parseInt(process.env['PROVENANCE_WINDOW_K'] || '1', 10);
    const currentBlock = parseInt(process.env['CURRENT_BLOCK_HEIGHT'] || '1000', 10);

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
        
        const reg = await fetchJson(`http://localhost:8080/content/${childObj['id']}`);
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
              const reg = await fetchJson(`http://localhost:8080/content/${childObj['id']}`);
              if (reg && typeof reg === 'object' && (reg as Record<string, unknown>)['feeTxid'] === feeTxid) {
                lastRegistration = { ...reg, childId: childObj['id'], verifiedAmount: verifiedAmount.toString() };
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
    statusCache.set(nftId, { data: response, expiresAtMs: now + STATUS_CACHE_MS });
    
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/registration/status/:inscriptionId
// MVP: trust child receipts; validate schema, parent, creator, and fixed fee
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.get('/status/:inscriptionId', async (req: Request, res: Response, _next: NextFunction) => {
  const { inscriptionId } = req.params;
  if (!inscriptionId || !/^[a-f0-9]{64}i\d+$/i.test(inscriptionId)) {
    res.status(400).json({ error: 'Invalid inscription ID format' });
    return;
  }

  try {
    const creatorAddr = process.env['CREATOR_WALLET'] || '';
    const fixedFeeSats = parseInt(process.env['REGISTRATION_FEE_SATS'] || '50000', 10);

    async function fetchJson(url: string): Promise<unknown | null> {
      try {
        const r = await fetch(url, { redirect: 'follow' });
        if (!r.ok) return null;
        const txt = await r.text();
        try { return JSON.parse(txt); } catch { return null; }
      } catch { return null; }
    }

    // Try both ord endpoint variants to list children
    const variants = [
      `http://localhost:8080/r/children/${inscriptionId}/inscriptions`,
      `http://localhost:8080/r/children/${inscriptionId}`,
    ];
    let childIds: string[] = [];
    for (const u of variants) {
      const data = await fetchJson(u);
      if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['children'])) {
        // Newer ord returns objects; older may return strings
        const children = (data as Record<string, unknown>)['children'] as unknown[];
        childIds = children.map((c: unknown) => (c && typeof c === 'object' ? (c as Record<string, unknown>)['id'] as string : c as string)).filter(Boolean);
        break;
      }
      if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['ids'])) { 
        childIds = (data as Record<string, unknown>)['ids'] as string[]; 
        break; 
      }
    }

    let lastRegistration: unknown = null;
    for (const cid of childIds) {
      const reg = await fetchJson(`http://localhost:8080/content/${cid}`);
      if (!reg || typeof reg !== 'object') continue;
      const regObj = reg as Record<string, unknown>;
      if (regObj['schema'] !== 'buyer_registration.v1') continue;
      if (regObj['parent'] !== inscriptionId) continue;
      if (creatorAddr && regObj['paid_to'] && regObj['paid_to'] !== creatorAddr) continue;
      if (typeof regObj['fee_sats'] === 'number' && regObj['fee_sats'] < fixedFeeSats) continue;
      lastRegistration = { ...regObj, childId: cid };
    }

    const isRegistered = !!lastRegistration;
    res.json({
      isRegistered,
      lastRegistration,
      integrity: { source: 'mvp-trusted', checks: ['schema', 'parent', 'creator', 'minFee'] },
      debug: { inscriptionId, childCount: childIds.length },
    });
  } catch (err) {
    res.status(500).json({ error: 'status_failed', message: (err as Error).message });
  }
});

// POST /api/registration/create
// Phase 0 placeholder: returns fee + creator address + instructions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.post('/create', async (_req: Request, res: Response, _next: NextFunction) => {
  const creatorAddr = process.env['CREATOR_WALLET'] || 'tb1q-example-creator-address';
  const fixedFeeSats = parseInt(process.env['REGISTRATION_FEE_SATS'] || '50000', 10);

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

export default router;
export const v1RegistrationRouter = router;

