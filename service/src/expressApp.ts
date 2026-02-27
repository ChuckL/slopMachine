import express from 'express';
import { createV1Router } from './v1Router';
import { errorHandler } from './middleware/errorHandler';

export const expressApp = express();

expressApp.use(express.json());

expressApp.use('/api/v1', createV1Router());

expressApp.use(errorHandler);
