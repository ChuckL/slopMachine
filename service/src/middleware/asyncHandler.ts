import { Request, Response } from 'express';
import { AbstractInteractor } from '../features/abstractInteractor';
import { isKnownError } from '../errors/knownError';

export function asyncExpressHandler(interactor: AbstractInteractor) {
  return async (req: Request, res: Response) => {
    try {
      const unvalidatedInput = aggregateInteractorInput(req);
      const validatedInput = interactor.validateInput(unvalidatedInput);
      const result = await interactor.with(validatedInput);
      res.json(result);
    } catch (error) {
      let status = 500;
      let message: string = 'Internal Server Error';
      let body: object & {message: string} | undefined;

      if (isKnownError(error)) {
        status = error.status || 500;
        message = error.message || 'Internal Server Error';
        body = error.body || undefined;
      } else if (error instanceof Error) {
        message = error.message;
      }

      res.status(status).json( body || { message });
    }
  };
}

function aggregateInteractorInput(req: Request): unknown {
  return {
    ...req.body,
    ...req.params,
    ...req.query,
  };
}