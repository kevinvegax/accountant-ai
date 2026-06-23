import { Pool } from 'pg'

let pool: Pool | undefined

export function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('Configura DATABASE_URL o POSTGRES_URL para conectar Postgres.')
    }

    pool = new Pool({
      allowExitOnIdle: true,
      connectionString,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
      max: 1,
    })

    pool.on('error', (error) => {
      console.error('Unexpected Postgres pool error', error)
    })
  }

  return pool
}
