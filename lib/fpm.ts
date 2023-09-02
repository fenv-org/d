import { FpmContext } from './context/mod.ts'
import { std_flags } from './deps.ts'
import { FpmLogger, Logger } from './logger/mod.ts'

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
export function fpm(args: string[]) {
  const flags = std_flags.parse(args, {
    stopEarly: true,
    string: ['pwd'],
    boolean: ['verbose', 'debug'],
    alias: { pwd: 'c', verbose: 'V' },
    '--': true,
    default: {
      pwd: Deno.cwd(),
      verbose: false,
      debug: false,
    },
    unknown: (arg) => {
      if (arg.startsWith('-')) {
        const logger = new FpmLogger(Logger.standard())
        logger.error(`Unknown option: ${arg}`)
        Deno.exit(1)
      }
    },
  })

  const context = FpmContext.fromFlags(flags)
  const { logger } = context
  logger.debug('flags=', flags)

  if (flags._.length === 0) {
    logger.error('No command specified.')
    Deno.exit(1)
  }

  const subcommand = flags._[0]
  const subcommandArgs = flags._.slice(1)
  const otherFlags = flags['--']

  logger.debug('subcommand=', subcommand)
  logger.debug('subcommandArgs=', subcommandArgs)
  logger.debug('otherFlags=', otherFlags)
}
