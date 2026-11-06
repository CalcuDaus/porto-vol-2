> **BrainSync Context Pumper** 🧠
> Dynamically loaded for active file: `apps\api\.env` (Domain: **Config/Infrastructure**)

### 🔴 Config/Infrastructure Gotchas
- **Surprising bridge detected: guard.ts → service.ts**: A rare connection exists between Domain Cluster undefined and Cluster undefined. This bridge may indicate a hidden dependency or an abstraction leak where logic from two unrelated modules is tightly coupled.
- **Low cohesion detected in Domain Cluster 5**: Cluster 5 (11 nodes) has a very low cohesion score (0.09). This suggests the community is a "spaghetti" module containing unrelated logic that should be separated into cleaner domain boundaries.

### 📐 Config/Infrastructure Conventions & Fixes
- **[discovery] 15 potentially unused files detected**: These files are not imported by any other file in the codebase and may be dead code:
  • api.ts
  • fonts.ts
  • vite-plugin-webp.ts
  • vite.config.ts
  • api.ts
  • chalkaudio.ts
  • consoleeasteregg.ts
  • fonts.ts
  • supabase.ts
  • +server.ts
  • +server.ts
  • vite-plugin-webp.ts
  • vite.config.ts
  • convert-webp.ts
  • vite-plugin-webp.ts

Consider verifying if they are entry points, dynamically required, or can be safely removed.
- **[discovery] 13 potentially unused files detected**: These files are not imported by any other file in the codebase and may be dead code:
  • api.ts
  • fonts.ts
  • vite-plugin-webp.ts
  • vite.config.ts
  • api.ts
  • chalkaudio.ts
  • consoleeasteregg.ts
  • fonts.ts
  • supabase.ts
  • vite-plugin-webp.ts
  • vite.config.ts
  • convert-webp.ts
  • vite-plugin-webp.ts

Consider verifying if they are entry points, dynamically required, or can be safely removed.
- **[convention] 12 potentially unused files detected — confirmed 3x**: These files are not imported by any other file in the codebase and may be dead code:
  • api.ts
  • fonts.ts
  • vite-plugin-webp.ts
  • vite.config.ts
  • api.ts
  • chalkaudio.ts
  • fonts.ts
  • supabase.ts
  • vite-plugin-webp.ts
  • vite.config.ts
  • convert-webp.ts
  • vite-plugin-webp.ts

Consider verifying if they are entry points, dynamically required, or can be safely removed.
- **[what-changed] 🟢 Edited .gitignore (1521 changes, 104min)**: Active editing session on .gitignore.
1521 content changes over 104 minutes.
