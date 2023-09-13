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
  const { ansi } = logger

  logger.command('d bootstrap')

  const indentLogger = logger.indentIn()
  indentLogger.stdout(
    `${ansi.label.child} ${ansi.style.target(workspace.workspaceDir)}`,
  )

  if (flags.includeHasFile) {
    indentLogger.indentIn()
      .debug(
        ` [package filter] include has file=${
          JSON.stringify(flags.includeHasFile)
        }`,
      )
  }
  if (flags.excludeHasFile) {
    indentLogger.indentIn()
      .debug(
        ` [package filter] exclude has file=${
          JSON.stringify(flags.excludeHasFile)
        }`,
      )
  }
  if (flags.includeHasDir) {
    indentLogger.indentIn()
      .debug(
        ` [package filter] include has directory=${
          JSON.stringify(flags.includeHasDir)
        }`,
      )
  }
  if (flags.excludeHasDir) {
    indentLogger.indentIn()
      .debug(
        ` [package filter] exclude has directory=${
          JSON.stringify(flags.excludeHasDir)
        }`,
      )
  }

  const filteredWorkspace = await workspace.applyPackageFilterOptions(flags)
  console.log(filteredWorkspace)
}
