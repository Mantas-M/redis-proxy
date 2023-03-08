export function getCommandAndKeyFromData(data: Buffer): {
  command: string
  key: string
} {
  const message = data.toString()

  // parse the message to an array of arguments
  const args = message.split('\r\n') // remove empty argument at the end
  const command = args[2]
  const key = args[4]

  return { command, key }
}
