import { cliffy } from '../../deps.ts'
import { LINE_FEED, Stderr, Stdout } from '../../util/mod.ts'
import { Styling } from '../mod.ts'
import { createStyles, Styles } from './styling_v2.ts'

export function createLoggerV2(options: {
  stdout: Stdout
  stderr: Stderr
  supportColors: boolean
  verboseEnabled?: boolean
  debugEnabled?: boolean
  now?: () => number
}): LoggerV2 {
  return new LoggerV2Impl({
    ...options,
    now: options.now ?? Date.now,
  })
}

export interface LoggerV2 {
  readonly colors: Styles

  stdout(options?: {
    verbose?: boolean
    debug?: boolean
    timestamp?: boolean
  }): LogBuilder

  stderr(options?: {
    verbose?: boolean
    debug?: boolean
    timestamp?: boolean
  }): LogBuilder
}

export interface LogBuilder {
  timestamp(): LogBuilder
  package(name: string): LogBuilder
  indent(): LogBuilder
  childArrow(): LogBuilder
  push(text: string | ((styles: Styles) => string)): LogBuilder
  pushCharCode(...args: number[]): LogBuilder
  lineFeed(): void
}

class LoggerV2Impl implements LoggerV2 {
  constructor(options: {
    stdout: Stdout
    stderr: Stderr
    supportColors: boolean
    verboseEnabled?: boolean
    debugEnabled?: boolean
    now: () => number
  }) {
    this.colors = createStyles(options)
    this.#stdout = options.stdout
    this.#stderr = options.stderr
    this.#verboseEnabled = options.verboseEnabled ?? false
    this.#debugEnabled = options.debugEnabled ?? false
    this.#now = options.now
    this.#startAt = options.now()
  }

  #stdout: Stdout
  #stderr: Stderr
  #verboseEnabled: boolean
  #debugEnabled: boolean
  #now: () => number
  #startAt: number

  readonly colors: Styles

  stdout(
    options?: {
      verbose?: boolean
      debug?: boolean
      timestamp?: boolean
    },
  ): LogBuilder {
    return this.#builder(this.#stdout, options)
  }

  stderr(
    options?: {
      verbose?: boolean
      debug?: boolean
      timestamp?: boolean
    },
  ): LogBuilder {
    return this.#builder(this.#stderr, {
      ...options,
      defaultStyling: this.colors.magenta,
    })
  }

  #builder(
    stream: Deno.WriterSync,
    options: {
      verbose?: boolean
      debug?: boolean
      timestamp?: boolean
      defaultStyling?: Styling
    } | undefined,
  ): LogBuilder {
    const builder = this.#enabled(options)
      ? new LogBuilderImpl({
        stream: stream,
        now: this.#now,
        startAt: this.#startAt,
        styles: this.colors,
        defaultStyling: options?.defaultStyling,
        timestamp: false,
        package: undefined,
        indent: 0,
        childArrow: false,
        buffer: '',
      })
      : VoidLogBuilder.instance
    if (options?.timestamp) {
      return builder.timestamp()
    } else {
      return builder
    }
  }

  #enabled(
    options: { verbose?: boolean; debug?: boolean } | undefined,
  ): boolean {
    if (
      !options ||
      (!options.verbose && !options.debug) ||
      (options.verbose && this.#verboseEnabled) ||
      (options.debug && this.#debugEnabled)
    ) {
      return true
    } else {
      return false
    }
  }
}

class VoidLogBuilder implements LogBuilder {
  static readonly instance = new VoidLogBuilder()

  timestamp(): LogBuilder {
    return this
  }

  package(_: string): LogBuilder {
    return this
  }

  indent(): LogBuilder {
    return this
  }

  childArrow(): LogBuilder {
    return this
  }

  push(_: string | ((styles: Styles) => string)): LogBuilder {
    return this
  }

  pushCharCode(..._: number[]): LogBuilder {
    return this
  }

  lineFeed(): void {}
}

class LogBuilderImpl implements LogBuilder {
  constructor(
    private readonly options: {
      readonly stream: Deno.WriterSync
      readonly now: () => number
      readonly startAt: number
      readonly styles: Styles
      readonly defaultStyling: Styling | undefined
      readonly timestamp: boolean
      readonly package: string | undefined
      readonly indent: number
      readonly childArrow: boolean
      readonly buffer: string
    },
  ) {}

  timestamp(): LogBuilder {
    return this.options.timestamp
      ? this
      : new LogBuilderImpl({ ...this.options, timestamp: true })
  }

  package(name: string): LogBuilder {
    return this.options.package === name
      ? this
      : new LogBuilderImpl({ ...this.options, package: name })
  }

  indent(): LogBuilder {
    return new LogBuilderImpl({
      ...this.options,
      indent: this.options.indent + 1,
    })
  }

  childArrow(): LogBuilder {
    return this.options.childArrow
      ? this
      : new LogBuilderImpl({ ...this.options, childArrow: true })
  }

  push(text: string | ((styles: Styles) => string)): LogBuilder {
    if (typeof text === 'string') {
      return new LogBuilderImpl({
        ...this.options,
        buffer: this.options.buffer + this.#defaultStyling(text),
      })
    } else {
      return new LogBuilderImpl({
        ...this.options,
        buffer: this.options.buffer + text(this.#styles),
      })
    }
  }

  pushCharCode(...args: number[]): LogBuilder {
    const chars = args.map((c) => String.fromCharCode(c)).join('')
    return this.push(chars)
  }

  lineFeed() {
    const segments = []

    if (this.options.timestamp) {
      segments.push(
        this.#styles.gray.bold(
          `[${timestamp(this.options.now() - this.options.startAt)}]`,
        ),
      )
    }

    if (this.options.package) {
      const packageName = this.#styles.brightYellow.bold(this.options.package)
      segments.push(`[${packageName}]`)
    }

    if (this.options.indent > 0) {
      if (this.options.indent > 1) {
        segments.push('  '.repeat(this.options.indent - 1))
      }
      segments.push(' ')
    }

    if (this.options.childArrow) {
      segments.push(this.#styles.brightGreen.bold(
        `${cliffy.table.border.bottomLeft}>`,
      ))
    }

    segments.push(this.options.buffer)

    this.#printLine(segments)
  }

  get #styles(): Styles {
    return this.options.styles
  }

  #printLine(text: string[]): void {
    this.options.stream.writeSync(
      textEncoder.encode(text.join(' ') + LINE_FEED),
    )
  }

  #defaultStyling(text: string): string {
    return this.options.defaultStyling?.(text) ?? text
  }
}

const textEncoder = new TextEncoder()

function timestamp(elapsedMillis: number): string {
  const buffer = []
  let elapsedSeconds = elapsedMillis / 1000.0
  const elapsedMinutes = Math.floor(elapsedSeconds / 60.0)
  elapsedSeconds -= elapsedMinutes * 60.0
  if (elapsedMinutes > 0) {
    buffer.push(String(elapsedMinutes % 60), 'm ')
  }
  buffer.push(
    elapsedSeconds.toFixed(3).padStart(elapsedMinutes > 0 ? 6 : 1, '0'),
    's',
  )
  return buffer.join('').padStart(11)
}
