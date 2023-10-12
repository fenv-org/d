import { cliffy } from 'deps.ts'
import { LINE_FEED, Stderr, Stdout } from 'util/mod.ts'
import { Styling } from '../mod.ts'
import { createStyles, Styles } from './styling.ts'

export function createLogger(options: {
  stdout: Stdout
  stderr: Stderr
  supportColors: boolean
  verboseEnabled?: boolean
  debugEnabled?: boolean
  now?: () => number
  dLogTime?: number
}): Logger {
  return new LoggerV2Impl({
    ...options,
    now: options.now ?? Date.now,
  })
}

export interface Logger {
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
  indent(count?: number): LogBuilder
  childArrow(): LogBuilder
  command(command: string, options?: { withDollarSign: boolean }): LogBuilder
  label(l: LogLabel): LogBuilder
  push(text: string | ((styles: Styles) => string)): LogBuilder
  pushCharCode(...args: number[]): LogBuilder
  lineFeed(): void
}

export type LogLabel = (s: Styles) => string
export const logLabels = {
  error: (s: Styles) => s.red.bold('ERROR'),
  warning: (s: Styles) => s.bgRed('WARNING'),
}

class LoggerV2Impl implements Logger {
  constructor(options: {
    stdout: Stdout
    stderr: Stderr
    supportColors: boolean
    verboseEnabled?: boolean
    debugEnabled?: boolean
    dLogTime?: number
    now: () => number
  }) {
    this.colors = createStyles(options)
    this.#stdout = options.stdout
    this.#stderr = options.stderr
    this.#verboseEnabled = options.verboseEnabled ?? false
    this.#debugEnabled = options.debugEnabled ?? false
    this.#now = options.now
    this.#startAt = options.now()
    this.#dLogTime = options.dLogTime
  }

  #stdout: Stdout
  #stderr: Stderr
  #verboseEnabled: boolean
  #debugEnabled: boolean
  #now: () => number
  #startAt: number
  #dLogTime?: number

  readonly colors: Styles

  stdout(
    options?: {
      verbose?: boolean
      debug?: boolean
      timestamp?: boolean
    },
  ): LogBuilder {
    return this.#builder(this.#stdout, {
      ...options,
      timestampEnabled: this.#dLogTime !== 0,
    })
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
      timestampEnabled: this.#dLogTime !== 0,
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
      timestampEnabled: boolean
    } | undefined,
  ): LogBuilder {
    const builder = this.#enabled(options)
      ? new LogBuilderImpl({
        stream: stream,
        now: this.#now,
        startAt: this.#startAt,
        styles: this.colors,
        defaultStyling: options?.defaultStyling,
        timestamp:
          options?.timestampEnabled && (options?.verbose || options?.debug)
            ? false
            : undefined,
        package: undefined,
        indent: 0,
        childArrow: false,
        command: undefined,
        buffer: '',
        _label: undefined,
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

  indent(_?: number): LogBuilder {
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

  command(_: string, __?: { withDollarSign: boolean }): LogBuilder {
    return this
  }

  lineFeed(): void {}

  label(_: LogLabel): LogBuilder {
    return this
  }
}

class LogBuilderImpl implements LogBuilder {
  constructor(
    private readonly options: {
      readonly stream: Deno.WriterSync
      readonly now: () => number
      readonly startAt: number
      readonly styles: Styles
      readonly defaultStyling: Styling | undefined
      /**
       * `undefined` means that `timestamp` is not available.
       */
      readonly timestamp: boolean | undefined
      readonly package: string | undefined
      readonly indent: number
      readonly childArrow: boolean
      readonly command: string | undefined
      readonly buffer: string
      readonly _label: LogLabel | undefined
    },
  ) {}

  timestamp(): LogBuilder {
    if (this.options.timestamp === undefined) {
      return this
    }

    return this.options.timestamp
      ? this
      : new LogBuilderImpl({ ...this.options, timestamp: true })
  }

  package(name: string): LogBuilder {
    return this.options.package === name
      ? this
      : new LogBuilderImpl({ ...this.options, package: name })
  }

  indent(count?: number): LogBuilder {
    const _count = Math.max(count ?? 1, 1)
    return new LogBuilderImpl({
      ...this.options,
      indent: this.options.indent + _count,
    })
  }

  childArrow(): LogBuilder {
    return this.options.childArrow
      ? this
      : new LogBuilderImpl({ ...this.options, childArrow: true })
  }

  command(command: string, options?: { withDollarSign: boolean }): LogBuilder {
    const buffer: string[] = []
    if (options?.withDollarSign) {
      buffer.push(this.#styles.brightYellow('$ '))
    }
    buffer.push(this.#styles.brightYellow.bold(command))
    const s = buffer.join('')
    if (this.options.command === s) {
      return this
    } else {
      return new LogBuilderImpl({
        ...this.options,
        command: s,
      })
    }
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

  label(l: LogLabel): LogBuilder {
    return this.options._label === l ? this : new LogBuilderImpl({
      ...this.options,
      _label: l,
    })
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
      const packageName = this.#styles.blue.bold(this.options.package)
      segments.push(`[${packageName}]`)
    }

    if (this.options._label) {
      segments.push(`${this.options._label(this.#styles)}:`)
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

    if (this.options.command) {
      segments.push(this.options.command)
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
