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

  static empty<T>(): Chain<T | undefined> {
    return Chain.ofNullable<T>(undefined)
  }

  static flatten<T>(chain: Chain<Chain<T>>): Chain<T> {
    return chain.flatMap((it) => it)
  }

  readonly #value: T

  public get value(): T {
    return this.#value
  }

  public tap(fn: (value: T) => unknown): Chain<T> {
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
    return this.toAsync().mapAsync(fn)
  }

  public flatMapAsync<R>(
    fn: (
      value: T,
    ) => AsyncChain<R> | Chain<R> | Promise<AsyncChain<R> | Chain<R>>,
  ): AsyncChain<R> {
    return this.toAsync().flatMapAsync(fn)
  }
}

export class AsyncChain<T> {
  private constructor(promise: Promise<T>) {
    this.#promise = promise
  }

  readonly #promise: Promise<T>

  public static of<T>(promise: Promise<T> | T): AsyncChain<T> {
    return new AsyncChain(
      promise instanceof Promise ? promise : Promise.resolve(promise),
    )
  }

  public static ofNullable<T>(
    promise: Promise<T | null | undefined> | T | null | undefined,
  ): AsyncChain<T | undefined> {
    return new AsyncChain(
      promise instanceof Promise
        ? promise.then((value) =>
          value === null || value === undefined ? undefined : value
        )
        : promise === null || promise === undefined
        ? Promise.resolve(undefined)
        : Promise.resolve(promise),
    )
  }

  public static with<T>(fn: () => Promise<T> | T): AsyncChain<T> {
    return AsyncChain.of(fn())
  }

  public static empty<T>(): AsyncChain<T | undefined> {
    return AsyncChain.ofNullable<T>(undefined)
  }

  public static flatten<T>(
    chain:
      | AsyncChain<AsyncChain<T>>
      | Chain<AsyncChain<T>>
      | AsyncChain<Chain<T>>,
  ): AsyncChain<T> {
    return chain.flatMapAsync((it) => it)
  }

  public get promise(): Promise<T> {
    return this.#promise
  }

  public tapAsync(fn: (value: T) => unknown | Promise<unknown>): AsyncChain<T> {
    return new AsyncChain(this.#promise.then(async (value) => {
      const voidOrPromise = fn(value)
      if (voidOrPromise instanceof Promise) {
        await voidOrPromise
      }
      return value
    }))
  }

  public mapAsync<R>(fn: (value: T) => R | Promise<R>): AsyncChain<R> {
    return new AsyncChain(this.#promise.then(fn))
  }

  public flatMapAsync<R>(
    fn: (
      value: T,
    ) => AsyncChain<R> | Chain<R> | Promise<AsyncChain<R> | Chain<R>>,
  ): AsyncChain<R> {
    return new AsyncChain(this.#promise.then(
      async (it) => {
        const resultOrPromise = fn(it)
        if (resultOrPromise instanceof Chain) {
          return resultOrPromise.value
        } else if (resultOrPromise instanceof Promise) {
          const result = await resultOrPromise
          if (result instanceof Chain) {
            return result.value
          }
          return result.#promise
        } else {
          return resultOrPromise.#promise
        }
      },
    ))
  }
}
