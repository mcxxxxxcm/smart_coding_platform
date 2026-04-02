import { createClient } from 'redis';
import { config } from '../config';

const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port
  },
  password: config.redis.password
});

redisClient.on('error', (err) => {
  console.error('Redis 错误:', err);
});

redisClient.on('connect', () => {
  console.log('Redis 连接成功');
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis 连接失败:', error);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl: number = 3600): Promise<void> {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis 缓存设置失败:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis 缓存删除失败:', error);
  }
}

export default redisClient;
