import { Pool } from 'pg'

let pool: Pool | undefined

export function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('Configura DATABASE_URL o POSTGRES_URL para conectar Postgres.')
    }

    pool = new Pool({ connectionString })
  }

  return pool
}
