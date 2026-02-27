import { Router } from 'express';
import { asyncExpressHandler } from '../../middleware/asyncHandler';
import { StatusInteractor } from './status.interactor';
import { appConfig } from '../../appConfig';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/status', asyncExpressHandler(new StatusInteractor(appConfig)));

  return router;
}
