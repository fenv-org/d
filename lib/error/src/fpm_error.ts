/** An `fpm`-specific error class. */
export class FpmError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}
