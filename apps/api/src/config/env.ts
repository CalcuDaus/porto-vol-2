export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3002,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'FirdausChalkboard#2026!',
  AUTH_SECRET: process.env.AUTH_SECRET || 'chalkboard-portfolio-super-secure-hmac-token-secret-2026'
};
