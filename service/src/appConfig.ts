import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['dev', 'prod']).default('dev'),
});

const env = envSchema.parse(process.env);

export type AppConfig = {
  port: number;
  nodeEnv: 'dev' | 'prod';
};

export const appConfig: AppConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
};
