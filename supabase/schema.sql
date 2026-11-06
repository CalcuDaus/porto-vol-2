-- ==============================================================================
-- Portfolio Database Schema for Supabase (PostgreSQL)
-- Buka Supabase Dashboard -> Masuk ke project -> Buka menu "SQL Editor"
-- Buat New Query, paste kode ini, lalu klik "Run"
-- ==============================================================================

-- 1. Tabel Konten Utama Portofolio (Menyimpan seluruh data portofolio)
create table if not exists public.site_content (
  id text primary key default 'main',
  content jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabel Pesan Kontak Masuk
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabel Proyek Individual (Optional / Backup)
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

-- 4. Aktifkan Row Level Security (RLS)
alter table public.site_content enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;

-- 5. Kebijakan Keamanan (RLS Policies)
-- Izinkan publik membaca konten portofolio
drop policy if exists "Allow public read access to site_content" on public.site_content;
create policy "Allow public read access to site_content"
  on public.site_content
  for select
  using (true);

-- Izinkan update konten portofolio
drop policy if exists "Allow update to site_content" on public.site_content;
create policy "Allow update to site_content"
  on public.site_content
  for all
  using (true)
  with check (true);

-- Izinkan publik mengirim pesan kontak (Contact Form)
drop policy if exists "Allow public insert into messages" on public.messages;
create policy "Allow public insert into messages"
  on public.messages
  for insert
  with check (true);

-- Izinkan baca pesan
drop policy if exists "Allow read messages" on public.messages;
create policy "Allow read messages"
  on public.messages
  for select
  using (true);

-- Izinkan baca proyek
drop policy if exists "Allow public read-only access to active projects" on public.projects;
create policy "Allow public read-only access to active projects"
  on public.projects
  for select
  using (is_deleted = false);

-- 6. Masukkan Data Awal (Seed Data) Konten Portofolio
insert into public.site_content (id, content, updated_at)
values (
  'main',
  '{
    "appearance": {
      "titleFont": "cabin-sketch",
      "navFont": "cabin-sketch",
      "bodyFont": "kalam",
      "chalkColor": "#ebebeb",
      "zoomDuration": 700
    },
    "hero": {
      "name": "MHD FIRDAUS",
      "role": "Software Engineer",
      "avatarUrl": "/board/avatar.webp",
      "showAvatar": true,
      "avatarSize": 160,
      "avatarOffsetX": -6,
      "avatarOffsetY": 10,
      "cvUrl": "/cv.pdf",
      "cvLabel": "Curriculum Vitae",
      "showCv": true
    },
    "nav": {
      "projects": "Projects",
      "achievements": "Achivements",
      "skills": "Skills",
      "contact": "Contact"
    },
    "socials": {
      "github": "https://github.com/calcudaus",
      "linkedin": "https://www.linkedin.com/in/mhd-firdaus/",
      "instagram": "https://instagram.com/e.about.us"
    },
    "mathRain": {
      "enabled": true,
      "density": 100,
      "size": 20,
      "opacity": 0.45,
      "speed": 1,
      "color": "#ffffff",
      "bounce": true
    },
    "intros": {
      "projects": "Selected software engineering works, open-source projects, and systems.",
      "achievements": "Milestones, certifications, and recognitions earned along the journey.",
      "skills": "Core technical competencies, frameworks, runtimes, and engineering tooling."
    },
    "projects": [
      {
        "id": "proj-1",
        "title": "Bun + Elysia API Gateway",
        "description": "Ultra-fast REST API service built on Bun runtime featuring ElysiaJS, Supabase integration, and Swagger OpenAPI documentation.",
        "tags": ["Bun", "ElysiaJS", "TypeScript", "Supabase"],
        "year": "2025",
        "repoUrl": "https://github.com",
        "liveUrl": "http://localhost:3001/swagger",
        "isDeleted": false
      },
      {
        "id": "proj-2",
        "title": "Svelte 5 Reactive Showcase",
        "description": "Modern, ultra-performant client application utilizing Svelte 5 Runes ($state, $derived) and Tailwind CSS styling.",
        "tags": ["Svelte 5", "SvelteKit", "TailwindCSS", "TypeScript"],
        "year": "2025",
        "repoUrl": "https://github.com",
        "liveUrl": "http://localhost:5173",
        "isDeleted": false
      },
      {
        "id": "proj-3",
        "title": "Supabase Realtime Database Store",
        "description": "PostgreSQL-backed data layer with Row Level Security (RLS), instant REST API, and realtime subscriptions.",
        "tags": ["Supabase", "PostgreSQL", "Auth", "Storage"],
        "year": "2024",
        "repoUrl": "https://github.com",
        "liveUrl": "https://supabase.com",
        "isDeleted": false
      }
    ],
    "achievements": [
      {
        "id": "ach-1",
        "title": "Full-Stack Software Engineering Excellence",
        "issuer": "Technical Certification",
        "year": "2025",
        "description": "Mastery in building modern reactive applications using Svelte, Bun, TypeScript, and microservice APIs.",
        "isDeleted": false
      },
      {
        "id": "ach-2",
        "title": "High-Performance Web Architecture",
        "issuer": "Open Source Community",
        "year": "2025",
        "description": "Engineered sub-millisecond REST APIs with Bun runtime and ElysiaJS with type-safe schema validation.",
        "isDeleted": false
      },
      {
        "id": "ach-3",
        "title": "Database & Realtime Systems",
        "issuer": "PostgreSQL / Supabase",
        "year": "2024",
        "description": "Implemented Row Level Security (RLS), ACID-compliant schemas, and automated backup strategies.",
        "isDeleted": false
      }
    ],
    "skills": [
      {
        "id": "grp-1",
        "category": "Languages & Runtime",
        "items": ["TypeScript", "JavaScript (ESNext)", "Bun Runtime", "HTML5 / Modern CSS", "SQL (PostgreSQL)"],
        "isDeleted": false
      },
      {
        "id": "grp-2",
        "category": "Frontend Engineering",
        "items": ["Svelte 5 (Runes)", "SvelteKit", "Tailwind CSS v4", "Vite", "Responsive Design", "Web Performance"],
        "isDeleted": false
      },
      {
        "id": "grp-3",
        "category": "Backend & APIs",
        "items": ["ElysiaJS", "REST APIs (/api/v1/)", "OpenAPI / Swagger", "TypeBox Validation", "Eden Treaty"],
        "isDeleted": false
      },
      {
        "id": "grp-4",
        "category": "Database & Cloud",
        "items": ["Supabase", "PostgreSQL", "Row Level Security (RLS)", "Supabase Auth", "Git / GitHub"],
        "isDeleted": false
      }
    ],
    "contact": {
      "heading": "Get in Touch",
      "description": "Feel free to reach out for collaborations, questions, or project inquiries.",
      "email": "mhdfirdaus@example.com",
      "formEnabled": true
    },
    "updatedAt": "2026-11-02T05:26:16.875Z"
  }'::jsonb,
  now()
)
on conflict (id) do update set
  content = excluded.content,
  updated_at = now();
