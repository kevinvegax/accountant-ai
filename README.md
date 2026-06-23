# Accountant AI

Ejemplo básico con React, Vite, una función API de Vercel y Postgres.

## Desarrollo

```bash
npm install
npm run dev
```

`npm run dev` levanta el frontend con Vite. Para probar también las funciones
`/api` en local, usa Vercel CLI:

```bash
vercel dev
```

## Postgres

Configura una variable de entorno con la cadena de conexión de Neon:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require
```

Aplica la primera migración en tu base:

```bash
psql "$DATABASE_URL" -f migrations/001_create_app_clients.sql
```

La migración crea el schema `app` y la tabla `app.clients`, con dos registros seed.

## API

El backend tiene estos endpoints:

```txt
GET /api/database-info
GET /api/clients
```

`api/database-info.ts` consulta:

```sql
select current_database() as database_name, now() as server_time;
```

`api/clients.ts` consulta:

```sql
select count(*) as total_clients
from app.clients;
```

El frontend solo consume `GET /api/database-info`. El endpoint `GET /api/clients` existe para validar que el backend puede consultar `app.clients`, pero la UI no lo llama ni muestra esos datos.

En Vercel, agrega `DATABASE_URL` o `POSTGRES_URL` en Project Settings > Environment Variables. Para Neon Serverless, el backend usa `@neondatabase/serverless` y ejecuta las consultas por HTTPS.
