/**
 * AbstractInteractor used for core business logic. Interactors should be used
 * by routes to perform actions and return data.
 */
export abstract class AbstractInteractor<InteractorInput = unknown, InteractorOutput = void | object> {

  /**
   * Main method to execute the interactor's logic.
   * @param input Interactor input, should be validated before calling this method.
   * @returns Interactor output, can be void if no output is needed.
   */
  abstract with(input: InteractorInput): InteractorOutput | Promise<InteractorOutput>;

  /**
   * Parses and validates input using the interactor's Zod schema.
   * Throws a ValidationError if validation fails.
   */
  abstract validateInput(input: unknown): InteractorInput;
}
