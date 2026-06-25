import type { IncomingMessage, ServerResponse } from 'node:http'
import { neon } from '@neondatabase/serverless'

type ClientRow = {
  id: string | number
  name: string
  email: string
  created_at: string | Date
}

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
}

function getSql() {
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('Configura DATABASE_URL o POSTGRES_URL para conectar Postgres.')
  }

  return neon(connectionString)
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
    const clients = (await getSql().query(`
      select id, name, email, created_at
      from app.clients
      order by created_at desc, id desc
    `)) as ClientRow[]

    sendJson(response, 200, {
      ok: true,
      table: 'app.clients',
      totalClients: clients.length,
      clients: clients.map((client) => ({
        id: String(client.id),
        name: client.name,
        email: client.email,
        createdAt: new Date(client.created_at).toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/clients failed', error)

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'No se pudieron cargar clientes.',
    })
  }
}
