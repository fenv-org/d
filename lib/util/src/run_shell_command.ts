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
  const tempScriptFile = await makeTempScriptFile(options)
  try {
    await writeScriptFile(tempScriptFile, { ...options, command, cwd })

    const denoCommand = new Deno.Command('bash', {
      ...options,
      args: [tempScriptFile],
      stdout: logger ? 'piped' : undefined,
      stderr: logger ? 'piped' : undefined,
      env: overrideEnvironmentVariables(options),
      cwd: undefined,
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
  } finally {
    await Deno.remove(tempScriptFile)
  }
}

async function makeTempScriptFile(
  { workspacePath }: { workspacePath: string },
) {
  const tempDir = std.path.resolve(workspacePath, '.d', 'temp')
  await std.fs.ensureDir(tempDir)
  return await Deno.makeTempFile({
    dir: tempDir,
    prefix: 'script_',
    suffix: '.sh',
  })
}

async function writeScriptFile(
  filepath: string,
  { command, args, cwd }: {
    command: string
    args?: string[]
    cwd?: string
  },
) {
  const escape = (s: string) => `'${s.replace(/'/g, '\'\\\'\'')}'`
  await Deno.writeTextFile(
    filepath,
    [
      '#!/usr/bin/env bash',
      'set -e',
      'set -o pipefail',
      cwd ? `cd ${escapeForShell(cwd)}` : '',
      [command, ...(args ?? []).map(escape)].join(' '),
    ].join('\n'),
  )
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
 * - `$PWD`: The absolute path to the package root directory.
 */
function overrideEnvironmentVariables({
  workspacePath,
  dartProject,
}: {
  workspacePath: string
  dartProject: DartProject
}): Record<string, string> {
  return {
    WORKSPACE_PATH: workspacePath,
    PACKAGE_PATH: dartProject.path,
    PACKAGE_NAME: dartProject.name,
    PWD: dartProject.path,
  }
}
