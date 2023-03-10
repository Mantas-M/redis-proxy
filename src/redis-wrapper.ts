import { Redis } from 'ioredis'
import { createRespArray } from './utils'

export default async function execRedisCommand(
  client: Redis,
  command: string,
  args: string[]
) {
  switch (command.toLowerCase()) {
    case 'get':
      return getKey(client, args)
    case 'set':
      return setKey(client, args)
    case 'setex':
      return setExKey(client, args)
    case 'command':
      return Buffer.from('+OK\r\n')
    case 'select':
      return Buffer.from('+OK\r\n')
    case 'keys':
      return getKeyList(client, args)
    case 'ping':
      return Buffer.from('+PONG\r\n')
    case 'scananddelete':
      return scanAndDelete(client, args)
    default:
      return Buffer.from(`-Error: Command ${command} not supported\r\n`)
  }
}

async function getKey(redis: Redis, args: string[]) {
  if (args.length !== 1)
    return Buffer.from('-Error: Command get takes one argument\r\n')

  const response = await redis.getBuffer(args[0])

  if (response) {
    const bytes = Buffer.byteLength(response, 'utf8')
    return Buffer.from('$' + bytes + '\r\n' + response + '\r\n')
  } else return Buffer.from('$' + -1 + '\r\n')
}

async function setKey(redis: Redis, args: string[]) {
  if (args.length !== 2)
    return Buffer.from('-Error: Command set takes two arguments\r\n')

  const response = await redis.set(args[0], args[1])

  if (response) {
    return Buffer.from('+OK\r\n')
  } else return Buffer.from('$' + -1 + '\r\n')
}

async function setExKey(redis: Redis, args: string[]) {
  if (args.length !== 3)
    return Buffer.from('-Error: Command setex takes three arguments\r\n')

  const response = await redis.setex(args[0], args[1], args[2])

  if (response) {
    return Buffer.from('+OK\r\n')
  } else return Buffer.from('$' + -1 + '\r\n')
}

async function getKeyList(redis: Redis, args: string[]) {
  if (args.length !== 1)
    return Buffer.from('-Error: Command keys takes one argument\r\n')
  const response = await redis.keysBuffer(args[0])

  const responseBuffer = createRespArray(response)

  if (response) {
    return responseBuffer
  } else return Buffer.from('*' + 0 + '\r\n')
}

async function scanAndDelete(redis: Redis, args: string[]) {
  if (args.length !== 1)
    return Buffer.from('-Error: Command scanAndDelete takes one argument\r\n')

  const pattern = args[0]

  let cursor = '0'
  do {
    const result = await redis.scan(cursor, 'MATCH', pattern)
    cursor = result[0]
    const keys = result[1]
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } while (cursor !== '0')
  return Buffer.from('+OK\r\n')
}
