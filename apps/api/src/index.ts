import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { env } from './config/env';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profile';
import { projectRoutes } from './routes/projects';
import { contactRoutes } from './routes/contact';
import { achievementRoutes } from './routes/achievements';
import { contentRoutes } from './routes/content';

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true
  }))
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'Portfolio API (Bun + Elysia + Supabase)',
        version: '1.0.0',
        description: 'Chalkboard portfolio backend with full CMS dashboard capability and secure authentication.'
      },
      tags: [
        { name: 'Auth', description: 'Admin authentication, token verification, and security' },
        { name: 'Health', description: 'System health & diagnostic endpoints' },
        { name: 'Content', description: 'Dynamic site content & font management for dashboard' },
        { name: 'Profile', description: 'Portfolio owner profile & bio' },
        { name: 'Projects', description: 'Showcase projects management' },
        { name: 'Achievements', description: 'Honors, awards and certifications' },
        { name: 'Contact', description: 'Direct contact form submission' }
      ]
    }
  }))
  // API v1 grouping
  .group('/api/v1', (app) =>
    app
      .use(authRoutes)
      .use(healthRoutes)
      .use(contentRoutes)
      .use(profileRoutes)
      .use(projectRoutes)
      .use(achievementRoutes)
      .use(contactRoutes)
  )
  .get('/', () => ({
    message: 'Welcome to Mhd Firdaus Portfolio API! Visit /swagger for OpenAPI docs or /api/v1/health for status.',
    docs: '/swagger',
    health: '/api/v1/health'
  }))
  .listen(env.PORT);

console.log(`🚀 [Elysia] API is running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`📑 [Swagger] Documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`);

export type App = typeof app;
export default app;
