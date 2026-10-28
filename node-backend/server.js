import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[TaskOrbit API] Running on http://localhost:${PORT}`);
  console.log(`[TaskOrbit API] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('[TaskOrbit API] ⚠️  Using DEV identity fixture — not production auth');
});
