import { cliffy_ansi } from '../../deps.ts'
import { Ansi } from './ansi.ts'

export abstract class Logger {
  static standard(options?: { debug: boolean }): Logger {
    return new StandardLogger(options)
  }

  static verbose(options?: { logTime?: boolean; debug: boolean }): Logger {
    return new VerboseLogger(options?.logTime ?? true, options?.debug ?? false)
  }

  public abstract get ansi(): Ansi

  public abstract get isVerbose(): boolean

  /** Print an error message. */
  public abstract stderr(message: string): void

  /** Print a standard status message. */
  public abstract stdout(message: string): void

  /** Print a debugging message. */
  // deno-lint-ignore no-explicit-any
  public abstract debug(...data: any[]): void

  /** Print trace output. */
  public abstract trace(message: string): void

  /** Print text to stdout, without a trailing newline. */
  public abstract write(message: string): void

  /** Print a character code to stdout, without a trailing newline. */
  public abstract writeCharCode(charCode: number): void

  public abstract horizontalLine(): void
}

class StandardLogger implements Logger {
  constructor(options?: { debug?: boolean }) {
    this.#debug = options?.debug ?? false
  }

  readonly #encoder = new TextEncoder()
  readonly #ansi = Ansi(cliffy_ansi.colors)
  readonly #debug: boolean

  public get ansi(): Ansi {
    return this.#ansi
  }

  public get isVerbose(): boolean {
    return false
  }

  public stderr(message: string): void {
    console.error(message)
  }

  public stdout(message: string): void {
    console.log(message)
  }

  // deno-lint-ignore no-explicit-any
  public debug(...data: any[]): void {
    if (this.#debug) {
      console.error(...data)
    }
  }

  public trace(_: string): void {
  }

  public write(message: string): void {
    Deno.stdout.write(this.#encoder.encode(message))
  }

  public writeCharCode(charCode: number): void {
    this.write(String.fromCharCode(charCode))
  }

  public horizontalLine(): void {
    this.stdout('─'.repeat(Deno.consoleSize().columns))
  }
}

class VerboseLogger implements Logger {
  readonly #startTime = new Date().getTime()
  readonly #encoder = new TextEncoder()
  readonly #ansi = Ansi(cliffy_ansi.colors)
  readonly #debug: boolean

  constructor(
    private readonly logTime: boolean = false,
    debug: boolean,
  ) {
    this.#debug = debug
  }

  public get ansi(): Ansi {
    return this.#ansi
  }

  public get isVerbose(): boolean {
    return true
  }

  public stdout(message: string): void {
    console.log(this._createPrefix() + message)
  }

  public stderr(message: string): void {
    console.error(this._createPrefix() + cliffy_ansi.colors.red(message))
  }

  // deno-lint-ignore no-explicit-any
  public debug(...data: any[]): void {
    if (this.#debug) {
      console.error(this._createPrefix(), ...data)
    }
  }

  public trace(message: string): void {
    console.log(this._createPrefix() + cliffy_ansi.colors.gray(message))
  }

  public write(message: string): void {
    Deno.stdout.write(this.#encoder.encode(message))
  }

  public writeCharCode(charCode: number): void {
    this.write(String.fromCharCode(charCode))
  }

  public horizontalLine(): void {
    const prefix = this._createPrefix()
    const columns = Deno.consoleSize().columns - prefix.length
    console.log(prefix + '─'.repeat(columns))
  }

  private _createPrefix(): string {
    if (!this.logTime) {
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

  public stderr(message: string): void {
    this.logger.stderr(message)
  }

  public stdout(message: string): void {
    this.logger.stdout(message)
  }

  // deno-lint-ignore no-explicit-any
  public debug(...data: any[]): void {
    this.logger.debug(...data)
  }

  public trace(message: string): void {
    this.logger.trace(message)
  }

  public write(message: string): void {
    this.logger.write(message)
  }

  public writeCharCode(charCode: number): void {
    this.logger.writeCharCode(charCode)
  }

  public horizontalLine(): void {
    this.logger.horizontalLine()
  }
}

export class FpmLogger extends DelegateLogger {
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
    this.logger.write('\n')
  }
}

function Ansi(colors: cliffy_ansi.Colors): Ansi {
  const color = {
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
  const style = {
    command: colors.bold,
    success: colors.bold,
    label: colors.bold,
    target: (message: string) => colors.cyan(colors.bold(message)),
    packagePath: colors.blue,
    packageName: colors.bold,
    errorPackageName: (message: string) => colors.yellow(colors.bold(message)),
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
