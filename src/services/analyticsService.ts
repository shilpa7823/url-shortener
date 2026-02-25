import { Pool } from 'pg';

export interface ClickAnalytics {
  shortCode: string;
  totalClicks: number;
  uniqueClicks: number;
  topReferrers: Array<{ referer: string; count: number }>;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  clicksOverTime: Array<{ date: string; count: number }>;
}

export class AnalyticsService {
  constructor(private db: Pool) {}

  async getAnalytics(shortCode: string): Promise<ClickAnalytics> {
    // Verify short code exists
    const urlCheck = await this.db.query(
      'SELECT id FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (urlCheck.rows.length === 0) {
      throw new Error('Short URL not found');
    }

    // Get total clicks
    const totalResult = await this.db.query(
      'SELECT COUNT(*) as count FROM clicks WHERE short_code = $1',
      [shortCode]
    );
    const totalClicks = parseInt(totalResult.rows[0].count);

    // Get unique clicks
    const uniqueResult = await this.db.query(
      'SELECT COUNT(DISTINCT ip) as count FROM clicks WHERE short_code = $1',
      [shortCode]
    );
    const uniqueClicks = parseInt(uniqueResult.rows[0].count);

    // Get top referrers
    const referrersResult = await this.db.query(
      `SELECT referer, COUNT(*) as count FROM clicks 
       WHERE short_code = $1 AND referer IS NOT NULL
       GROUP BY referer ORDER BY count DESC LIMIT 10`,
      [shortCode]
    );
    const topReferrers = referrersResult.rows.map(row => ({
      referer: row.referer,
      count: parseInt(row.count),
    }));

    // Get top user agents
    const userAgentsResult = await this.db.query(
      `SELECT user_agent, COUNT(*) as count FROM clicks 
       WHERE short_code = $1
       GROUP BY user_agent ORDER BY count DESC LIMIT 10`,
      [shortCode]
    );
    const topUserAgents = userAgentsResult.rows.map(row => ({
      userAgent: row.user_agent,
      count: parseInt(row.count),
    }));

    // Get clicks over time (last 30 days)
    const timeseriesResult = await this.db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM clicks 
       WHERE short_code = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [shortCode]
    );
    const clicksOverTime = timeseriesResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count),
    }));

    return {
      shortCode,
      totalClicks,
      uniqueClicks,
      topReferrers,
      topUserAgents,
      clicksOverTime,
    };
  }

  async getAllAnalytics(userId: string, limit: number = 50): Promise<any[]> {
    const result = await this.db.query(
      `SELECT 
        u.short_code, 
        u.original_url,
        COUNT(c.id) as total_clicks,
        COUNT(DISTINCT c.ip) as unique_clicks,
        MAX(c.created_at) as last_click
       FROM urls u
       LEFT JOIN clicks c ON u.short_code = c.short_code
       WHERE u.created_by = $1
       GROUP BY u.id, u.short_code, u.original_url
       ORDER BY total_clicks DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}

export default AnalyticsService;
