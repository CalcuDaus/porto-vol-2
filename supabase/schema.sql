-- ==============================================================================
-- Portfolio Database Schema for Supabase (PostgreSQL)
-- Paste this script into your Supabase Dashboard -> SQL Editor and hit "Run"
-- ==============================================================================

-- 1. Projects Table
create table if not exists public.projects (
  id text primary key default ('proj-' || floor(extract(epoch from now()) * 1000)::text),
  title text not null,
  description text not null,
  tags text[] default '{}'::text[],
  repo_url text,
  live_url text,
  image_url text,
  featured boolean default false,
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Contact Messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.messages enable row level security;

-- 4. RLS Policies for Projects
create policy "Allow public read-only access to active projects"
  on public.projects
  for select
  using (is_deleted = false);

create policy "Allow public insert for project additions"
  on public.projects
  for insert
  with check (true);

create policy "Allow public soft delete"
  on public.projects
  for update
  using (true)
  with check (true);

-- 5. RLS Policies for Messages
create policy "Allow public insert into messages"
  on public.messages
  for insert
  with check (true);

-- 6. Initial Seed Data (Optional)
insert into public.projects (id, title, description, tags, repo_url, live_url, image_url, featured, is_deleted)
values
  (
    'proj-1',
    'Bun + Elysia API Gateway',
    'Ultra-fast REST API service built on Bun runtime featuring ElysiaJS, Supabase integration, and Swagger OpenAPI documentation.',
    array['Bun', 'ElysiaJS', 'TypeScript', 'Supabase'],
    'https://github.com',
    'http://localhost:3001/swagger',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    true,
    false
  ),
  (
    'proj-2',
    'Svelte 5 Reactive Showcase',
    'Modern, ultra-performant client application utilizing Svelte 5 Runes ($state, $derived) and Tailwind CSS styling.',
    array['Svelte 5', 'SvelteKit', 'TailwindCSS', 'TypeScript'],
    'https://github.com',
    'http://localhost:5173',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    true,
    false
  ),
  (
    'proj-3',
    'Supabase Realtime Database Store',
    'PostgreSQL-backed data layer with Row Level Security (RLS), instant REST API, and realtime subscriptions.',
    array['Supabase', 'PostgreSQL', 'Auth', 'Storage'],
    'https://github.com',
    'https://supabase.com',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    false,
    false
  )
on conflict (id) do nothing;

