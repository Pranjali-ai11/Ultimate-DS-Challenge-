import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { initDatabase } from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const trustedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: trustedOrigins, credentials: true }));
app.use(express.json({ limit: '32kb' }));

// API routes
app.use('/api', apiRouter);

// Serve static build from client/dist if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root fallback
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to ULTIMATE DS CHALLENGE API',
      tagline: 'Can You Design the Impossible?',
      health: '/api/health',
      challenges: '/api/challenges'
    });
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.'
  });
});

// Initialize database & start server
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters before starting the server.');
  }
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 ULTIMATE DS CHALLENGE Server listening on http://localhost:${PORT} (MySQL)`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown startup error';
    console.error(`Server startup stopped: ${message}`);
    process.exitCode = 1;
  }
}

start();
