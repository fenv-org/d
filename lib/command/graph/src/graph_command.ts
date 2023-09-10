import { Context } from '../../../context/mod.ts'
import { DependencyGraph } from '../../../dart/mod.ts'
import { cliffy, std } from '../../../deps.ts'
import { Workspace } from '../../../workspace/mod.ts'

export function graphCommand(options: {
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

  context.logger.success('Analyzed dependency graph:')
  for (const line of tabularGraphRepresentation) {
    context.logger.stdout(line)
  }
}
