import { Request, Response } from 'express';

export function manualEntry(_req: Request, res: Response) {
  res.json({ message: 'Manual entry not implemented yet.' });
}

export function manualTopUp(_req: Request, res: Response) {
  res.json({ message: 'Manual top-up not implemented yet.' });
}
