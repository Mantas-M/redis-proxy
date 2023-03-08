import genericPool, { Factory } from 'generic-pool'
import Redis from 'ioredis'
import * as dotenv from 'dotenv'
dotenv.config()

function createRedisClient(): Promise<Redis> {
  return new Promise((resolve, reject) => {
    console.log('host ', process.env.REDIS_HOSTNAME)
    console.log('port ', process.env.REDIS_PORT)

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
    max: 10,
    min: 2
  }

  constructor() {
    this.pool = genericPool.createPool(this.redisFactory, this.opts)
  }

  async get() {
    return this.pool.acquire()
  }

  async release(client: Redis) {
    return this.pool.release(client)
  }
}
