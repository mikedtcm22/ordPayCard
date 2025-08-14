/**
 * @fileoverview API routes for inscription operations
 * @module routes/inscriptions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { authenticateJWT } from '../middleware/auth';
import { 
  createInscriptionPsbt, 
  updateRevealPsbt,
  estimateInscriptionCost 
} from '../services/inscription/inscriptionPsbt';
import { validateInscriptionContent } from '../services/inscription/envelopeBuilder';
import { getOrdinalsClient } from '../services/ordinals';
import { UtxoInput } from '../services/psbt';

const router = Router();

/**
 * Load and prepare inscription template
 */
async function loadInscriptionTemplate(): Promise<string> {
  // Path to the template file
      const templatePath = path.join(__dirname, '../../../client/src/templates/inscription/registrationWrapper.html');
  
  try {
    // Read the template
    let template = await fs.readFile(templatePath, 'utf8');
    
    // Replace treasury address placeholder with actual address
    const treasuryAddress = process.env['TREASURY_ADDRESS'];
    if (!treasuryAddress) {
      throw new Error('TREASURY_ADDRESS not configured');
    }
    
    template = template.replace(
      'window.TREASURY_ADDR = "tb1q...";',
      `window.TREASURY_ADDR = "${treasuryAddress}";`
    );
    
    return template;
  } catch (error) {
    throw new Error(`Failed to load inscription template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Estimate inscription costs
 * GET /api/inscriptions/estimate
 */
router.get('/estimate',
  [
    body('feeRate').optional().isInt({ min: 1, max: 1000 }).default(10),
    body('initialTopUp').optional().isInt({ min: 0 }).default(0)
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { feeRate, initialTopUp } = req.query;
      const feeRateNum = parseInt(feeRate as string || '10');
      const topUpNum = parseInt(initialTopUp as string || '0');
      
      // Load template to get actual size
      const template = await loadInscriptionTemplate();
      
      // Calculate costs
      const estimate = estimateInscriptionCost(template, feeRateNum, topUpNum);
      
      res.json({
        success: true,
        estimate: {
          ...estimate,
          templateSize: template.length,
          feeRate: feeRateNum
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Create PSBT for new membership card inscription
 * POST /api/inscriptions/create-psbt
 */
router.post('/create-psbt',
  authenticateJWT,
  [
    body('utxos').isArray().notEmpty().withMessage('UTXOs array is required'),
    body('utxos.*.txid').isString().isLength({ min: 64, max: 64 }).withMessage('Invalid UTXO txid'),
    body('utxos.*.vout').isInt({ min: 0 }).withMessage('Invalid UTXO vout'),
    body('utxos.*.value').isInt({ min: 1 }).withMessage('Invalid UTXO value'),
    body('utxos.*.scriptPubKey').isString().withMessage('Invalid UTXO scriptPubKey'),
    body('recipientAddress').isString().notEmpty().withMessage('Recipient address is required'),
    body('changeAddress').isString().notEmpty().withMessage('Change address is required'),
    body('initialTopUp').optional().isInt({ min: 0 }),
    body('feeRate').optional().isInt({ min: 1, max: 1000 }).default(10)
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { 
        utxos, 
        recipientAddress, 
        changeAddress, 
        initialTopUp,
        feeRate
      } = req.body;
      
      // Load inscription template
      const inscriptionContent = await loadInscriptionTemplate();
      
      // Validate content
      const contentValidation = validateInscriptionContent(
        inscriptionContent,
        'text/html;charset=utf-8'
      );
      
      if (!contentValidation.valid) {
        res.status(400).json({ 
          error: `Invalid inscription content: ${contentValidation.error}` 
        });
        return;
      }
      
      // Prepare treasury address if initial top-up is requested
      const treasuryAddress = (initialTopUp && process.env['TREASURY_ADDRESS']) ? process.env['TREASURY_ADDRESS'] : undefined;
      
      if (initialTopUp && !treasuryAddress) {
        res.status(400).json({ 
          error: 'Treasury address not configured for initial top-up' 
        });
        return;
      }
      
      // Create inscription PSBTs
      const psbtParams: Parameters<typeof createInscriptionPsbt>[0] = {
        utxos: utxos as UtxoInput[],
        inscriptionContent,
        recipientAddress,
        changeAddress,
        feeRate
      };
      
      if (initialTopUp !== undefined) {
        psbtParams.initialTopUp = initialTopUp;
      }
      
      if (treasuryAddress !== undefined) {
        psbtParams.treasuryAddress = treasuryAddress;
      }
      
      const result = await createInscriptionPsbt(psbtParams);
      
      // Calculate content hash for reference
      const crypto = await import('crypto');
      const contentHash = crypto
        .createHash('sha256')
        .update(inscriptionContent)
        .digest('hex');
      
      res.json({
        success: true,
        commitPsbt: result.commitPsbt,
        revealPsbt: result.revealPsbt,
        fees: {
          commit: result.commitTxFee,
          reveal: result.revealTxFee,
          total: result.totalFee
        },
        inscriptionAddress: result.inscriptionAddress,
        contentHash,
        contentSize: inscriptionContent.length,
        instructions: result.instructions,
        note: 'After broadcasting commit tx, use /update-reveal endpoint to finalize reveal PSBT'
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update reveal PSBT with commit transaction ID
 * POST /api/inscriptions/update-reveal
 */
router.post('/update-reveal',
  [
    body('revealPsbt').isString().notEmpty().withMessage('Reveal PSBT is required'),
    body('commitTxid').isString().isLength({ min: 64, max: 64 }).withMessage('Invalid commit txid')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { revealPsbt, commitTxid } = req.body;
      
      // Update the reveal PSBT with actual commit txid
      const updatedPsbt = updateRevealPsbt(revealPsbt, commitTxid);
      
      // Calculate inscription ID (txid + i0)
      const estimatedInscriptionId = `${commitTxid}i0`;
      
      res.json({
        success: true,
        revealPsbt: updatedPsbt,
        estimatedInscriptionId,
        nextSteps: [
          'Import the updated reveal PSBT into your wallet',
          'Sign the reveal transaction',
          'Broadcast the signed reveal transaction',
          'Your inscription will be created with ID: ' + estimatedInscriptionId
        ]
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Check inscription status
 * GET /api/inscriptions/status/:inscriptionId
 */
router.get('/status/:inscriptionId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { inscriptionId } = req.params;
      
      // Validate inscription ID exists and format
      if (!inscriptionId || !/^[a-f0-9]{64}i\d+$/i.test(inscriptionId)) {
        res.status(400).json({ error: 'Invalid inscription ID format' });
        return;
      }
      
      // Check with ordinals API
      const client = getOrdinalsClient();
      const inscription = await client.getInscription(inscriptionId);
      
      if (!inscription.success) {
        res.status(404).json({ 
          error: 'Inscription not found',
          details: inscription.error
        });
        return;
      }
      
      res.json({
        success: true,
        inscription: inscription.data,
        confirmed: inscription.data && inscription.data.genesis_height > 0,
        explorerUrl: `https://ordinals.com/inscription/${inscriptionId}`
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get treasury address for initial top-ups
 * GET /api/inscriptions/treasury
 */
router.get('/treasury', (_req, res) => {
  const treasuryAddress = process.env['TREASURY_ADDRESS'];
  
  if (!treasuryAddress) {
    res.status(503).json({ 
      error: 'Treasury address not configured' 
    });
    return;
  }
  
  res.json({
    success: true,
    treasuryAddress,
    network: process.env['BITCOIN_NETWORK'] || 'testnet'
  });
});

export default router;