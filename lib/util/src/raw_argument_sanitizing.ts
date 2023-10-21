/**
 * Sanitizes the given {@link rawArgs} by removing the given {@link flags} and
 * {@link options}.
 */
export function sanitizeRawArguments(rawArgs: string[], {
  flags = [],
  options = [],
}: {
  /**
   * The flags that should be removed from the given {@link rawArgs}.
   *
   * A flag doesn't require a value.
   */
  flags?: string[]
  /**
   * The options that should be removed from the given {@link rawArgs}.
   *
   * An option requires a value.
   */
  options?: string[]
}) {
  const args: string[] = []
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]
    if (flags.includes(arg)) continue
    if (options.includes(arg)) {
      i++
      continue
    }
    if (options.find((option) => arg.startsWith(`${option}=`))) continue
    args.push(arg)
  }
  return args
}
