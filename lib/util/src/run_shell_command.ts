import { DartProject } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { Logger } from 'logger/mod.ts'
import { ByteStreams } from './io.ts'

export type ShellCommandOptions =
  & Omit<Deno.CommandOptions, 'cwd'>
  & {
    logger?: Logger
    workspacePath: string
    dartProject: DartProject
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
  options: ShellCommandOptions,
): Promise<Deno.CommandStatus> {
  const logger = options.logger
  const cwd = options.dartProject
    ? options.cwd
      ? std.path.isAbsolute(options.cwd)
        ? options.cwd
        : std.path.join(options.dartProject.path, options.cwd)
      : options.dartProject.path
    : options.cwd
  let denoCommand: Deno.Command
  if (Deno.build.os === 'windows') {
    denoCommand = new Deno.Command(command, {
      ...options,
      stdout: logger ? 'piped' : undefined,
      stderr: logger ? 'piped' : undefined,
      cwd,
    })
  } else {
    setReservedEnvironmentVariables(
      options.workspacePath,
      options.dartProject,
    )
    // Runs the given command with `bash -c` instead of running it directly.
    // This is a workaround of the problem that Deno resolves symlinks to
    // real paths.
    const cdCommand = cwd ? `cd ${escapeForShell(cwd)} && ` : ''
    const totalCommand = cdCommand + escapeForShell([
      resolveVariables(command),
      ...options.args?.map(resolveVariables) ?? [],
    ])
    denoCommand = new Deno.Command('bash', {
      ...options,
      args: ['-c', totalCommand],
      stdout: logger ? 'piped' : undefined,
      stderr: logger ? 'piped' : undefined,
      cwd: undefined,
    })
  }

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

function escapeForShell(args: string[] | string): string {
  args = typeof args === 'string' ? [args] : args
  return args.map((arg) => `'${arg.replace(/'/g, '\'\\\'\'')}'`).join(' ')
}

/**
 * Sets the following environment variables:
 *
 * - `$WORKSPACE_PATH`: The absolute path to the workspace root directory.
 * - `$PACKAGE_PATH`: The absolute path to the package root directory.
 * - `$PACKAGE_NAME`: The name of the package.
 */
function setReservedEnvironmentVariables(
  workspacePath: string,
  project: DartProject,
) {
  Deno.env.set('WORKSPACE_PATH', workspacePath)
  Deno.env.set('PACKAGE_PATH', project.path)
  Deno.env.set('PACKAGE_NAME', project.name)
}

function resolveVariables(arg: string): string {
  // The pattern that extracts the name of variable starting with `$`.
  // For example:
  // - `$WORKSPACE_PATH` -> `WORKSPACE_PATH`
  // - `${PACKAGE_PATH}` -> `PACKAGE_PATH`
  // - `${PACKAGE_PATH}_WORD` -> `PACKAGE_PATH`
  const variableRegex = /\$({?)(?<variable>[A-Za-z_][A-Za-z0-9_]*)(}?)/g
  const segments: string[] = []
  let match: RegExpExecArray | null
  let cursor = 0
  while ((match = variableRegex.exec(arg)) !== null) {
    segments.push(arg.slice(cursor, match.index))
    const variable = match.groups?.variable!
    const segment = Deno.env.get(variable) ?? match[0]
    segments.push(segment)
    cursor = variableRegex.lastIndex
  }
  segments.push(arg.slice(cursor))
  return segments.join('')
}
