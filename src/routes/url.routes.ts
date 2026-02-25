import { Router, Request, Response } from 'express';
import UrlService from '../services/urlService';
import rateLimiter from '../middleware/rateLimiter';
import Joi from 'joi';

const router = Router();

// Validation schema
const createUrlSchema = Joi.object({
  originalUrl: Joi.string().uri().required(),
  customShortCode: Joi.string().min(4).max(12).optional(),
  expiresAt: Joi.date().iso().optional(),
});

// Create short URL
router.post('/', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { error, value } = createUrlSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    const service = new UrlService(db, redis);

    const result = await service.createShortUrl(value);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get URL info
router.get('/:shortCode', async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;
    const service = new UrlService(db, redis);

    const result = await service.getUrlInfo(shortCode);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
