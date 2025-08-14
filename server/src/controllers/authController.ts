import { Request, Response } from 'express';

export function getChallenge(_req: Request, res: Response) {
  res.json({ challenge: 'mock-challenge', nonce: 'mock-nonce' });
}

export function verifySignature(_req: Request, res: Response) {
  res.json({ valid: false, message: 'Signature verification not implemented yet.' });
}
