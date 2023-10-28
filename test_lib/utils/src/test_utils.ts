import { assert, Buffer, std } from 'test/deps.ts'
import { LINE_FEED } from 'util/mod.ts'

export async function writeTextFile(path: string, text: string): Promise<void> {
  await std.fs.ensureDir(std.path.dirname(path))
  await Deno.writeTextFile(path, text)
}

export function touch(path: string): Promise<void> {
  return writeTextFile(path, '')
}

export function writeYamlFile(
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  return writeTextFile(path, std.yaml.stringify(data))
}

export function removeIndent(s: string): string {
  const lines = s.split('\n')
  const firstLine = lines.find((line) => line.trim().length > 0) ?? ''
  const indent = firstLine.match(/^\s+/)
  if (indent) {
    return lines.map((line) => line.replace(indent[0], '')).join('\n')
  }
  return s
}

export function buildStringFromBuffer(buffer: Buffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer.bytes())
}

export function buildStringLinesFromBuffer(buffer: Buffer): string[] {
  return buildStringFromBuffer(buffer).split(LINE_FEED)
}

export function buildAbsPath(...paths: string[]): string {
  return std.path.join(Deno.cwd(), ...paths)
}

export function assertFileExists(...paths: string[]): void {
  const path = std.path.join(...paths)
  assert(
    std.fs.existsSync(path, { isFile: true }),
    `File not found: ${path}`,
  )
}

export function assertFileNotExists(...paths: string[]): void {
  const path = std.path.join(...paths)
  assert(!std.fs.existsSync(path, { isFile: true }), `File found: ${path}`)
}

export function assertDirectoryExists(path: string): void {
  assert(
    std.fs.existsSync(path, { isDirectory: true }),
    `Directory not found: ${path}`,
  )
}

export function assertDirectoryNotExists(path: string): void {
  assert(
    !std.fs.existsSync(path, { isDirectory: true }),
    `Directory found: ${path}`,
  )
}

export function bufferToString(buffer: Buffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer.bytes())
}

export function extractPackageNamesInOrder(buffer: Buffer | string): string[] {
  const lines = typeof buffer === 'string'
    ? buffer.split('\n')
    : bufferToString(buffer).split('\n')
  const packageNames = new Set(lines.flatMap((line) => {
    const matchArray = line.match(/^\[([^\]]+?)\]/)
    if (matchArray) {
      return matchArray[1]
    } else {
      return []
    }
  }))
  return [...packageNames]
}
