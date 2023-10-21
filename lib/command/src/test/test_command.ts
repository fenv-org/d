import { cliffy } from 'deps.ts'

/**
 * `test` subcommand.
 */
export function testCommand() {
  return new cliffy.command.Command()
    .description('Commands for managing Flutter packages.')
    .arguments(`[args...]`)
    .option('-*, --* [flags]', 'Forward all arguments to `flutter test`.', {
      collect: true,
    })
    .allowEmpty(true)
    .stopEarly()
}
