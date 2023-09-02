import { FpmContext } from './context/mod.ts'
import { std_flags } from './deps.ts'

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
export function main() {
  const flags = std_flags.parse(Deno.args, {
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
  })

  const context = FpmContext.fromFlags(flags)
  if (context.debug) {
    console.log(context)
  }
}

main()
