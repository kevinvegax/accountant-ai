import type { IncomingMessage, ServerResponse } from 'node:http'
import { getSql } from '../server/db'

type ClientRow = {
  total_clients: string | number
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
