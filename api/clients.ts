import type { IncomingMessage, ServerResponse } from 'node:http'
import { neon } from '@neondatabase/serverless'

type ClientRow = {
  total_clients: string | number
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
    const [summary] = (await getSql().query(`
      select count(*) as total_clients
      from app.clients
    `)) as ClientRow[]

    sendJson(response, 200, {
      ok: true,
      table: 'app.clients',
      totalClients: Number(summary.total_clients),
    })
  } catch (error) {
    console.error('GET /api/clients failed', error)

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'No se pudieron cargar clientes.',
    })
  }
}
