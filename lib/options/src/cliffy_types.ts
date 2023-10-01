import { cliffy } from 'deps.ts'
import { DError } from 'error/mod.ts'

export class FileOrGlobType extends cliffy.command.FileType {
  parse({ label, name, value }: cliffy.command.ArgumentValue): string {
    if (value.endsWith('/')) {
      throw new DError(
        `${label} "${name}" must be a file or a glob for files: "${value}"`,
      )
    }
    return value
  }
}

export class DirOrGlobType extends cliffy.command.FileType {
  parse({ value }: cliffy.command.ArgumentValue): string {
    return value
  }
}
