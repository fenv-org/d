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
  logger.indentIn()
    .stdout(`${ansi.label.child} ${ansi.style.target(workspace.workspaceDir)}`)
}
