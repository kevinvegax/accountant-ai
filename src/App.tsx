import { useCallback, useEffect, useState } from 'react'
import './App.css'

type DatabaseInfo = {
  databaseName: string
  serverTime: string
}

type DatabaseInfoResponse =
  | { database: DatabaseInfo }
  | { error: string }

async function fetchDatabaseInfo() {
  const response = await fetch('/api/database-info')
  const data = (await response.json()) as DatabaseInfoResponse

  if (!response.ok) {
    throw new Error('error' in data ? data.error : 'No se pudo cargar Postgres.')
  }

  if ('database' in data) {
    return data.database
  }

  throw new Error('La respuesta de Postgres no tiene datos.')
}

function getLoadErrorMessage(loadError: unknown) {
  return loadError instanceof Error
    ? loadError.message
    : 'No se pudo cargar Postgres.'
}

function App() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDatabaseInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setDatabaseInfo(await fetchDatabaseInfo())
    } catch (loadError) {
      setDatabaseInfo(null)
      setError(getLoadErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let shouldIgnore = false

    async function loadInitialDatabaseInfo() {
      try {
        const nextDatabaseInfo = await fetchDatabaseInfo()

        if (!shouldIgnore) {
          setDatabaseInfo(nextDatabaseInfo)
        }
      } catch (loadError) {
        if (!shouldIgnore) {
          setDatabaseInfo(null)
          setError(getLoadErrorMessage(loadError))
        }
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialDatabaseInfo()

    return () => {
      shouldIgnore = true
    }
  }, [])

  const formattedServerTime = databaseInfo
    ? new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(new Date(databaseInfo.serverTime))
    : '-'

  return (
    <main className="app-shell">
      <section className="database-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Vercel API + Postgres</p>
            <h1>Datos desde Postgres</h1>
          </div>
          <button type="button" onClick={loadDatabaseInfo} disabled={isLoading}>
            {isLoading ? 'Cargando' : 'Actualizar'}
          </button>
        </div>

        <div className="connection-status">
          <span className={error ? 'status-dot error' : 'status-dot'}></span>
          <span>{error ? 'Sin conexión' : 'Consulta lista'}</span>
        </div>

        <div className="result-grid">
          <div>
            <span>Base de datos</span>
            <strong>{databaseInfo?.databaseName ?? '-'}</strong>
          </div>
          <div>
            <span>Hora del servidor</span>
            <strong>{formattedServerTime}</strong>
          </div>
        </div>

        {isLoading && <p className="message">Consultando el endpoint...</p>}
        {error && <p className="message error-message">{error}</p>}

        <div className="endpoint">
          <span>Endpoint</span>
          <code>GET /api/database-info</code>
        </div>
      </section>
    </main>
  )
}

export default App
