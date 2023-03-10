import net from 'net'
import RedisConnectionPool from './redis-pool'
import { getCommandAndArgsFromData, messageFinished } from './utils'
import execRedisCommand from './redis-wrapper'
import * as dotenv from 'dotenv'
dotenv.config()

const connectionPool = new RedisConnectionPool()

const server = net.createServer(async (socket) => {
  if (process.env.NODE_ENV === 'dev') console.log('Client connected')
  const redisClient = await connectionPool.get()
  let userMessage = Buffer.alloc(0)

  socket.on('data', async (data) => {
    userMessage = Buffer.concat([userMessage, data])

    if (messageFinished(userMessage)) {
      if (process.env.NODE_ENV === 'dev') console.log('Message finished')

      const { command, args } = getCommandAndArgsFromData(userMessage)

      if (process.env.NODE_ENV === 'dev')
        console.log('Got command:', command, 'with args:', args)

      const result = await execRedisCommand(redisClient, command, args)

      socket.write(result, () => {
        if (process.env.NODE_ENV === 'dev')
          console.log('Response sent to client')
      })

      userMessage = Buffer.alloc(0)
    }
  })

  socket.on('end', async () => {
    await connectionPool.release(redisClient)
    if (process.env.NODE_ENV === 'dev') console.log('Client disconnected')
  })

  socket.on('error', (err) => {
    console.error('Error:', err)
    socket.write(`-Error: ${err.message}\r\n`)
  })
})

server.listen(process.env.PROXY_PORT || 6381, () => {
  console.log(`Server listening on port ${process.env.PROXY_PORT || 6381}`)
})
