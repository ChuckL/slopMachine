import serverlessExpress from '@codegenie/serverless-express';
import { expressApp } from './expressApp';

export const handler = serverlessExpress({ app: expressApp });
