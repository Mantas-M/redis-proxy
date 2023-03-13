export function getCommandAndArgsFromData(data: Buffer): {
  command: string
  args: string[]
} {
  const message = data.toString().split('\r\n')
  const numberOfInstructions = Number.parseInt(message[0].slice(1)) - 1
  const command = message[2]
  const args: string[] = []

  for (let i = 4; args.length !== numberOfInstructions; i += 2) {
    args.push(message[i])
  }

  return { command, args }
}

export function createRespArray(bufferArray: Buffer[]) {
  let respArray = []
  respArray.push(Buffer.from(`*${bufferArray.length}\r\n`))
  for (let i = 0; i < bufferArray.length; i++) {
    let str = bufferArray[i].toString()
    let buf = Buffer.from(str)
    respArray.push(Buffer.from(`$${buf.length}\r\n`))
    respArray.push(buf)
    respArray.push(Buffer.from('\r\n'))
  }
  return Buffer.concat(respArray)
}

export function messageFinished(data: Buffer): boolean {
  const lastTwoBytes = data.subarray(data.length - 2)

  if (lastTwoBytes.equals(Buffer.from('\r\n'))) {
    if (process.env.NODE_ENV === 'dev')
      console.log('The response ends with \\r\\n')
    return true
  } else {
    if (process.env.NODE_ENV === 'dev')
      console.log('The response does not end with \\r\\n')
    return false
  }
}
