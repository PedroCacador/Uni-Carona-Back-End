import { Router, Request, Response } from 'express';

const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export { healthRouter };
