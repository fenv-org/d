import { cliffy } from '../../deps.ts'
import { LINE_FEED } from '../../util/mod.ts'
import { Ansi } from './ansi.ts'

export abstract class Logger {
  static standard(options: {
    stdout: Deno.Writer & Deno.WriterSync
    stderr: Deno.Writer & Deno.WriterSync
    debug: boolean
    colorSupported?: boolean
  }): Logger {
    return new StandardLogger({
      ...options,
      ansi: Ansi(cliffy.ansi.colors, options.colorSupported ?? false),
    })
  }

  static verbose(options: {
    stdout: Deno.Writer & Deno.WriterSync
    stderr: Deno.Writer & Deno.WriterSync
    logTime?: boolean
    debug: boolean
    colorSupported?: boolean
  }): Logger {
    return new VerboseLogger({
      ...options,
      ansi: Ansi(cliffy.ansi.colors, options.colorSupported ?? false),
      logTime: options?.logTime ?? true,
    })
  }

  public abstract get ansi(): Ansi

  public abstract get isVerbose(): boolean

  public abstract get isDebug(): boolean

  /** Print an error message. */
  public abstract stderr(message: string, options?: { prefix?: boolean }): void

  /** Print a standard status message. */
  public abstract stdout(message: string, options?: { prefix?: boolean }): void

  /** Print text to stdout, without a trailing newline. */
  public abstract write(message: string, options?: { prefix?: boolean }): void

  /** Print a character code to stdout, without a trailing newline. */
  public abstract writeCharCode(charCode: number): void

  public abstract horizontalLine(): void
}

class StandardLogger implements Logger {
  constructor(
    options: {
      stdout: Deno.Writer & Deno.WriterSync
      stderr: Deno.Writer & Deno.WriterSync
      ansi: Ansi
      debug?: boolean
    },
  ) {
    this.#stdout = options.stdout
    this.#stderr = options.stderr
    this.#debug = options?.debug ?? false
    this.#ansi = options.ansi
  }

  readonly #stdout: Deno.Writer & Deno.WriterSync
  readonly #stderr: Deno.Writer & Deno.WriterSync
  readonly #ansi: Ansi
  readonly #debug: boolean

  public get ansi(): Ansi {
    return this.#ansi
  }

  public get isVerbose(): boolean {
    return false
  }

  public get isDebug(): boolean {
    return this.#debug
  }

