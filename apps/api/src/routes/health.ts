import { Elysia } from 'elysia';
import { createSuccessResponse } from '../types/api';
import { isSupabaseConfigured } from '../config/supabase';

export const healthRoutes = new Elysia({ prefix: '/health' })
  .get('/', () => {
    return createSuccessResponse({
      status: 'healthy',
      uptime: process.uptime(),
      runtime: `Bun ${Bun.version}`,
      supabaseConnected: isSupabaseConfigured,
      environment: process.env.NODE_ENV || 'development'
    }, 'Service is operational');
  });

