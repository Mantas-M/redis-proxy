import genericPool, { Factory } from 'generic-pool'
import Redis from 'ioredis'

function createRedisClient(): Promise<Redis> {
  return new Promise((resolve, reject) => {
    const client = new Redis(
      `${process.env.REDIS_HOSTNAME}:${process.env.REDIS_PORT}`
    )

    client.on('connect', () => {
      console.log('Redis client connected')
      resolve(client)
    })

    client.on('error', (err) => {
      console.log('error', err)
      reject(err)
    })
  })
}

function destroyRedisClient(client: Redis): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Destroying Redis client')
    client.disconnect()
    resolve()
  })
}

export default class RedisPool {
  private pool: genericPool.Pool<Redis>

  private redisFactory: Factory<Redis> = {
    create: createRedisClient,
    destroy: destroyRedisClient
  }

  private opts = {
    max: process.env.MAX_REDIS_CONNECTIONS || 10,
    min: process.env.MIN_REDIS_CONNECTIONS || 2
  }

  constructor() {
    this.pool = genericPool.createPool(this.redisFactory, this.opts)
  }

  async get() {
    return await this.pool.acquire()
  }

  async release(client: Redis) {
    return await this.pool.release(client)
  }
}
