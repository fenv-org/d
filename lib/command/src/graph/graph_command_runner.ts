import { cliffy, std } from 'deps.ts'
import { Context } from '../../../context/mod.ts'
import { DependencyGraph } from '../../../dart/mod.ts'
import { Workspace } from '../../../workspace/mod.ts'

export function runGraphCommand(options: {
  context: Context
  workspace: Workspace
}): void {
  const { context, workspace } = options
  const dependencyGraph = DependencyGraph.fromDartProjects(
    workspace.dartProjects,
  )

  const tabularGraphRepresentation = cliffy.table.Table
    .from(
      dependencyGraph.projects.map((node) => [
        node.name,
        std.path.relative(workspace.workspaceDir, node.path),
        dependencyGraph.dependenciesOf(node).map((dep) => dep.name).join(
          '\n',
        ),
        dependencyGraph.dependentsOf(node).map((dep) => dep.name).join(
          '\n',
        ),
      ]),
    )
    .header(['name', 'path', 'dependencies', 'dependents'])
    .border(true)
    .toString()
    .split('\n')

  const { logger } = context
  logger.stdout({ timestamp: true })
    .push((s) => s.bold('Analyzed dependency graph: '))
    .push('the base directory path is ')
    .push(`\`${workspace.workspaceDir}\``)
    .lineFeed()
  for (const line of tabularGraphRepresentation) {
    logger.stdout().push(line).lineFeed()
  }
}
