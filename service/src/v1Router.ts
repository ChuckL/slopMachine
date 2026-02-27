import { Router } from 'express';
import { createHealthRouter } from './features/health/health.routes';

export function createV1Router(): Router {
  const router = Router();

  router.use('/health', createHealthRouter());

  return router;
}
