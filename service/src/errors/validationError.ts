import { ZodError } from 'zod';
import type { ZodIssue } from 'zod';
import { KnownError } from "./knownError";

export class ValidationError extends KnownError {
  body = undefined;
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  static fromZodError(zodError: ZodError): ValidationError {
    const message = zodError.issues.map((err: ZodIssue) => `${err.path.join('.')} - ${err.message}`).join('; ');
    return new ValidationError(message);
  }
}
