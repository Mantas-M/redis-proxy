import net from 'net'
import { getCommandAndArgsFromData, messageFinished } from './utils'
import { execRedisCommand, releaseRedisConnection } from './redis-wrapper'
import * as dotenv from 'dotenv'
dotenv.config()

const logging =
  process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'minimal'

const server = net.createServer(async (socket) => {
  if (logging) console.log('Client connected')
  let userMessage = Buffer.alloc(0)

  socket.on('data', async (data) => {
    userMessage = Buffer.concat([userMessage, data])

    if (messageFinished(userMessage)) {
      if (logging) console.log('Message finished')
      const { command, args } = getCommandAndArgsFromData(userMessage)
      userMessage = Buffer.alloc(0)

      if (logging)
        console.log(
          'Got command:',
          command,
          'with byteLength:',
          Buffer.byteLength(args.toString())
        )

      const result = await execRedisCommand(command, args)

      socket.write(result, () => {
        if (logging) console.log('Response sent to client')
      })
    }
  })

  socket.on('end', async () => {
    if (logging) console.log('Client disconnected')
  })

  socket.on('error', async (err) => {
    console.error('Error:', err)
    socket.write(`-Error: ${err.message}\r\n`)
    await releaseRedisConnection()
  })
})

server.listen(process.env.PROXY_PORT || 6381, () => {
  console.log(`Server listening on port ${process.env.PROXY_PORT || 6381}`)
})
