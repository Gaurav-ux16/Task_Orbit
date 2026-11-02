import dotenv from 'dotenv';

dotenv.config();

const { default: app } = await import('./src/app.js');
const { usingMockDatabase } = await import('./src/config/supabase.js');
const { assertProductionConfig } = await import('./src/config/env.js');

assertProductionConfig(usingMockDatabase());

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[TaskOrbit API] Running on http://localhost:${PORT}`);
  console.log(`[TaskOrbit API] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('[TaskOrbit API] Authentication: server-side sessions (HttpOnly cookie) + CSRF token');
  if (usingMockDatabase()) {
    console.log('[TaskOrbit API] Database: in-memory demo store (data resets on restart)');
  }
});
