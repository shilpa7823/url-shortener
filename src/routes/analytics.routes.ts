import { Router, Request, Response } from 'express';
import AnalyticsService from '../services/analyticsService';

const router = Router();

// Get analytics for a short code
router.get('/:shortCode', async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;
    const db = req.app.locals.db;
    const service = new AnalyticsService(db);

    const analytics = await service.getAnalytics(shortCode);
    res.json(analytics);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Get all analytics for user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const db = req.app.locals.db;
    const service = new AnalyticsService(db);

    // In production, get userId from authenticated request
    const userId = (req as any).user?.id;
    
    const analytics = await service.getAllAnalytics(
      userId,
      parseInt(limit as string) || 50
    );
    
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
