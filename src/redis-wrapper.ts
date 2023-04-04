import { Redis } from 'ioredis'
import { createRespArray } from './utils'
import RedisConnectionPool from './redis-pool'
import * as dotenv from 'dotenv'
dotenv.config()

const connectionPool = new RedisConnectionPool()
let clientBorrowedFromPool: boolean
let redis: Redis

export async function execRedisCommand(command: string, args: string[]) {
  switch (command.toLowerCase()) {
    case 'command':
      return Buffer.from('+OK\r\n')
    case 'info':
      return Buffer.from('+OK\r\n')
    case 'select':
      return Buffer.from('+OK\r\n')
    case 'ping':
      return Buffer.from('+PONG\r\n')
    case 'get':
      return getKey(args)
    case 'set':
      return setKey(args)
    case 'setex':
      return setExKey(args)
    case 'keys':
      return getKeyList(args)
    case 'scananddelete':
      return deleteKeys(args)
    case 'flushall':
      return flushAll(args)
    case 'del':
      return deleteKey(args)
    default:
      return Buffer.from(`-Error: Command ${command} not supported\r\n`)
  }
}

async function getRedisConnection() {
  if (clientBorrowedFromPool) {
    console.error('Client already borrowed, should not happen')
    return redis
  } else {
    redis = await connectionPool.get()
    clientBorrowedFromPool = true
    return redis
  }
}

export async function releaseRedisConnection() {
  if (clientBorrowedFromPool) {
    await connectionPool.release(redis)
    clientBorrowedFromPool = false
  } else console.info('Client not borrowed')
}

async function getKey(args: string[]) {
  if (args.length !== 1)
    return Buffer.from('-Error: Command get takes one argument\r\n')

  const redisConnection = await getRedisConnection()
  const response = await redisConnection.getBuffer(args[0])
  await releaseRedisConnection()

  if (response) {
    const bytes = Buffer.byteLength(response, 'utf8')
    return Buffer.from('$' + bytes + '\r\n' + response + '\r\n')
  } else return Buffer.from('$' + -1 + '\r\n')
}

async function setKey(args: string[]) {
  if (args.length !== 2)
    return Buffer.from('-Error: Command set takes two arguments\r\n')

  const redisConnection = await getRedisConnection()
  const response = await redisConnection.set(args[0], args[1])
  await releaseRedisConnection()

  if (response) {
    return Buffer.from('+OK\r\n')
  } else return Buffer.from('$' + -1 + '\r\n')
}

async function setExKey(args: string[]) {
  if (args.length !== 3)
    return Buffer.from('-Error: Command setex takes three arguments\r\n')

  const redisConnection = await getRedisConnection()
  const response = await redisConnection.setex(args[0], args[1], args[2])
  await releaseRedisConnection()

  if (response) {
    return Buffer.from('+OK\r\n')
  } else return Buffer.from('$' + -1 + '\r\n')
}

async function getKeyList(args: string[]) {
  if (args.length !== 1)
    return Buffer.from('-Error: Command keys takes one argument\r\n')

  const redisConnection = await getRedisConnection()
  const response = await redisConnection.keysBuffer(args[0])
  await releaseRedisConnection()

  if (response) {
    return createRespArray(response)
  } else return Buffer.from('*' + 0 + '\r\n')
}

async function deleteKeys(args: string[]) {
  if (args.length !== 1)
    return Buffer.from('-Error: Command scanAndDelete takes one argument\r\n')

  const redisConnection = await getRedisConnection()

  try {
    const pattern = args[0]

    let cursor = '0'
    do {
      const result = await redisConnection.scan(cursor, 'MATCH', pattern)
      cursor = result[0]
      const keys = result[1]
      if (keys.length > 0) {
        await redisConnection.del(...keys)
      }
    } while (cursor !== '0')
  } catch (error) {
    console.error(error)
  }

  await releaseRedisConnection()

  return Buffer.from('+OK\r\n')
}

async function flushAll(args: string[]) {
  if (args.length !== 0)
    return Buffer.from('-Error: Command flushall takes no arguments\r\n')

  const redisConnection = await getRedisConnection()
  await redisConnection.flushall()
  await releaseRedisConnection()

  return Buffer.from('+OK\r\n')
}

async function deleteKey(args: string[]) {
  if (args.length !== 1)
    return Buffer.from('-Error: Command del takes one argument\r\n')

  const redisConnection = await getRedisConnection()
  const response = await redisConnection.del(args[0])
  await releaseRedisConnection()

  if (response) {
    return Buffer.from('+OK\r\n')
  } else return Buffer.from('$' + -1 + '\r\n')
}
