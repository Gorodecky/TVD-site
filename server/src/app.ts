import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { default as pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

const requestLogger = pinoHttp as unknown as (options: { logger: typeof logger }) => express.RequestHandler;

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map(value => value.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger({ logger }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1', apiRouter);
app.use((_req, res) => res.status(404).json({ error: { message: 'Route not found' } }));
app.use(errorHandler);
