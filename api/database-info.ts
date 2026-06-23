import type { IncomingMessage, ServerResponse } from 'node:http'
import { Pool } from 'pg'

type DatabaseInfoRow = {
  database_name: string
  server_time: Date | string
}

let pool: Pool | undefined

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, jsonHeaders)
  response.end(JSON.stringify(body))
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('Configura DATABASE_URL o POSTGRES_URL para conectar Postgres.')
    }

    pool = new Pool({ connectionString })
  }

  return pool
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
    const result = await getPool().query<DatabaseInfoRow>(`
      select
        current_database() as database_name,
        now() as server_time
    `)
    const row = result.rows[0]
    const serverTime =
      row.server_time instanceof Date ? row.server_time : new Date(row.server_time)

    sendJson(response, 200, {
      database: {
        databaseName: row.database_name,
        serverTime: serverTime.toISOString(),
      },
    })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'No se pudo consultar Postgres.',
    })
  }
}
