import { neon } from '@neondatabase/serverless'

type NeonSql = ReturnType<typeof neon>

let sql: NeonSql | undefined

export function getSql() {
  if (!sql) {
    const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('Configura DATABASE_URL o POSTGRES_URL para conectar Postgres.')
    }

    sql = neon(connectionString)
  }

  return sql
}
