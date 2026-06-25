import type { IncomingMessage, ServerResponse } from 'node:http'
import { neon } from '@neondatabase/serverless'

type DatabaseInfoRow = {
  database_name: string
  server_time: Date | string
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
    const rows = (await getSql().query(`
      select
        current_database() as database_name,
        now() as server_time
    `)) as DatabaseInfoRow[]
    const row = rows[0]
    const serverTime =
      row.server_time instanceof Date ? row.server_time : new Date(row.server_time)

    sendJson(response, 200, {
      database: {
        databaseName: row.database_name,
        serverTime: serverTime.toISOString(),
      },
    })
  } catch (error) {
    console.error('GET /api/database-info failed', error)

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'No se pudo consultar Postgres.',
    })
  }
}
