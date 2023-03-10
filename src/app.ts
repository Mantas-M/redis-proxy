import net from 'net'
import RedisConnectionPool from './redis-pool'
import { getCommandAndArgsFromData } from './utils'
import execRedisCommand from './redis-wrapper'
import * as dotenv from 'dotenv'
dotenv.config()

const connectionPool = new RedisConnectionPool()

const server = net.createServer(async (socket) => {
  console.log('Client connected')
  const redisClient = await connectionPool.get()

  socket.on('data', async (data) => {
    const { command, args } = getCommandAndArgsFromData(data)

    console.log('Got command:', command, 'with args:', args)

    const result = await execRedisCommand(redisClient, command, args)

    socket.write(result, () => {
      console.log('Response sent to client')
    })
  })

  socket.on('end', async () => {
    await connectionPool.release(redisClient)
    console.log('Client disconnected')
  })

  socket.on('error', (err) => {
    console.error('Error:', err)
    socket.write(`-Error: ${err.message}\r\n`)
  })
})

server.listen(process.env.PROXY_PORT || 6381, () => {
  console.log(`Server listening on port ${process.env.PROXY_PORT || 6381}`)
})
