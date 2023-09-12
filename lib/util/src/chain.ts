export class Chain<T> {
  private constructor(value: T) {
    this.#value = value
  }

  static of<T>(value: T): Chain<T> {
    return new Chain(value)
  }

  static ofNullable<T>(value: T | null | undefined): Chain<T | undefined> {
    return new Chain(value === null || value === undefined ? undefined : value)
  }

  static with<T>(fn: () => T): Chain<T> {
    return new Chain(fn())
  }

  static empty(): Chain<void> {
    return new Chain(undefined)
  }

  readonly #value: T

  public get value(): T {
    return this.#value
  }

  public tap(fn: (value: T) => void): Chain<T> {
    fn(this.#value)
    return this
  }

  public map<R>(fn: (value: T) => R): Chain<R> {
    return new Chain(fn(this.#value))
  }

  public flatMap<R>(fn: (value: T) => Chain<R>): Chain<R> {
    return fn(this.#value)
  }

  public toAsync(): AsyncChain<T> {
    return AsyncChain.of(Promise.resolve(this.#value))
  }

  public mapAsync<R>(fn: (value: T) => R | Promise<R>): AsyncChain<R> {
    return AsyncChain.of(Promise.resolve(fn(this.#value)))
  }

  public flatMapAsync<R>(fn: (value: T) => AsyncChain<R>): AsyncChain<R> {
    return fn(this.#value)
  }
}

export class AsyncChain<T> {
  private constructor(promise: Promise<T>) {
    this.#promise = promise
  }

  readonly #promise: Promise<T>

  public static of<T>(promise: Promise<T>): AsyncChain<T> {
    return new AsyncChain(promise)
  }

  public static ofNullable<T>(
    promise: Promise<T | null | undefined>,
  ): AsyncChain<T | undefined> {
    return new AsyncChain(
      promise.then((value) =>
        value === null || value === undefined ? undefined : value
      ),
    )
  }

  public static with<T>(fn: () => Promise<T>): AsyncChain<T> {
    return new AsyncChain(fn())
  }

  public static empty(): AsyncChain<void> {
    return new AsyncChain(Promise.resolve())
  }

  public get promise(): Promise<T> {
    return this.#promise
  }

  public tapAsync(fn: (value: T) => void | Promise<void>): AsyncChain<T> {
    return new AsyncChain(this.#promise.then(async (value) => {
      const voidOrPromise = fn(value)
      if (voidOrPromise) {
        await voidOrPromise
      }
      return value
    }))
  }

  public mapAsync<R>(fn: (value: T) => R | Promise<R>): AsyncChain<R> {
    return new AsyncChain(this.#promise.then(fn))
  }

  public flatMapAsync<R>(fn: (value: T) => AsyncChain<R>): AsyncChain<R> {
    return new AsyncChain(this.#promise.then((value) => fn(value).#promise))
  }
}