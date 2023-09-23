import { VisitResult } from '../../../concurrency/mod.ts'
import { Context } from '../../../context/mod.ts'
import { std } from '../../../deps.ts'
import { Logger, logLabels } from '../../../logger/mod.ts'
import { ByteStreams } from '../../../util/mod.ts'
import { Workspace } from '../../../workspace/mod.ts'

export async function runFlutterPubGet(
  node: string,
  options: {
    context: Context
    workspace: Workspace
  },
): Promise<VisitResult> {
  const { context, workspace } = options
  const { logger } = context
  const dartProject = workspace.dartProjects.find((project) =>
    project.name === node
  )!

  logger.stdout({ timestamp: true })
    .package(node)
    .push((s) => s.bold('Running: '))
    .lineFeed()

  const relativePackageDirectory = std.path.relative(
    workspace.workspaceDir,
    dartProject.path,
  )
  logger.stdout({ timestamp: true })
    .indent()
    .childArrow()
    .push((s) => s.cyan.bold(`package directory: ${relativePackageDirectory}`))
    .lineFeed()

  logger.stdout({ timestamp: true })
    .indent(2)
    .childArrow()
    .command('flutter pub get', { withDollarSign: true })
    .lineFeed()

  const command = new Deno.Command(
    'flutter',
    {
      args: ['pub', 'get'],
      cwd: dartProject.path,
      stdout: 'piped',
      stderr: 'piped',
    },
  )
  const child = command.spawn()

  await Promise.all([
    outputStdout({ logger, packageName: node, stdout: child.stdout }),
    outputStderr({ logger, packageName: node, stderr: child.stderr }),
  ])

  const output = await child.status
  if (!output.success) {
    logger.stderr()
      .label(logLabels.error)
      .package(node)
      .push((s) => s.red(`Ends with code: ${output.code}`))
      .lineFeed()
    return { kind: 'stop', code: output.code }
  }
  return { kind: 'continue' }
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
