# Accountant AI

Ejemplo básico con React, Vite, una función API de Vercel y Postgres.

## Desarrollo

```bash
npm install
npm run dev
```

## Postgres

Configura una variable de entorno con la cadena de conexión:

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
```

El backend está en `api/database-info.ts` y consulta:

```sql
select current_database() as database_name, now() as server_time;
```

El frontend consume `GET /api/database-info` desde `src/App.tsx`.

En Vercel, agrega `DATABASE_URL` o `POSTGRES_URL` en Project Settings > Environment Variables.
