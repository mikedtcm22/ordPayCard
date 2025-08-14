// Placeholder for registration-aware endpoints in future phases
export {};

import { Request, Response } from 'express';

export function getMembershipStatus(_req: Request, res: Response) {
  res.json({ status: 'unknown', message: 'Membership status check not implemented yet.' });
}
