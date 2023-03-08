import net from 'net'
import RedisConnectionPool from './redis-pool'
import { getCommandAndKeyFromData } from './util'
import execRedisCommand from './redis-wrapper'

const connectionPool = new RedisConnectionPool()

const server = net.createServer(async (socket) => {
  console.log('Client connected')
  const redisClient = await connectionPool.get()

  socket.on('data', async (data) => {
    const { command, key } = getCommandAndKeyFromData(data)

    console.log('command ', command, 'key ', key)

    const result = await execRedisCommand(redisClient, command, key)

    // console.log('result ', result)

    // Echo the data back to the client
    socket.write(result)
  })

  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected')
    connectionPool.release(redisClient)
  })

  // Handle errors
  socket.on('error', (err) => {
    console.error('Error:', err)
    socket.write(`-Error: ${err.message}\r\n`)
  })
})

// Start the server
server.listen(6381, () => {
  console.log('Server listening on port 6381')
})
