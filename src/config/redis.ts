import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export async function initializeRedis() {
  try {
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    
    await redisClient.connect();
    console.log('✅ Redis connected');

    // Subscribe to click events
    const subscriber = redisClient.duplicate();
    await subscriber.connect();
    
    subscriber.subscribe('click_events', async (message) => {
      try {
        const event = JSON.parse(message);
        await recordClick(event);
      } catch (error) {
        console.error('Error processing click event:', error);
      }
    });
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

async function recordClick(event: any) {
  const db = require('./database').pool;
  try {
    await db.query(
      `INSERT INTO clicks (short_code, user_agent, referer, ip, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [event.shortCode, event.userAgent, event.referer, event.ip]
    );
  } catch (error) {
    console.error('Failed to record click:', error);
  }
}

export default redisClient;
