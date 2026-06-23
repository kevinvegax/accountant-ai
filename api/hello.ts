import type { IncomingMessage, ServerResponse } from 'node:http'

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
}

export default function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, {
      ...jsonHeaders,
      Allow: 'GET, HEAD',
    })
    response.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  response.writeHead(200, jsonHeaders)

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  response.end(JSON.stringify({ message: 'Hola mundo' }))
}
