import { Context } from '../../../context/mod.ts'
import { Workspace } from '../../../workspace/mod.ts'
import { BootstrapOptions } from './bootstrap_command.ts'

export async function runBootstrapCommand(options: {
  context: Context
  workspace: Workspace
  flags: BootstrapOptions
}): Promise<void> {
  const { context, workspace, flags } = options
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d bootstrap')
    .lineFeed()

  logger.stdout({ timestamp: true }).indent()
    .childArrow()
    .push((s) => s.cyan.bold(`workspace directory: ${workspace.workspaceDir}`))
    .lineFeed()

  const filterDebugLogger = logger
    .stdout({ debug: true, timestamp: true })
    .indent(2)
  if (flags.includeHasFile) {
    filterDebugLogger
      .push('[package filter] include has file=')
      .push(JSON.stringify(flags.includeHasFile))
      .lineFeed()
  }
  if (flags.excludeHasFile) {
    filterDebugLogger
      .push('[package filter] exclude has file=')
      .push(JSON.stringify(flags.excludeHasFile))
      .lineFeed()
  }
  if (flags.includeHasDir) {
    filterDebugLogger
      .push('[package filter] include has directory=')
      .push(JSON.stringify(flags.includeHasDir))
      .lineFeed()
  }
  if (flags.excludeHasDir) {
    filterDebugLogger
      .push('[package filter] exclude has directory=')
      .push(JSON.stringify(flags.excludeHasDir))
      .lineFeed()
  }

  const filteredWorkspace = await workspace.applyPackageFilterOptions(flags)
  console.log(filteredWorkspace)
}
