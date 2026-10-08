import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '../config/logger.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  void next;
  if (error instanceof ZodError) {
    res.status(400).json({ error: { message: 'Validation failed', details: error.issues } });
    return;
  }
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') { res.status(409).json({ error: { message: 'A record with this value already exists' } }); return; }
    if (error.code === 'P2025') { res.status(404).json({ error: { message: 'Record not found' } }); return; }
    if (error.code === 'P2003') { res.status(400).json({ error: { message: 'Referenced record does not exist' } }); return; }
  }
  logger.error({ err: error }, 'Unhandled request error');
  res.status(500).json({ error: { message: 'Internal server error' } });
};
