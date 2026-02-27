const knownErrorIdentifier = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';


export abstract class KnownError extends Error {
  readonly knownError = knownErrorIdentifier;
  abstract status: number;
  abstract body: object & {message: string} | undefined;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, KnownError.prototype);
  }
}

export function isKnownError(error: unknown): error is KnownError {
  return error instanceof Error && 'knownError' in error && error.knownError === knownErrorIdentifier;
}
