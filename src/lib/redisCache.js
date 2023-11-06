const { createClient } = require('redis');

class RedisCache {
  constructor(ttlSeconds) {
    this.client = createClient({ url: 'redis://host.docker.internal:6379' });
    this.ttl = ttlSeconds;

    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.connect();
  }

  async get(key) {
    const value = await this.client.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  }

  async set(key, value, ttl) {
    const timeToLive = ttl || this.ttl; // Use the passed TTL or the default one
    await this.client.setEx(key, timeToLive, JSON.stringify(value));
  }
}

module.exports = RedisCache;
