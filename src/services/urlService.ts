import { Pool } from 'pg';
import redis from 'redis';
import HashGenerator from '../utils/hashGenerator';
import { validateUrl } from '../utils/validators';

export interface CreateUrlRequest {
  originalUrl: string;
  customShortCode?: string;
  expiresAt?: Date;
}

export interface UrlResponse {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: Date;
  expiresAt?: Date;
  clicks: number;
}

export class UrlService {
  constructor(private db: Pool, private redis: redis.RedisClient) {}

  async createShortUrl(request: CreateUrlRequest): Promise<UrlResponse> {
    const { originalUrl, customShortCode, expiresAt } = request;

    // Validate original URL
    if (!validateUrl(originalUrl)) {
      throw new Error('Invalid URL format');
    }

    // Check for existing URL (deduplication)
    const urlHash = HashGenerator.generateUrlHash(originalUrl);
    const existing = await this.db.query(
      'SELECT * FROM urls WHERE url_hash = $1',
      [urlHash]
    );

    if (existing.rows.length > 0) {
      return this.mapToResponse(existing.rows[0]);
    }

    // Generate or validate short code
    let shortCode = customShortCode;
    if (!shortCode) {
      shortCode = await this.generateUniqueShortCode();
    } else {
      // Validate custom short code
      if (!HashGenerator.isValidShortCode(shortCode)) {
        throw new Error('Invalid short code format');
      }

      const existing = await this.db.query(
        'SELECT * FROM urls WHERE short_code = $1',
        [shortCode]
      );

      if (existing.rows.length > 0) {
        throw new Error('Short code already in use');
      }
    }

    // Insert into database
    const result = await this.db.query(
      `INSERT INTO urls (short_code, original_url, url_hash, expires_at) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [shortCode, originalUrl, urlHash, expiresAt || null]
    );

    // Cache the URL
    const ttl = expiresAt
      ? Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
      : 604800; // 7 days

    await this.redis.setex(`url:${shortCode}`, ttl, originalUrl);

    return this.mapToResponse(result.rows[0]);
  }

  async getUrlInfo(shortCode: string): Promise<UrlResponse> {
    const result = await this.db.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      throw new Error('Short URL not found');
    }

    return this.mapToResponse(result.rows[0]);
  }

  private async generateUniqueShortCode(attempts = 0): Promise<string> {
    if (attempts > 10) {
      throw new Error('Failed to generate unique short code');
    }

    const shortCode = HashGenerator.generateShortCode(6);

    const existing = await this.db.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (existing.rows.length > 0) {
      return this.generateUniqueShortCode(attempts + 1);
    }

    return shortCode;
  }

  private mapToResponse(row: any): UrlResponse {
    return {
      id: row.id,
      originalUrl: row.original_url,
      shortCode: row.short_code,
      shortUrl: `${process.env.SHORT_URL_BASE}/${row.short_code}`,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      clicks: row.clicks || 0,
    };
  }
}

export default UrlService;
