import dotenv from 'dotenv';
import app from './src/app.js';
import { ensureDatabaseRunning } from './src/config/db-bootstrap.js';
import { autoSeedIfEmpty } from './src/config/auto-seed.js';

import { initRealtimeService } from './src/services/realtime.service.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  await ensureDatabaseRunning();
  await autoSeedIfEmpty();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Miraya Backend Server is running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  });

  // Attach Socket.IO Realtime Engine
  initRealtimeService(server);
  console.log('⚡ [Realtime] Socket.IO Realtime Engine attached to HTTP server.');


  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${PORT} in use, retrying in 1.5s...`);
      setTimeout(() => {
        try { server.close(); } catch (_) {}
        server.listen(PORT);
      }, 1500);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();

