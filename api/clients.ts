import type { IncomingMessage, ServerResponse } from 'node:http'
import { getSql } from '../server/db'

type ClientRow = {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
  created_at: Date | string
}

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, jsonHeaders)
  response.end(JSON.stringify(body))
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== 'GET') {
    response.writeHead(405, {
      ...jsonHeaders,
      Allow: 'GET',
    })
    response.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const rows = (await getSql().query(`
      select id, name, email, status, created_at
      from public.clients
      order by id asc
      limit 20
    `)) as ClientRow[]

    sendJson(response, 200, {
      clients: rows.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status,
        createdAt:
          client.created_at instanceof Date
            ? client.created_at.toISOString()
            : new Date(client.created_at).toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/clients failed', error)

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'No se pudieron cargar clientes.',
    })
  }
}
