import { DartProject } from '../../dart/mod.ts'
import { std } from '../../deps.ts'
import { Logger } from '../../logger/mod.ts'
import { ByteStreams } from './io.ts'

export type ShellCommandOptions =
  & Omit<Deno.CommandOptions, 'cwd'>
  & {
    logger?: Logger
    dartProject?: DartProject
    cwd?: string
  }

/**
 * Runs the given shell {@link command} with the given {@link options}.
 *
 * If `options.logger` is provided, the command's stdout and stderr will be
 * logged to the logger.
 */
export async function runShellCommand(
  command: string,
  options?: ShellCommandOptions,
): Promise<Deno.CommandStatus> {
  const logger = options?.logger
  const denoCommand = new Deno.Command(command, {
    ...options,
    stdout: logger ? 'piped' : undefined,
    stderr: logger ? 'piped' : undefined,
    cwd: options?.dartProject
      ? options?.cwd
        ? std.path.isAbsolute(options.cwd)
          ? options.cwd
          : std.path.join(options.dartProject.path, options.cwd)
        : options.dartProject.path
      : options?.cwd,
  })

  const child = denoCommand.spawn()
  if (logger && options.dartProject) {
    await Promise.all([
      outputStdout({
        logger,
        packageName: options.dartProject.name,
        stdout: child.stdout,
      }),
      outputStderr({
        logger,
        packageName: options.dartProject.name,
        stderr: child.stderr,
      }),
    ])
  }
  return await child.status
}

async function outputStdout(options: {
  logger: Logger
  packageName: string
  stdout: ReadableStream<Uint8Array>
}) {
  const { logger, packageName, stdout } = options
  for await (const line of ByteStreams.readLines(stdout)) {
    logger.stdout({ timestamp: true })
      .package(packageName)
      .push(line)
      .lineFeed()
  }
}

async function outputStderr(options: {
  logger: Logger
  packageName: string
  stderr: ReadableStream<Uint8Array>
}) {
  const { logger, packageName, stderr } = options
  for await (const line of ByteStreams.readLines(stderr)) {
    logger.stderr({ timestamp: true })
      .package(packageName)
      .push(line)
      .lineFeed()
  }
}
