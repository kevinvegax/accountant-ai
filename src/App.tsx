import { useCallback, useEffect, useState } from 'react'
import './App.css'

type Client = {
  id: string
  name: string
  email: string
  createdAt: string
}

type ClientsResponse =
  | {
      ok: true
      table: string
      totalClients: number
      clients: Client[]
    }
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

function getLoadErrorMessage(loadError: unknown) {
  return loadError instanceof Error
    ? loadError.message
    : 'No se pudieron cargar clientes.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function App() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClients = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setClients(await fetchClients())
    } catch (loadError) {
      setClients([])
      setError(getLoadErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let shouldIgnore = false

    async function loadInitialClients() {
      try {
        const nextClients = await fetchClients()

        if (!shouldIgnore) {
          setClients(nextClients)
        }
      } catch (loadError) {
        if (!shouldIgnore) {
          setClients([])
          setError(getLoadErrorMessage(loadError))
        }
      } finally {
        if (!shouldIgnore) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialClients()

    return () => {
      shouldIgnore = true
    }
  }, [])

  const clientCountLabel = `${clients.length} ${
    clients.length === 1 ? 'cliente' : 'clientes'
  }`

  return (
    <main className="app-shell">
      <section className="clients-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Vercel API + Neon</p>
            <h1>Clientes</h1>
          </div>
          <button type="button" onClick={loadClients} disabled={isLoading}>
            {isLoading ? 'Cargando' : 'Actualizar'}
          </button>
        </div>

        <div className="connection-status">
          <span className={error ? 'status-dot error' : 'status-dot'}></span>
          <span>{error ? 'Sin conexión' : 'Clientes cargados'}</span>
        </div>

        <div className="result-grid">
          <div>
            <span>Total</span>
            <strong>{clientCountLabel}</strong>
          </div>
          <div>
            <span>Origen</span>
            <strong>app.clients</strong>
          </div>
        </div>

        {isLoading && <p className="message">Cargando clientes...</p>}
        {error && <p className="message error-message">{error}</p>}

        {!isLoading && !error && clients.length === 0 && (
          <div className="empty-state">
            <strong>No hay clientes todavia</strong>
            <span>Agrega registros en app.clients para verlos aqui.</span>
          </div>
        )}

        {clients.length > 0 && (
          <div className="clients-list" aria-label="Clientes">
            <div className="clients-row clients-heading">
              <span>Cliente</span>
              <span>Email</span>
              <span>Alta</span>
            </div>

            {clients.map((client) => (
              <div className="clients-row" key={client.id}>
                <strong>{client.name}</strong>
                <a href={`mailto:${client.email}`}>{client.email}</a>
                <time dateTime={client.createdAt}>{formatDate(client.createdAt)}</time>
              </div>
            ))}
          </div>
        )}

        <div className="endpoint">
          <span>Endpoints</span>
          <code>GET /api/clients</code>
        </div>
      </section>
    </main>
  )
}

export default App
