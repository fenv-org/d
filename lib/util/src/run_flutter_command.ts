import { VisitResult } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { std } from 'deps.ts'
import { logLabels } from 'logger/mod.ts'
import { runShellCommand } from 'util/mod.ts'
import { Workspace } from 'workspace/mod.ts'

export async function runFlutterCommand(
  node: string,
  options: {
    args: string[]
    context: Context
    workspace: Workspace
  },
): Promise<VisitResult> {
  const { context, workspace, args } = options
  const { logger } = context
  const dartProject = workspace.dartProjects.find((project) =>
    project.name === node
  )!

  logger.stdout({ timestamp: true })
    .package(node)
    .push((s) => s.bold('Running: '))
    .lineFeed()

  let relativePackageDirectory = std.path.relative(
    workspace.workspaceDir,
    dartProject.path,
  )
  relativePackageDirectory = relativePackageDirectory === ''
    ? '.'
    : relativePackageDirectory
  logger.stdout({ timestamp: true })
    .indent()
    .childArrow()
    .push((s) => s.cyan.bold(`package directory: ${relativePackageDirectory}`))
    .lineFeed()

  logger.stdout({ timestamp: true })
    .indent(2)
    .childArrow()
    .command(`flutter ${args.join(' ')}`, { withDollarSign: true })
    .lineFeed()

  const output = await runShellCommand('flutter', { args, dartProject, logger })
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

export function runFlutterPubGet(
  node: string,
  options: {
    context: Context
    workspace: Workspace
  },
): Promise<VisitResult> {
  return runFlutterCommand(node, { args: ['pub', 'get'], ...options })
}

export function runFlutterClean(
  node: string,
  options: {
    context: Context
    workspace: Workspace
  },
): Promise<VisitResult> {
  return runFlutterCommand(node, { args: ['clean'], ...options })
}