  public stderr(message: string): void {
    writeLine(this.#stderr, message)
  }

  public stdout(message: string): void {
    writeLine(this.#stdout, message)
  }

  public write(message: string): void {
    write(this.#stdout, message)
  }

  public writeCharCode(charCode: number): void {
    this.write(String.fromCharCode(charCode))
  }

  public horizontalLine(): void {
    this.stdout('─'.repeat(consoleWidth()))
  }
}

class VerboseLogger implements Logger {
  constructor(options: {
    stdout: Deno.Writer & Deno.WriterSync
    stderr: Deno.Writer & Deno.WriterSync
    ansi: Ansi
    logTime?: boolean
    debug: boolean
  }) {
    this.#stdout = options.stdout
    this.#stderr = options.stderr
    this.#ansi = options.ansi
    this.#debug = options.debug
    this.#logTime = options.logTime ?? false
  }

  readonly #stdout: Deno.Writer & Deno.WriterSync
  readonly #stderr: Deno.Writer & Deno.WriterSync
  readonly #startTime = new Date().getTime()
  readonly #ansi: Ansi
  readonly #debug: boolean
  readonly #logTime: boolean

  public get ansi(): Ansi {
    return this.#ansi
  }

  public get isVerbose(): boolean {
    return true
  }

  public get isDebug(): boolean {
    return this.#debug
  }

  public stdout(message: string, options?: { prefix?: boolean }): void {
    const { prefix = true } = options ?? {}
    if (prefix) {
      writeLine(this.#stdout, this._createPrefix() + message)
    } else {
      writeLine(this.#stdout, message)
    }
  }

  public stderr(message: string, options?: { prefix?: boolean }): void {
    const { prefix = true } = options ?? {}
    if (prefix) {
      writeLine(this.#stderr, this._createPrefix() + message)
    } else {
      writeLine(this.#stderr, message)
    }
  }

  public write(message: string, options?: { prefix?: boolean }): void {
    const { prefix = true } = options ?? {}
    if (prefix) {
      write(this.#stdout, this._createPrefix() + message)
    } else {
      write(this.#stdout, message)
    }
  }

  public writeCharCode(charCode: number): void {
    this.write(String.fromCharCode(charCode), { prefix: false })
  }

  public horizontalLine(): void {
    this.stdout('─'.repeat(consoleWidth()))
  }

  private _createPrefix(): string {
    if (!this.#logTime) {
      return ''
    }

    const now = new Date().getTime()
    let elapsedSeconds = (now - this.#startTime) / 1000.0
    const elapsedMinutes = Math.floor(elapsedSeconds / 60.0)
    elapsedSeconds -= elapsedMinutes * 60.0

    const buffer = []
    if (elapsedMinutes > 0) {
      buffer.push(String(elapsedMinutes % 60), 'm ')
    }
    buffer.push(
      elapsedSeconds.toFixed(3).padStart(elapsedMinutes > 0 ? 6 : 1, '0'),
      's',
    )
    return `[${buffer.join('').padStart(11)}] `
  }
}

class DelegateLogger implements Logger {
  constructor(readonly logger: Logger) {}

  public get ansi(): Ansi {
    return this.logger.ansi
  }

  public get isVerbose(): boolean {
    return this.logger.isVerbose
  }

  public get isDebug(): boolean {
    return this.logger.isDebug
  }

  public stderr(message: string, options?: { prefix?: boolean }): void {
    this.logger.stderr(message, options)
  }

  public stdout(message: string, options?: { prefix?: boolean }): void {
    this.logger.stdout(message, options)
  }

  public write(message: string, options?: { prefix?: boolean }): void {
    this.logger.write(message, options)
  }

  public writeCharCode(charCode: number): void {
    this.logger.writeCharCode(charCode)
  }

  public horizontalLine(): void {
    this.logger.horizontalLine()
  }
}

export class DLogger extends DelegateLogger {
  constructor(logger: Logger, options?: {
    indentation?: string
    childIndentation?: string
  }) {
    super(logger)
    this._indentation = options?.indentation ?? ''
    this._childIndentation = options?.childIndentation ?? '  '
  }

  private readonly _indentation: string
  private readonly _childIndentation: string

  public verbose(message: string): void {
    if (this.isVerbose) {
      this.stdout(this.ansi.style.verbose(message))
    }
  }

  public debug(message: string): void {
    if (this.isDebug) {
      this.stderr(this.ansi.style.debug(message))
    }
  }

  public log(message: string): void {
    this.stdout(message)
  }

  public command(
    command: string,
    options?: { withDollarSign?: boolean /* default: false */ },
  ) {
    const ansi = this.ansi
    if (options?.withDollarSign) {
      this.stdout(
        `${ansi.color.command('$')} ${ansi.style.command(command)}`,
      )
    } else {
      this.stdout(ansi.style.command(command))
    }
  }

  public success(
    message: string,
    options?: { dryRun?: boolean /* default: false */ },
  ): void {
    const ansi = this.ansi
    if (options?.dryRun) {
      this.stdout(ansi.color.successMessage(message))
    } else {
      this.stdout(ansi.color.successMessage(ansi.style.success(message)))
    }
  }

  public warning(
    message: string,
    options?: {
      label?: boolean /* default: true */
      dryRun?: boolean /* default: false */
    },
  ): void {
    const ansi = this.ansi
    const labelColor = options?.dryRun
      ? ansi.color.dryRunWarningLabel
      : ansi.color.dryRunWarningMessage
    const messageColor = options?.dryRun
      ? ansi.color.dryRunWarningMessage
      : ansi.color.warningMessage
    if (options?.label !== false) {
      this.stdout(
        `${ansi.label.warning}${labelColor(':')} ${message}`,
      )
    } else {
      this.stdout(messageColor(message))
    }
  }

  public error(
    message: string,
    options?: { label?: boolean /* default: true */ },
  ): void {
    const ansi = this.ansi
    if (options?.label !== false) {
      this.stderr(
        `${ansi.label.error}${ansi.color.errorLabel(':')} ${message}`,
      )
    } else {
      this.stderr(ansi.color.errorMessage(message))
    }
  }

  public hint(
    message: string,
    options?: { label?: boolean /* default: true */ },
  ): void {
    const ansi = this.ansi
    if (options?.label !== false) {
      this.stdout(ansi.color.hintMessage(`${ansi.label.hint}: ${message}`))
    } else {
      this.stdout(ansi.color.hintMessage(message))
    }
  }

  public newLine() {
    this.logger.write(LINE_FEED, { prefix: false })
  }
}

function Ansi(colors: cliffy.ansi.Colors, colorSupported: boolean): Ansi {
  const color = colorSupported
    ? {
      command: colors.yellow,
      commandLabel: colors.brightYellow,
      successMessage: colors.green,
      successLabel: colors.brightGreen,
      warningMessage: colors.yellow,
      warningLabel: colors.brightYellow,
      errorMessage: colors.red,
      errorLabel: colors.brightRed,
      hintMessage: colors.gray,
      hintLabel: colors.gray,
      dryRunWarningMessage: colors.magenta,
      dryRunWarningLabel: colors.brightMagenta,
    }
    : {
      command: (message: string) => message,
      commandLabel: (message: string) => message,
      successMessage: (message: string) => message,
      successLabel: (message: string) => message,
      warningMessage: (message: string) => message,
      warningLabel: (message: string) => message,
      errorMessage: (message: string) => message,
      errorLabel: (message: string) => message,
      hintMessage: (message: string) => message,
      hintLabel: (message: string) => message,
      dryRunWarningMessage: (message: string) => message,
      dryRunWarningLabel: (message: string) => message,
    }
  const style = colorSupported
    ? {
      command: colors.bold,
      success: colors.bold,
      label: colors.bold,
      target: (message: string) => colors.cyan(colors.bold(message)),
      packagePath: colors.blue,
      packageName: colors.bold,
      errorPackageName: (message: string) =>
        colors.yellow(colors.bold(message)),
      verbose: colors.gray,
      debug: colors.blue,
    }
    : {
      command: (message: string) => message,
      success: (message: string) => message,
      label: (message: string) => message,
      target: (message: string) => message,
      packagePath: (message: string) => message,
      packageName: (message: string) => message,
      errorPackageName: (message: string) => message,
      verbose: (message: string) => message,
      debug: (message: string) => message,
    }
  const label = {
    success: color.successLabel(style.label('SUCCESS')),
    warning: color.warningLabel(style.label('WARNING')),
    error: color.errorLabel(style.label('ERROR')),
    failed: color.errorLabel(style.label('FAILED')),
    hint: color.hintLabel(style.label('HINT')),
    running: color.commandLabel(style.label('RUNNING')),
    check: colors.brightGreen(style.label('✓')),
  }
  return { color, label, style }
}

const encoder = new TextEncoder()

function consoleWidth(): number {
  try {
    return Deno.consoleSize().columns
  } catch {
    return 80
  }
}

function writeLine(writer: Deno.Writer & Deno.WriterSync, message: string) {
  write(writer, message + LINE_FEED)
}

function write(writer: Deno.Writer & Deno.WriterSync, message: string) {
  writer.writeSync(encoder.encode(message))
}
