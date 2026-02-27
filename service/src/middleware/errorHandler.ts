import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const status = err instanceof Error && 'status' in err && typeof err.status === 'number'
    ? err.status
    : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';

  res.status(status).json({
    data: null,
    error: { code: String(status), message },
  });
}
