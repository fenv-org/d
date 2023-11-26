import { cliffy } from 'deps.ts'
import { DError } from 'error/mod.ts'
import { number } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/flags/types/number.ts'

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

export class ParallelismType extends cliffy.command.NumberType {
  parse(type: cliffy.command.ArgumentValue): number {
    const value = number(type)
    if (value < 1) {
      throw new DError(
        `${type.label} "${type.name}" must be a positive integer: "${value}"`,
      )
    }
    return value
  }
}
