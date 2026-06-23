import { useCallback, useEffect, useState } from 'react'
import './App.css'

type DatabaseInfo = {
  databaseName: string
  serverTime: string
}

type Client = {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
  createdAt: string
}

type DatabaseInfoResponse =
  | { database: DatabaseInfo }
  | { error: string }

type ClientsResponse =
  | { clients: Client[] }
  | { error: string }

type DashboardData = {
  databaseInfo: DatabaseInfo
  clients: Client[]
}

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

async function fetchClients() {
  const response = await fetch('/api/clients')
  const data = await readApiJson<ClientsResponse>(
    response,
    'El endpoint /api/clients no devolvio JSON.',
  )

  if (!response.ok) {
    throw new Error('error' in data ? data.error : 'No se pudieron cargar clientes.')
  }

  if ('clients' in data) {
    return data.clients
  }

  throw new Error('La respuesta de clientes no tiene datos.')
}

async function fetchDashboardData(): Promise<DashboardData> {
  const [databaseInfo, clients] = await Promise.all([
    fetchDatabaseInfo(),
    fetchClients(),
  ])

  return { databaseInfo, clients }
}

function getLoadErrorMessage(loadError: unknown) {
  return loadError instanceof Error
    ? loadError.message
    : 'No se pudo cargar Postgres.'
}

function App() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await fetchDashboardData()

      setDatabaseInfo(nextData.databaseInfo)
      setClients(nextData.clients)
    } catch (loadError) {
      setDatabaseInfo(null)
      setClients([])
      setError(getLoadErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let shouldIgnore = false

    async function loadInitialDashboardData() {
      try {
        const nextData = await fetchDashboardData()

        if (!shouldIgnore) {
          setDatabaseInfo(nextData.databaseInfo)
          setClients(nextData.clients)
        }
      } catch (loadError) {
        if (!shouldIgnore) {
          setDatabaseInfo(null)
          setClients([])
          setError(getLoadErrorMessage(loadError))
        }
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialDashboardData()

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
            <h1>Clientes</h1>
          </div>
          <button type="button" onClick={loadDashboardData} disabled={isLoading}>
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
          <div>
            <span>Registros</span>
            <strong>{clients.length}</strong>
          </div>
        </div>

        {isLoading && <p className="message">Consultando el backend...</p>}
        {error && <p className="message error-message">{error}</p>}

        <section className="clients-section">
          <div className="section-header">
            <h2>Lista de clientes</h2>
            <span>{clients.length} resultados</span>
          </div>

          {clients.length > 0 ? (
            <ul className="client-list">
              {clients.map((client) => (
                <li key={client.id}>
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.email}</span>
                  </div>
                  <span className={`client-status ${client.status}`}>
                    {client.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && !error && <p className="message">Sin clientes.</p>
          )}
        </section>

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
