import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/registration/status/:inscriptionId
// MVP: trust child receipts; validate schema, parent, creator, and fixed fee
router.get('/status/:inscriptionId', async (req: Request, res: Response, _next: NextFunction) => {
  const { inscriptionId } = req.params;
  if (!inscriptionId || !/^[a-f0-9]{64}i\d+$/i.test(inscriptionId)) {
    res.status(400).json({ error: 'Invalid inscription ID format' });
    return;
  }

  try {
    const creatorAddr = process.env['CREATOR_WALLET'] || '';
    const fixedFeeSats = parseInt(process.env['REGISTRATION_FEE_SATS'] || '50000', 10);

    async function fetchJson(url: string): Promise<any | null> {
      try {
        const r = await fetch(url, { redirect: 'follow' as any });
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
      if (data && Array.isArray(data.children)) {
        // Newer ord returns objects; older may return strings
        childIds = data.children.map((c: any) => (c && typeof c === 'object' ? c.id : c)).filter(Boolean);
        break;
      }
      if (data && Array.isArray(data.ids)) { childIds = data.ids; break; }
    }

    let lastRegistration: any = null;
    for (const cid of childIds) {
      const reg = await fetchJson(`http://localhost:8080/content/${cid}`);
      if (!reg || typeof reg !== 'object') continue;
      if (reg.schema !== 'buyer_registration.v1') continue;
      if (reg.parent !== inscriptionId) continue;
      if (creatorAddr && reg.paid_to && reg.paid_to !== creatorAddr) continue;
      if (typeof reg.fee_sats === 'number' && reg.fee_sats < fixedFeeSats) continue;
      lastRegistration = { ...reg, childId: cid };
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

