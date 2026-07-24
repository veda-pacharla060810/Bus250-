-- Run this in Supabase SQL Editor. Safe to run even though your base
-- schema already exists — this only ADDS the new tables for the date-night
-- features (love notes, photo booth, mood lighting, named bus stops).

create table love_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table love_notes enable row level security;
create policy "authenticated full access" on love_notes for all using (auth.uid() is not null);
alter publication supabase_realtime add table love_notes;

create table polaroids (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);
alter table polaroids enable row level security;
create policy "authenticated full access" on polaroids for all using (auth.uid() is not null);

create table mood_state (
  id int primary key default 1,
  warmth int not null default 50,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into mood_state (id, warmth) values (1, 50);
alter table mood_state enable row level security;
create policy "authenticated full access" on mood_state for all using (auth.uid() is not null);
alter publication supabase_realtime add table mood_state;

create table bus_stops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  set_by uuid references profiles(id),
  reached boolean not null default false,
  created_at timestamptz not null default now()
);
alter table bus_stops enable row level security;
create policy "authenticated full access" on bus_stops for all using (auth.uid() is not null);
alter publication supabase_realtime add table bus_stops;
