# 🚀 Portfolio Full-Stack Starter

Starter project modern untuk portofolio yang dibangun dengan performa tinggi menggunakan:
- 🍞 **Bun**: Runtime JavaScript & package manager ultra-cepat
- ⚡ **Svelte 5**: Modern reactive frontend dengan fitur Runes (`$state`, `$derived`, `$effect`) & Tailwind CSS v4
- 📘 **TypeScript**: Type-safety end-to-end dari backend kontrak hingga UI frontend
- 🦊 **ElysiaJS**: Web backend framework ergonomis & secepat kilat untuk Bun dengan native OpenAPI / Swagger
- ⚡ **Supabase**: PostgreSQL database, Row-Level-Security (RLS), Auth, dan realtime storage

---

## 📁 Struktur Monorepo

```text
porto-vol-2/
├── apps/
│   ├── api/                     # Backend Service (Bun + ElysiaJS + Supabase)
│   │   ├── src/
│   │   │   ├── config/          # Environment & Supabase Client
│   │   │   ├── routes/          # REST API Endpoints (/api/v1/)
│   │   │   │   ├── health.ts    # Health check & system telemetry
│   │   │   │   ├── profile.ts   # Bio, contacts, and skills
│   │   │   │   ├── projects.ts  # CRUD & soft delete endpoints
│   │   │   │   └── contact.ts   # Form submission handler
│   │   │   ├── types/           # Type definitions (strict TypeScript)
│   │   │   └── index.ts         # Elysia Server + CORS + Swagger
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                     # Frontend App (SvelteKit + Svelte 5 + Tailwind v4)
│       ├── src/
│       │   ├── lib/             # API client, Supabase client & types
│       │   └── routes/          # Svelte 5 pages & layouts
│       ├── .env.example
│       ├── package.json
│       └── vite.config.ts       # Vite proxy ke Elysia (:3001)
│
├── supabase/
│   └── schema.sql               # Script DDL SQL untuk database Supabase
├── package.json                 # Bun Workspaces Root
└── README.md
```

---

## ⚡ Cara Menjalankan Project

### 1. Install Dependencies
Semua dependensi terhubung via Bun workspaces. Dari root folder:
```bash
bun install
```

### 2. Jalankan Dev Server (Frontend & Backend Bersamaan)
```bash
bun run dev
```
Perintah ini akan menjalankan:
- **Frontend Svelte 5**: `http://localhost:5173`
- **Backend ElysiaJS**: `http://localhost:3001`
- **Interactive Swagger Docs**: `http://localhost:3001/swagger`

> **Note**: Anda juga bisa menjalankan secara terpisah:
> - Frontend saja: `bun run dev:web`
> - Backend API saja: `bun run dev:api`

---

## 🗄️ Menghubungkan Supabase (Opsional tapi Direkomendasikan)

Project ini **sudah bisa langsung jalan tanpa Supabase** (menggunakan mock data otomatis di backend memory). 

Ketika Anda siap menghubungkan database Supabase Anda:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Buka menu **SQL Editor**, buka file `supabase/schema.sql`, salin isinya dan klik **Run**.
3. Di Supabase Project Settings -> **API**, salin **Project URL** dan **anon public key**.
4. Buka file `apps/api/.env` dan isi:
   ```env
   PORT=3001
   CLIENT_URL=http://localhost:5173
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Buka file `apps/web/.env` dan isi:
   ```env
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   PUBLIC_API_URL=http://localhost:3001
   ```
6. Restart dev server (`bun run dev`). Indikator di header dan status card akan otomatis berubah menjadi **Supabase Connected**!

---

## 🛠️ Endpoint API (v1)

Semua endpoint backend mengikuti konvensi `/api/v1/`:
- `GET  /api/v1/health` - Cek koneksi server, runtime Bun, dan status Supabase.
- `GET  /api/v1/profile` - Data profil portofolio (bio, role, avatar, social media).
- `GET  /api/v1/projects` - List project aktif.
- `POST /api/v1/projects` - Tambah project baru.
- `DELETE /api/v1/projects/:id` - Soft delete project.
- `POST /api/v1/contact` - Kirim pesan dari form kontak ke backend & Supabase.
- `GET  /swagger` - Interactive Swagger OpenAPI playground.

---

## 📜 Script Tersedia

| Command | Fungsi |
|---|---|
| `bun run dev` | Menjalankan frontend & backend secara paralel |
| `bun run dev:web` | Menjalankan Vite dev server untuk Svelte 5 saja |
| `bun run dev:api` | Menjalankan Elysia API server dengan hot reload |
| `bun run build` | Melakukan build produksi untuk semua aplikasi |
| `bun run check` | Menjalankan pemeriksaan type checking TypeScript & Svelte |

