create table if not exists clients (
  id integer generated always as identity primary key,
  name text not null,
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_set_updated_at on clients;

create trigger clients_set_updated_at
before update on clients
for each row
execute function set_updated_at();

insert into clients (name, email, status)
values
  ('Ana Lopez', 'ana@example.com', 'active'),
  ('Carlos Rivera', 'carlos@example.com', 'active'),
  ('Marta Gomez', 'marta@example.com', 'inactive')
on conflict (email) do nothing;
