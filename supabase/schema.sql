-- Bus 250 schema. Run this once in your Supabase project's SQL Editor.
-- Project: https://ohcgcixbxducwznfbpza.supabase.co

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  seat text not null check (seat in ('left', 'right')),
  avatar_url text
);

create table presence (
  user_id uuid primary key references profiles(id) on delete cascade,
  status text not null default 'offline' check (status in ('online','offline','typing')),
  last_seen timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id),
  body text,
  attachment_url text,
  attachment_type text,
  reply_to uuid references messages(id),
  pinned boolean not null default false,
  edited_at timestamptz,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_created_at_idx on messages(created_at desc);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references profiles(id),
  emoji text not null,
  unique (message_id, user_id, emoji)
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  body text not null,
  mood text,
  created_at timestamptz not null default now()
);

create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references profiles(id),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  title text not null,
  punched boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table scenery_state (
  id int primary key default 1,
  theme text not null default 'rainy_city',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into scenery_state (id, theme) values (1, 'rainy_city');

insert into storage.buckets (id, name, public) values ('chat-attachments', 'chat-attachments', true)
  on conflict do nothing;
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
  on conflict do nothing;

alter table profiles enable row level security;
alter table presence enable row level security;
alter table messages enable row level security;
alter table reactions enable row level security;
alter table journal_entries enable row level security;
alter table gallery_photos enable row level security;
alter table tickets enable row level security;
alter table scenery_state enable row level security;

create policy "authenticated full access" on profiles for all using (auth.uid() is not null);
create policy "authenticated full access" on presence for all using (auth.uid() is not null);
create policy "authenticated full access" on messages for all using (auth.uid() is not null);
create policy "authenticated full access" on reactions for all using (auth.uid() is not null);
create policy "authenticated full access" on journal_entries for all using (auth.uid() is not null);
create policy "authenticated full access" on gallery_photos for all using (auth.uid() is not null);
create policy "authenticated full access" on tickets for all using (auth.uid() is not null);
create policy "authenticated full access" on scenery_state for all using (auth.uid() is not null);

-- After creating your two accounts in Authentication -> Users, copy their
-- UUIDs and run this (edit names/seats/UUIDs first):
-- insert into profiles (id, display_name, seat) values
--   ('paste-first-user-uuid-here', 'YourName', 'left'),
--   ('paste-second-user-uuid-here', 'FriendName', 'right');

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table presence;
alter publication supabase_realtime add table reactions;
alter publication supabase_realtime add table scenery_state;
alter publication supabase_realtime add table tickets;

-- Love notes left on the seat/window
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

-- Polaroid photo booth moments (separate from the main gallery)
create table polaroids (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);
alter table polaroids enable row level security;
create policy "authenticated full access" on polaroids for all using (auth.uid() is not null);

-- Shared mood lighting warmth, synced live between both seats
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

-- Named bus stops / destinations either of you can set
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
