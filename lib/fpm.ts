import { FpmContext } from './context/mod.ts'
import { cliffy_table, std_flags } from './deps.ts'
import { FpmError } from './error/src/fpm_error.ts'
import { FpmProject } from './project/mod.ts'
import { DependencyGraph } from './project/src/dependency_graph.ts'

/**
 * The entry point of the `fpm` CLI application.
 *
 * ## Required permissions
 *
 * - `--allow-read`
 * - `--allow-write`
 * - `--allow-run`
 * - `--allow-env`
 * - `--allow-net`
 */
export async function fpm(cwd: string, args: string[]) {
  const { args: normalizedArgs, verbose, debug } = parseGlobalArgs(args)
  const flags = {
    ...std_flags.parse(normalizedArgs, {
      stopEarly: true,
      string: ['cwd'],
      alias: { cwd: 'c' },
      '--': true,
      default: {
        cwd: cwd,
        verbose: false,
        debug: false,
      },
      unknown: (arg) => {
        if (arg.startsWith('-')) {
          throw new FpmError(`Unknown option: ${arg}`)
        }
      },
    }),
    verbose,
    debug,
  }

  const context = FpmContext.fromFlags(flags)
  const { logger } = context
  logger.debug('flags=', flags)

  if (flags._.length === 0) {
    throw new FpmError('No command specified')
  }

  const project = await FpmProject.fromContext(context)
  const dependencyGraph = DependencyGraph.fromDartProjects(project.dartProjects)

  if (context.debug) {
    logger.debug(
      logger.ansi.style.success('Analyzed dependency graph:') +
        `\n` +
        cliffy_table.Table.from(
          dependencyGraph.allNodes.map((node) => [
            node.name,
            node.path,
            node.dependencies.map((dep) => dep.name).join('\n'),
            node.reverseDependencies.map((dep) => dep.name).join('\n'),
          ]),
        )
          .header(['name', 'path', 'dependencies', 'reverse dependencies'])
          .border(true)
          .toString(),
    )
  }

  const subcommand = flags._[0]
  const subcommandArgs = flags._.slice(1)
  const otherFlags = flags['--']

  logger.debug('subcommand=', subcommand)
  logger.debug('subcommandArgs=', subcommandArgs)
  logger.debug('otherFlags=', otherFlags)
}

function parseGlobalArgs(args: string[]): {
  args: string[]
  verbose: boolean
  debug: boolean
} {
  const verbose = args.includes('-V') || args.includes('--verbose')
  const debug = args.includes('--debug')
  return {
    args: args.filter((arg) =>
      arg !== '--verbose' && arg !== '-V' && arg !== '--debug'
    ),
    verbose,
    debug,
  }
}
