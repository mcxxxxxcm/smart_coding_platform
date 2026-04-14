import { createClient } from 'redis';
import { config } from '../config';

let redisClient: ReturnType<typeof createClient> | null = null;
let isConnected = false;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port
      },
      password: config.redis.password
    });

    redisClient.on('error', (err) => {
      console.error('Redis 错误:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis 连接成功');
      isConnected = true;
    });

    redisClient.on('end', () => {
      console.log('Redis 连接关闭');
      isConnected = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Redis 连接失败，将不使用缓存:', error);
    isConnected = false;
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redisClient || !isConnected) {
    return null;
  }
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttl: number = 3600): Promise<void> {
  if (!redisClient || !isConnected) {
    return;
  }
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.log('Redis 缓存设置失败，跳过缓存:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!redisClient || !isConnected) {
    return;
  }
  try {
    await redisClient.del(key);
  } catch (error) {
    console.log('Redis 缓存删除失败:', error);
  }
}

export default redisClient;
