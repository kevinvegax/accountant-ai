import { useCallback, useEffect, useState } from 'react'
import './App.css'

type DatabaseInfo = {
  databaseName: string
  serverTime: string
}

type DatabaseInfoResponse =
  | { database: DatabaseInfo }
  | { error: string }

async function readApiJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const responseText = await response.text()

  try {
    return JSON.parse(responseText) as T
  } catch {
    const preview = responseText.trim().slice(0, 140)
    const details = preview ? ` Respuesta: ${preview}` : ''

    throw new Error(`${fallbackMessage} Status ${response.status}.${details}`)
  }
}

async function fetchDatabaseInfo() {
  const response = await fetch('/api/database-info')
  const data = await readApiJson<DatabaseInfoResponse>(
    response,
    'El endpoint /api/database-info no devolvio JSON.',
  )

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
            <p className="eyebrow">Vercel API + Neon</p>
            <h1>Backend conectado</h1>
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

        {isLoading && <p className="message">Consultando el backend...</p>}
        {error && <p className="message error-message">{error}</p>}

        <div className="endpoint">
          <span>Endpoints</span>
          <code>GET /api/database-info</code>
          <code>GET /api/clients</code>
        </div>
      </section>
    </main>
  )
}

export default App
