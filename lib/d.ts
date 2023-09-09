import { Context } from './context/mod.ts'
import { parseArgs } from './options/mod.ts'
import { DProject } from './project/mod.ts'

/**
 * The entry point of the `d` CLI application.
 *
 * ## Required permissions
 *
 * - `--allow-read`
 * - `--allow-write`
 * - `--allow-run`
 * - `--allow-env`
 * - `--allow-net`
 */
export async function dMain(cwd: string, args: string[]) {
  const flags = await parseArgs(cwd, args)
  console.error('flags=', flags)

  const context = Context.fromFlags(flags)
  const { logger } = context
  // logger.debug('flags=', flags)

  // if (flags._.length === 0) {
  //   throw new DError('No command specified')
  // }

  const project = await DProject.fromContext(context)
  // const dependencyGraph = DependencyGraph.fromDartProjects(project.dartProjects)

  // if (context.debug) {
  //   logger.debug(
  //     logger.ansi.style.success('Analyzed dependency graph:') +
  //       `\n` +
  //       cliffy.table.Table.from(
  //         dependencyGraph.projects.map((node) => [
  //           node.name,
  //           node.path,
  //           dependencyGraph.dependenciesOf(node).map((dep) => dep.name).join(
  //             '\n',
  //           ),
  //           dependencyGraph.dependentsOf(node).map((dep) => dep.name).join(
  //             '\n',
  //           ),
  //         ]),
  //       )
  //         .header(['name', 'path', 'dependencies', 'reverse dependencies'])
  //         .border(true)
  //         .toString(),
  //   )
  // }

  // const subcommand = flags._[0]
  // const subcommandArgs = flags._.slice(1)
  // const otherFlags = flags['--']

  // logger.debug('subcommand=', subcommand)
  // logger.debug('subcommandArgs=', subcommandArgs)
  // logger.debug('otherFlags=', otherFlags)
}
