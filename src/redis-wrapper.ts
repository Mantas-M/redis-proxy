import { Redis } from 'ioredis'

export default async function execRedisCommand(
  client: Redis,
  command: string,
  key: string
) {
  switch (command.toLowerCase()) {
    case 'get':
      return getKey(client, key)
    case 'command':
      return '+OK\r\n'
    case 'select':
      return '+OK\r\n'
    case 'keys':
      return getKeys(client, key)
    // case 'scananddelete':
    //   return scanAndDelete(client, key)
    default:
      throw new Error(`Command ${command} not supported`)
  }
}

async function getKey(redis: Redis, key: string) {
  const response = await redis.get(key)

  if (response) {
    const bytes = Buffer.byteLength(response, 'utf8')
    // console.log('response ', response)
    return '$' + bytes + '\r\n' + response + '\r\n'
  } else throw new Error(`Key ${key} not found`)
}

async function getKeys(redis: Redis, key: string) {
  const response = await redis.keys(key)

  if (response) {
    console.log('response ', response)
    const bytes = Buffer.byteLength(response.toString(), 'utf8')
    // console.log('response ', response)
    return '$' + bytes + '\r\n' + response.toString() + '\r\n'
  } else throw new Error(`Key ${key} not found`)
}

async function scanAndDelete(redis: Redis, key: string) {
  // implement scan and delete
}
