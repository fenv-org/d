/** An `fpm`-specific error class. */
export class DError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}
