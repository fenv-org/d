import { cliffy } from '../../deps.ts'
import { DError } from '../../error/mod.ts'

export function fileOrGlobType(
  { label, name, value }: cliffy.command.ArgumentValue,
): string {
  if (value.endsWith('/')) {
    throw new DError(
      `${label} "${name}" must be a file or a glob for files: "${value}"`,
    )
  }
  return value
}
