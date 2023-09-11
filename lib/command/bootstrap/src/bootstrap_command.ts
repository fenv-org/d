import { Context } from '../../../context/mod.ts'
import { BootstrapOptions } from '../../../options/mod.ts'
import { Workspace } from '../../../workspace/mod.ts'

export async function bootstrapCommand(options: {
  context: Context
  workspace: Workspace
  flags: BootstrapOptions
}): Promise<void> {
  const { context, workspace, flags } = options
  const { logger } = context
  const { ansi } = logger

  logger.command('d bootstrap')
  logger.indentIn()
    .stdout(`${ansi.label.child} ${ansi.style.target(workspace.workspaceDir)}`)
}
