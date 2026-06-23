create schema if not exists app;

create table if not exists app.clients (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

insert into app.clients (name, email)
values
  ('Ana Lopez', 'ana@example.com'),
  ('Carlos Rivera', 'carlos@example.com')
on conflict (email) do nothing;
